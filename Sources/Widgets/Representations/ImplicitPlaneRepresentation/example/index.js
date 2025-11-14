import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/All';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkImplicitPlaneRepresentation from '@kitware/vtk.js/Widgets/Representations/ImplicitPlaneRepresentation';

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
// State / Representation
// ----------------------------------------------------------------------------

const representation = vtkImplicitPlaneRepresentation.newInstance();

const state = vtkImplicitPlaneRepresentation.generateState();
representation.setInputData(state);

representation.getActors().forEach(renderer.addActor);

renderer.resetCamera();
renderer.resetCameraClippingRange();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

const gui = new GUI();
const params = {
  OriginX: 0,
  OriginY: 0,
  OriginZ: 0,
  NormalX: 0,
  NormalY: 0,
  NormalZ: 0,
  BoundsXMin: -0.5,
  BoundsXMax: 0.5,
  BoundsYMin: -0.5,
  BoundsYMax: 0.5,
  BoundsZMin: -0.5,
  BoundsZMax: 0.5,
};

function applyState() {
  const origin = [params.OriginX, params.OriginY, params.OriginZ];
  const normal = [params.NormalX, params.NormalY, params.NormalZ];
  const bounds = [
    params.BoundsXMin,
    params.BoundsXMax,
    params.BoundsYMin,
    params.BoundsYMax,
    params.BoundsZMin,
    params.BoundsZMax,
  ];

  state.set({
    origin,
    normal,
    bounds,
  });
  renderWindow.render();
}

const originFolder = gui.addFolder('Origin');
originFolder.add(params, 'OriginX', -0.5, 0.5, 0.01).onChange(applyState);
originFolder.add(params, 'OriginY', -0.5, 0.5, 0.01).onChange(applyState);
originFolder.add(params, 'OriginZ', -0.5, 0.5, 0.01).onChange(applyState);

const normalFolder = gui.addFolder('Normal');
normalFolder.add(params, 'NormalX', -0.5, 0.5, 0.01).onChange(applyState);
normalFolder.add(params, 'NormalY', -0.5, 0.5, 0.01).onChange(applyState);
normalFolder.add(params, 'NormalZ', -0.5, 0.5, 0.01).onChange(applyState);

const boundsFolder = gui.addFolder('Bounds');
boundsFolder.add(params, 'BoundsXMin', -2, 0, 0.01).onChange(applyState);
boundsFolder.add(params, 'BoundsXMax', 0, 2, 0.01).onChange(applyState);
boundsFolder.add(params, 'BoundsYMin', -2, 0, 0.01).onChange(applyState);
boundsFolder.add(params, 'BoundsYMax', 0, 2, 0.01).onChange(applyState);
boundsFolder.add(params, 'BoundsZMin', -2, 0, 0.01).onChange(applyState);
boundsFolder.add(params, 'BoundsZMax', 0, 2, 0.01).onChange(applyState);

function syncFromState() {
  const current = state.get();
  [params.OriginX, params.OriginY, params.OriginZ] = current.origin;
  [params.NormalX, params.NormalY, params.NormalZ] = current.normal;
  [
    params.BoundsXMin,
    params.BoundsXMax,
    params.BoundsYMin,
    params.BoundsYMax,
    params.BoundsZMin,
    params.BoundsZMax,
  ] = current.bounds;

  gui.folders?.forEach?.((f) =>
    f.controllers.forEach((c) => c.updateDisplay?.())
  );
}

syncFromState();
