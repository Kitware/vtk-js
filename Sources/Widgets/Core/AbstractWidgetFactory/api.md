The factory that is used to construct widget instances of type
vtkAbstractWidget. These widget instances are known as "view widgets", since
these widget instances are tied to a particular view. The factory class should
be subclassed to implement specific widgets.

## (abstract) model.behavior(widgetPublicAPI, widgetModel)

This should implement widget-specific functionality. See PolyLineWidget
behavior.js for an example.

## (abstract) model.widgetState

Needs to be set to a vtkWidgetState. See `vtkStateBuilder` for constructing
vtkWidgetState.

## (abstract) publicAPI.getRepresentationsForViewType(viewType)

A function that should return a list of representations to construct for a
given viewType. Valid view types can be found in =WidgetManager/Constants.js=.
The return type should be `[ { builder: vtkRepresentationClass, labels:
[string,...] }, ... ]`.

## (abstract, optional) model.methodsToLink

A list of method and property names to proxy from the
representations to the widget. If the method or property is available on any of
the widget's representations, it will be made available on the widget. Type
structure: =[string, ...]=

## getWidgetForView({ viewId, renderer?, viewType?, initialValues? })

Will return the widget associated with the view with Id =viewId=. If there is
no widget associated with the view, a new widget will be constructed, provided
that the renderer, viewType, and optionally initialValues are also provided.

## setVisibility(bool)

Sets visibility for all associated view widgets.

## setPickable(bool)

Sets pickable flag for all associated view widgets.

## setDragable(bool)

Sets dragable flag for all associated view widgets.

## setContextVisibility(bool)

Sets context visibility for all associated view widgets.

## setHandleVisibility(bool)

Sets handle visibility for all associated view widgets.

