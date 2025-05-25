import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper'; // HTTP + zip

import macro from '@kitware/vtk.js/macros';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkSphereSource from '@kitware/vtk.js/Filters/Sources/SphereSource';
import vtkTexture from '@kitware/vtk.js/Rendering/Core/Texture';
import vtkImageGridSource from '@kitware/vtk.js/Filters/Sources/ImageGridSource';
import vtkOBJWriter from '@kitware/vtk.js/IO/Misc/OBJWriter';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const resetCamera = renderer.resetCamera;
const render = renderWindow.render;

const gridSource = vtkImageGridSource.newInstance();
gridSource.setDataExtent(0, 511, 0, 511, 0, 0);
gridSource.setGridSpacing(16, 16, 0);
gridSource.setGridOrigin(8, 8, 0);

const texture = vtkTexture.newInstance();
texture.setInterpolate(true);
texture.setInputConnection(gridSource.getOutputPort());

const sphereSource = vtkSphereSource.newInstance();
sphereSource.setThetaResolution(64);
sphereSource.setPhiResolution(32);

const actor = vtkActor.newInstance();
const mapper = vtkMapper.newInstance();

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

actor.setMapper(mapper);
actor.addTexture(texture);

renderer.addActor(actor);
resetCamera();
render();

const writer = vtkOBJWriter.newInstance({
  textureFileName: 'grid.png',
});
console.log(writer);

writer.setInputData(sphereSource.getOutputData(), 0);
writer.setInputData(gridSource.getOutputData(), 1);
writer.setTextureFileName('grid.png');

// const objContent = writer.getOutputData();
// const mtlContent = writer.getMtl();

const zip = writer.exportAsZIP();

// Can also use a static function to write to OBJ:
// const fileContents = vtkOBJWriter.writeOBJ(reader.getOutputData());

// Add a download link for it
const blob = new Blob([zip], {
  type: 'application/octet-steam',
});
const a = window.document.createElement('a');
a.href = window.URL.createObjectURL(blob, {
  type: 'application/zip',
});
a.download = 'sphere.zip';
a.text = 'Download';
a.style.position = 'absolute';
a.style.left = '50%';
a.style.bottom = '10px';
document.body.appendChild(a);
a.style.background = 'white';
a.style.padding = '5px';

global.writer = writer;
global.fullScreenRenderer = fullScreenRenderer;
