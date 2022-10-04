import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';
import 'vtk.js/Sources/Rendering/Profiles/Glyph';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkInteractorStyleImage from 'vtk.js/Sources/Interaction/Style/InteractorStyleImage';

import vtkWidgetManager from 'vtk.js/Sources/Widgets/Core/WidgetManager';
import vtkLabelWidget from 'vtk.js/Sources/Widgets/Widgets3D/LabelWidget';

import controlPanel from './controlPanel.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
const iStyle = vtkInteractorStyleImage.newInstance();
renderWindow.getInteractor().setInteractorStyle(iStyle);

const widgetManager = vtkWidgetManager.newInstance();
widgetManager.setRenderer(renderer);

renderer.resetCamera();
widgetManager.enablePicking();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

let currentHandle = null;

// Add a new label
document.querySelector('#addLabel').addEventListener('click', () => {
  const widget = vtkLabelWidget.newInstance();
  const handle = widgetManager.addWidget(widget);
  widgetManager.grabFocus(widget);

  // Update control panel when a label is selected
  handle.onStartInteractionEvent(() => {
    currentHandle = handle;
    document.getElementById('txtIpt').value = currentHandle.getText() || '';
    document.getElementById('fontSize').value =
      currentHandle.getFontProperties().fontSize || 16;
    document.getElementById('color').value =
      currentHandle.getFontProperties().fontColor || 'white';
  });
});

// Delete a label
document.querySelector('#deleteLabel').addEventListener('click', () => {
  if (currentHandle) {
    currentHandle.reset();
    widgetManager.removeWidget(currentHandle);
    currentHandle = null;
  }
});

// Update text
function updateText() {
  const input = document.getElementById('txtIpt').value;
  if (currentHandle) {
    currentHandle.setText(input);
    renderWindow.render();
  }
}
document.querySelector('#txtIpt').addEventListener('keyup', updateText);

// Update font size
function updateFontSize() {
  const input = document.getElementById('fontSize').value;
  if (currentHandle) {
    currentHandle.setFontProperties({
      ...currentHandle.getFontProperties(),
      fontSize: input,
    });
    renderWindow.getInteractor().render();
  }
}
document.querySelector('#fontSize').addEventListener('input', updateFontSize);

// Update color
function updateColor() {
  const input = document.getElementById('color').value;
  if (currentHandle) {
    currentHandle.setFontProperties({
      ...currentHandle.getFontProperties(),
      fontColor: input,
    });
  }
}
document.querySelector('#color').addEventListener('input', updateColor);
