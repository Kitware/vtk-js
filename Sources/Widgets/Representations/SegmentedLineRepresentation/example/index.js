import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/All';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkStateBuilder from '@kitware/vtk.js/Widgets/Core/StateBuilder';

import vtkSegmentedLineRepresentation from '@kitware/vtk.js/Widgets/Representations/SegmentedLineRepresentation';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// -----------------------------------------------------------
// State
// -----------------------------------------------------------

const compositeState = vtkStateBuilder
  .createBuilder()
  .addDynamicMixinState({
    labels: ['handles'],
    mixins: ['origin'],
    name: 'handle',
  })
  .build();

const z = -50;
const points = [
  [0, 0, z],
  [5, -5, z],
  [15, 5, z],
  [5, 10, z],
];
points.forEach((point) => {
  const handle = compositeState.addHandle();
  handle.setOrigin(point);
});

// -----------------------------------------------------------
// Representation
// -----------------------------------------------------------

const widgetRep = vtkSegmentedLineRepresentation.newInstance({
  scaleInPixels: false,
  close: true,
});
widgetRep.setInputData(compositeState);
widgetRep.setLabels(['handles']);
widgetRep.getActors().forEach(renderer.addActor);

renderer.resetCamera();
renderWindow.render();
