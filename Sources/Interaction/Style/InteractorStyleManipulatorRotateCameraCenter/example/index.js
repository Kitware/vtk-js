import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkInteractorStyleManipulator from '@kitware/vtk.js/Interaction/Style/InteractorStyleManipulator';
import vtkMouseCameraTrackballRotateManipulator from '@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballRotateManipulator';
import vtkMouseCameraTrackballPanManipulatorAutoCenter from '@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballPanManipulatorAutoCenter';
import vtkMouseCameraTrackballZoomManipulator from '@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballZoomManipulator';

// This example demonstrates the MouseCameraTrackballPanManipulatorAutoCenter
// which automatically adjusts the center of rotation during panning

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

// Use standard InteractorStyleManipulator
const interactorStyle = vtkInteractorStyleManipulator.newInstance();
fullScreenRenderer.getInteractor().setInteractorStyle(interactorStyle);

// ----------------------------------------------------------------------------
// Create cone (main object)
// ----------------------------------------------------------------------------

const coneSource = vtkConeSource.newInstance({ height: 1.0 });
const coneMapper = vtkMapper.newInstance();
coneMapper.setInputConnection(coneSource.getOutputPort());

const coneActor = vtkActor.newInstance();
coneActor.setMapper(coneMapper);
coneActor.getProperty().setColor(0.5, 0.5, 1.0);

// ----------------------------------------------------------------------------
// Add actors and setup camera
// ----------------------------------------------------------------------------

renderer.addActor(coneActor);
renderer.resetCamera();

// ----------------------------------------------------------------------------
// Setup manipulators
// ----------------------------------------------------------------------------

// Rotate with left button
const rotateManipulator =
  vtkMouseCameraTrackballRotateManipulator.newInstance();
rotateManipulator.setButton(1); // Left button
interactorStyle.addMouseManipulator(rotateManipulator);

// Zoom with middle button
const middleZoomManipulator =
  vtkMouseCameraTrackballZoomManipulator.newInstance();
middleZoomManipulator.setButton(2); // Middle button
interactorStyle.addMouseManipulator(middleZoomManipulator);

// Pan with shift + left button - with auto-adjust enabled
const shiftPanManipulator =
  vtkMouseCameraTrackballPanManipulatorAutoCenter.newInstance();
shiftPanManipulator.setButton(1);
shiftPanManipulator.setShift(true);
interactorStyle.addMouseManipulator(shiftPanManipulator);

// Pan with right button - with auto-adjust enabled
const rightPanManipulator =
  vtkMouseCameraTrackballPanManipulatorAutoCenter.newInstance();
rightPanManipulator.setButton(3); // Right button
interactorStyle.addMouseManipulator(rightPanManipulator);

// Zoom with mouse wheel
const wheelZoomManipulator =
  vtkMouseCameraTrackballZoomManipulator.newInstance();
wheelZoomManipulator.setScrollEnabled(true);
wheelZoomManipulator.setDragEnabled(false);
interactorStyle.addMouseManipulator(wheelZoomManipulator);

// Can't use touch devices as they are not updating the center of rotation on pan
// interactorStyle.addGestureManipulator(
//   vtkGestureCameraManipulator.newInstance()
// );

renderWindow.render();

const infoDiv = document.createElement('div');
infoDiv.style.position = 'absolute';
infoDiv.style.top = '10px';
infoDiv.style.left = '10px';
infoDiv.style.padding = '10px';
infoDiv.style.background = 'rgba(255, 255, 255, 0.9)';
infoDiv.style.borderRadius = '5px';
infoDiv.style.fontFamily = 'monospace';
infoDiv.style.maxWidth = '400px';

infoDiv.innerHTML = `
  <h3>Auto-Adjusting Center of Rotation Demo</h3>
  <p>The center of rotation automatically moves with the camera during panning, maintaining consistent rotation behavior relative to the camera position.</p>
  <p><strong>Controls:</strong></p>
  <ul>
    <li>Left Mouse: Rotate around center</li>
    <li>Middle Mouse: Zoom</li>
    <li>Right Mouse or Shift+Left: Pan (center adjusts automatically)</li>
    <li>Mouse Wheel: Zoom</li>
  </ul>
  <p><strong>Try this:</strong> Try to rotate around the tip of the cone.</p>
`;
document.body.appendChild(infoDiv);

// -----------------------------------------------------------
//  globals for debugging
// -----------------------------------------------------------

global.coneSource = coneSource;
global.coneActor = coneActor;
global.renderer = renderer;
global.renderWindow = renderWindow;
global.interactorStyle = interactorStyle;
