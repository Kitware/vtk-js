vtkWidgetManager manages view widgets for a given renderer.

## enablePicking()

Enable widget picking in the renderer.

Widgets should never have to call this method if you invoke `cancelAnimation`
on the interactor, since the widget manager will call this for you.

## disablePicking()

Disable widget picking in the renderer.

## setRenderer(ren)

Attaches the widget manager to the specified renderer. Note the current
implementation does not allow changing the renderer.

## addWidget(widgetFactory, viewType?, initialValues?)

Adds or creates a view widget of a provided view type and initial values.
Internally, this will invoke `widgetFactory.getWidgetForView()` and attach the
resulting view widget to the view.

## removeWidget(widgetFactory)

Removes the view widgets associated with a given widget factory.

## grabFocus(widgetFactory)

Grabs the focus of the view widgets associated with the widget factory.

## releaseFocus()

Clears focus flag for any focused widgets.

## setCaptureOn(WidgetManager.CaptureOn)

Sets the picking buffer capture mode. There are two possible values:
`CaptureOn.MOUSE_RELEASE` and `CaptureOn.MOUSE_MOVE`.
- `MOUSE_RELEASE` will capture the picking buffer whenever any mouse button is released. This will capture the entire visible rendering surface and make it available for picking. This means capture phase may take longer for larger screens, but picking will be lightning-fast for static scenes.
- `MOUSE_MOVE` will capture the picking buffer whenever the mouse moves. The difference between `RELEASE` is that `MOVE` will restrict the effective pick buffer to a 1x1 pixel under the mouse, so the performance of the capture phase is much faster than that of `RELEASE`, at the expense of slightly slower picking performance for static scenes.

Note that the picking buffer is not updated when the widget state is modified.
The widget manager only updates the picking buffer whenever the mouse moves, which
is sufficient for most purposes.

This does not support touch-based interfaces at the moment.
