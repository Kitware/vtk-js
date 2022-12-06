import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkInteractorStyleManipulator from '@kitware/vtk.js/Interaction/Style/InteractorStyleManipulator';

import Manipulators from '@kitware/vtk.js/Interaction/Manipulators';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const boxSelector = Manipulators.vtkMouseBoxSelectorManipulator.newInstance({
  button: 1,
});
boxSelector.onBoxSelectChange(({ selection }) => {
  console.log('Apply selection:', selection.join(', '));
});
// boxSelector.onBoxSelectInput(console.log);

const iStyle = vtkInteractorStyleManipulator.newInstance();
iStyle.addMouseManipulator(boxSelector);
renderWindow.getInteractor().setInteractorStyle(iStyle);
