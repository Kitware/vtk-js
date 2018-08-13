import 'vtk.js/Sources/favicon';

import vtkLabelWidget from 'vtk.js/Sources/Interaction/Widgets/LabelWidget';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';

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
widget.getWidgetRep().setLabelText('Hello world! \n This is an example!');

const widget2 = vtkLabelWidget.newInstance();
widget2.setInteractor(renderWindow.getInteractor());
widget2.setEnabled(1);
widget2.getWidgetRep().setLabelText('And I am the second one!');
widget2.getWidgetRep().setLabelStyle({
  fontSize: 12,
  strokeColor: 'red',
});
widget2.getWidgetRep().setWorldPosition([3, 1, 10]);

renderer.resetCamera();
renderWindow.render();
