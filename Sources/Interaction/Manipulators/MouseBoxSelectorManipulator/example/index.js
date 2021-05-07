import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkInteractorStyleManipulator from 'vtk.js/Sources/Interaction/Style/InteractorStyleManipulator';

import Manipulators from 'vtk.js/Sources/Interaction/Manipulators';

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
