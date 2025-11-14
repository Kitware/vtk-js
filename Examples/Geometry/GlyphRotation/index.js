import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import '@kitware/vtk.js/Rendering/Profiles/Glyph';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkSphereSource from '@kitware/vtk.js/Filters/Sources/SphereSource';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData';
import vtkGlyph3DMapper from '@kitware/vtk.js/Rendering/Core/Glyph3DMapper';

import {
  ColorMode,
  ScalarMode,
} from '@kitware/vtk.js/Rendering/Core/Mapper/Constants';

import { OrientationModes } from '@kitware/vtk.js/Rendering/Core/Glyph3DMapper/Constants';

import GUI from 'lil-gui';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Add field to help in understanding the orientation
// ----------------------------------------------------------------------------

function addBeachBallColor(ds) {
  const xyz = ds.getPoints().getData();
  const rgb = new Uint8Array(xyz.length);
  rgb.fill(0);
  for (let i = 0; i < xyz.length; i += 3) {
    const colorIdx =
      Math.sign(xyz[i]) * Math.sign(xyz[i + 1]) > 0
        ? 0 // red
        : 2; // blue
    rgb[i + colorIdx] = 128;
    if (xyz[i + 2] > 0) {
      // +Z add some light
      rgb[i + 0] += 64;
      rgb[i + 1] += 64;
      rgb[i + 2] += 64;
    }
    if (xyz[i + 1] > 0) {
      // +Y add some light
      rgb[i + 0] += 64;
      rgb[i + 1] += 64;
      rgb[i + 2] += 64;
    }
  }

  ds.getPointData().setScalars(
    vtkDataArray.newInstance({
      name: 'color',
      numberOfComponents: 3,
      values: rgb,
    })
  );

  return ds;
}

// ----------------------------------------------------------------------------
// Glyph definition
// ----------------------------------------------------------------------------

const sphereSource = vtkSphereSource.newInstance({
  height: 1.0,
  phiResolution: 360,
  thetaResolution: 360,
});
const sphereDataset = addBeachBallColor(sphereSource.getOutputData());

// ----------------------------------------------------------------------------
// Grid on which to map the glyph
// x: 3, y: 2, z: 1
// ----------------------------------------------------------------------------

const baseGrid = vtkPolyData.newInstance();
// prettier-ignore
baseGrid.getPoints().setData(Float32Array.from([
  0, 0, 0,
  1, 0, 0,
  2, 0, 0,
  0, 1, 0,
  1, 1, 0,
]), 3);

const anglesArray = new Float32Array(5 * 3);
const anglesDataArray = vtkDataArray.newInstance({
  name: 'angles',
  values: anglesArray,
  numberOfComponents: 3,
});
baseGrid.getPointData().addArray(anglesDataArray);

// ----------------------------------------------------------------------------
// Rendering setup
// ----------------------------------------------------------------------------

const mapper = vtkGlyph3DMapper.newInstance({
  colorByArrayName: 'color',
  colorMode: ColorMode.DIRECT_SCALARS,
  scalarMode: ScalarMode.USE_POINT_FIELD_DATA,
  scalarVisibility: true,
  // Glyph handling
  orient: true,
  orientationMode: OrientationModes.ROTATION,
  orientationArray: 'angles',
});
mapper.setInputData(baseGrid, 0);
mapper.setInputData(sphereDataset, 1); // Glyph

const actor = vtkActor.newInstance();
actor.setMapper(mapper);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

const gui = new GUI();
const params = { AngleX: 0, AngleY: 0, AngleZ: 0, Angles: 'X(0), Y(0), Z(0)' };
function updateAngles() {
  const x = Number(params.AngleX);
  const y = Number(params.AngleY);
  const z = Number(params.AngleZ);
  for (let i = 0; i < anglesArray.length; i += 3) {
    anglesArray[i] = (Math.PI * x) / 180;
    anglesArray[i + 1] = (Math.PI * y) / 180;
    anglesArray[i + 2] = (Math.PI * z) / 180;
  }
  anglesDataArray.modified();
  baseGrid.modified();
  renderWindow.render();
  params.Angles = `X(${x}), Y(${y}), Z(${z})`;
}
gui.add(params, 'AngleX', 0, 90, 1).onChange(updateAngles);
gui.add(params, 'AngleY', 0, 90, 1).onChange(updateAngles);
gui.add(params, 'AngleZ', 0, 90, 1).onChange(updateAngles);
gui.add(params, 'Angles').listen().disable();
updateAngles();
