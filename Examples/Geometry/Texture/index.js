import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';

import macro from 'vtk.js/Sources/macros';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageGridSource from 'vtk.js/Sources/Filters/Sources/ImageGridSource';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const actor = vtkActor.newInstance();
renderer.addActor(actor);

const mapper = vtkMapper.newInstance();
actor.setMapper(mapper);

const sphereSource = vtkSphereSource.newInstance();
sphereSource.setThetaResolution(64);
sphereSource.setPhiResolution(32);

// create a filter on the fly to generate tcoords from normals
const tcoordFilter = macro.newInstance((publicAPI, model) => {
  macro.obj(publicAPI, model); // make it an object
  macro.algo(publicAPI, model, 1, 1); // mixin algorithm code 1 in, 1 out
  publicAPI.requestData = (inData, outData) => {
    // implement requestData
    if (!outData[0] || inData[0].getMTime() > outData[0].getMTime()) {
      // use the normals to generate tcoords :-)
      const norms = inData[0].getPointData().getNormals();

      const newArray = new Float32Array(norms.getNumberOfTuples() * 2);
      const ndata = norms.getData();
      for (let i = 0; i < newArray.length; i += 2) {
        newArray[i] =
          Math.abs(Math.atan2(ndata[(i / 2) * 3], ndata[(i / 2) * 3 + 1])) /
          3.1415927;
        newArray[i + 1] = Math.asin(ndata[(i / 2) * 3 + 2] / 3.1415927) + 0.5;
      }

      const da = vtkDataArray.newInstance({
        numberOfComponents: 2,
        values: newArray,
      });
      da.setName('tcoord');

      const pd = vtkPolyData.newInstance();
      pd.setPolys(inData[0].getPolys());
      pd.setPoints(inData[0].getPoints());
      const cpd = pd.getPointData();
      cpd.addArray(da);
      cpd.setActiveTCoords(da.getName());
      outData[0] = pd;
    }
  };
})();

tcoordFilter.setInputConnection(sphereSource.getOutputPort());
mapper.setInputConnection(tcoordFilter.getOutputPort());

const gridSource = vtkImageGridSource.newInstance();
gridSource.setDataExtent(0, 511, 0, 511, 0, 0);
gridSource.setGridSpacing(16, 16, 0);
gridSource.setGridOrigin(8, 8, 0);

const texture = vtkTexture.newInstance();
texture.setInterpolate(true);
texture.setInputConnection(gridSource.getOutputPort());
actor.addTexture(texture);

// Re-render
renderer.resetCamera();
renderWindow.render();
