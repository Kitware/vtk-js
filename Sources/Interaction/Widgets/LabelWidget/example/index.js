import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import vtkLabelWidget from 'vtk.js/Sources/Interaction/Widgets/LabelWidget';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';

import TextAlign from 'vtk.js/Sources/Interaction/Widgets/LabelRepresentation/Constants';

// ----------------------------------------------------------------------------
// USER AVAILABLE INTERACTIONS
// ----------------------------------------------------------------------------
// Text can be translated

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
renderWindow.getInteractor().setInteractorStyle(null);

// ----------------------------------------------------------------------------
// Create widget
// ----------------------------------------------------------------------------

const widget = vtkLabelWidget.newInstance();
widget.setInteractor(renderWindow.getInteractor());
widget.setEnabled(1);
widget.getWidgetRep().setLabelText('Hello world!\nThis is an example!');

const widget2 = vtkLabelWidget.newInstance();
widget2.setInteractor(renderWindow.getInteractor());
widget2.setEnabled(1);
widget2.getWidgetRep().setLabelText('And I am the second one!');
widget2.getWidgetRep().setLabelStyle({
  fontSize: 12,
  strokeColor: 'red',
});
widget2.getWidgetRep().setWorldPosition([3, 1, 10]);

const widget3 = vtkLabelWidget.newInstance();
widget3.setInteractor(renderWindow.getInteractor());
widget3.setEnabled(1);
widget3.getWidgetRep().setLabelText('This text is\nright aligned!');
widget3.getWidgetRep().setTextAlign(TextAlign.RIGHT);
widget3.getWidgetRep().setWorldPosition([1, -3, 10]);

const widget4 = vtkLabelWidget.newInstance();
widget4.setInteractor(renderWindow.getInteractor());
widget4.setEnabled(1);
widget4.getWidgetRep().setLabelText('This text is\ncentered!');
widget4.getWidgetRep().setTextAlign(TextAlign.CENTER);
widget4.getWidgetRep().setWorldPosition([-3, -2, 10]);

renderer.resetCamera();
renderWindow.render();
