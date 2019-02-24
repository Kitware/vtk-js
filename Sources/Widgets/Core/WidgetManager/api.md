vtkWidgetManager manages view widgets for a given renderer.

## enablePicking()

Enable widget picking in the renderer.

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

