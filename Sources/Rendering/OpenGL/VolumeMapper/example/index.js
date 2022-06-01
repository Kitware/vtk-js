// ----------------------------------------------------------------------------
// A volume sphere example to visualize the effect of computeNormalFromOpacity
// ----------------------------------------------------------------------------
import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Volume';
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkLight from 'vtk.js/Sources/Rendering/Core/Light';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

// ----------------------------------------------------------------------------
// Rendering code setup
// ----------------------------------------------------------------------------
const style = {
  margin: '0',
  padding: '0',
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100vw',
  height: '100vw',
  overflow: 'hidden',
};

const fullScreenRenderWindow = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
  containerStyle: style,
});
const renderWindow = fullScreenRenderWindow.getRenderWindow();
const renderer = fullScreenRenderWindow.getRenderer();
renderer.setBackground(0.2, 0.2, 0.2);
renderer.setTwoSidedLighting(false);

// ----------------------------------------------------------------------------
// Create actor for volume sphere
// ----------------------------------------------------------------------------
const actor = vtkVolume.newInstance();
const mapper = vtkVolumeMapper.newInstance();
actor.setMapper(mapper);

// create color and opacity transfer functions
const ctfun = vtkColorTransferFunction.newInstance();
ctfun.addRGBPoint(0.0, 0.196, 0.659, 0.337);
ctfun.addRGBPoint(255.0, 0.196, 0.659, 0.337);
const ofun = vtkPiecewiseFunction.newInstance();
ofun.addPoint(255.0, 0.0);
ofun.addPoint(0.0, 1.0);
// set actor properties
actor.getProperty().setRGBTransferFunction(0, ctfun);
actor.getProperty().setScalarOpacity(0, ofun);
actor.getProperty().setScalarOpacityUnitDistance(0, 0.05);
actor.getProperty().setAmbient(0.0);
actor.getProperty().setDiffuse(1.0);
actor.getProperty().setSpecular(0.0);
renderer.addVolume(actor);

// ----------------------------------------------------------------------------
// Fill in sphere data array
// ----------------------------------------------------------------------------
const dimension = [200, 200, 200];
const spacing = [0.05, 0.05, 0.05];
const origin = [0.0, 0.0, 0.0];
const id = vtkImageData.newInstance();
id.setOrigin(origin);
id.setSpacing(spacing);
id.setDimensions(dimension);

const newArray = new Float32Array(dimension[0] * dimension[1] * dimension[2]);
for (let z = 0; z < 200; z++) {
  for (let y = 0; y < 200; y++) {
    for (let x = 0; x < 200; x++) {
      const coords2 = [];
      coords2[0] = z - dimension[0] / 2;
      coords2[1] = y - dimension[1] / 2;
      coords2[2] = x - dimension[2] / 2;
      const dist2 =
        coords2[0] * coords2[0] +
        coords2[1] * coords2[1] +
        coords2[2] * coords2[2];
      const arrayIdx = x * dimension[0] * dimension[1] + y * dimension[0] + z;
      let val;
      if (dist2 > 0.2 * dimension[0] * dimension[0]) {
        val = 255.0;
      } else {
        val = dist2 / 32.0;
      }
      newArray[arrayIdx] = val;
    }
  }
}

const da = vtkDataArray.newInstance({
  numberOfComponents: 1,
  values: newArray,
});
da.setName('scalars');
const cpd = id.getPointData();
cpd.setScalars(da);
mapper.setInputData(id);

// ----------------------------------------------------------------------------
// Properties
// ----------------------------------------------------------------------------
// gradient opacity
const dataArray =
  id.getPointData().getScalars() || id.getPointData().getArrays()[0];
const dataRange = dataArray.getRange();
actor.getProperty().setGradientOpacityMinimumValue(0, 0);
actor
  .getProperty()
  .setGradientOpacityMaximumValue(0, (dataRange[1] - dataRange[0]) * 0.1);
actor.getProperty().setShade(true);
actor.getProperty().setUseGradientOpacity(0, true);
// generic good default
actor.getProperty().setGradientOpacityMinimumOpacity(0, 0.0);
actor.getProperty().setGradientOpacityMaximumOpacity(0, 1.0);

mapper.setSampleDistance(spacing[0]);
mapper.setComputeNormalFromOpacity(true);

// ----------------------------------------------------------------------------
// Light
// ----------------------------------------------------------------------------
renderer.removeAllLights();
const lightPosition = [origin[0] + 0.1, origin[1] + 0.1, origin[2] + 17.0];
const lightFocalPoint = origin;
const light = vtkLight.newInstance();
light.setPosition(lightPosition);
light.setPositional(true);
light.setLightType('SceneLight');
light.setFocalPoint(lightFocalPoint);
light.setColor(1, 1, 1);
light.setIntensity(1.0);
light.setConeAngle(60.0);
renderer.addLight(light);

// ----------------------------------------------------------------------------
// Visualize light position
// ----------------------------------------------------------------------------
if (light.getPositional()) {
  const sphereSource = vtkSphereSource.newInstance();
  const sphereActor = vtkActor.newInstance({
    position: lightPosition,
    scale: [0.5, 0.5, 0.5],
  });

  const sphereMapper = vtkMapper.newInstance();
  sphereActor.getProperty().setColor([1, 0, 0]);
  sphereActor.getProperty().setEdgeVisibility(true);
  sphereActor.getProperty().setLighting(false);

  sphereMapper.setInputConnection(sphereSource.getOutputPort());
  sphereActor.setMapper(sphereMapper);
  renderer.addActor(sphereActor);
}

renderer.resetCamera();
renderWindow.render();
