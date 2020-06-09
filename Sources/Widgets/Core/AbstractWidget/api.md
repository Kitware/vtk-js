The abstract class that implements some shared functionality used by widgets. In
reality, there aren't any abstract methods to implement, as widgets are
constructed via vtkAbstractWidgetFactory.

vtkAbstractWidget extends from vtkInteractorObserver.

## getWidgetManager()
Returns the widget manager the widget has been registered into.

## setWidgetManager(widgetManager)
Automatically called by the widget manager when widget is registered.

## getViewWidgets()
Returns all the registered view widgets of the factory.
A widget is registered when added to a view (i.e. widgetManager).
