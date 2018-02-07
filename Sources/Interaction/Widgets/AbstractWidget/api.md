## Introduction

AbstractWidget define the API for widget. It can't be instanciated.

## See Also

[vtkHandleWidget]

## widgetRep (set/get vtkWidgetRepresentation)

Set the representation of the widget. The object needs to be inherited from vtkWidgetRepresentation

## parent (set/get vtkAbstractWidget)

Specifying a parent to this widget is used when creating composite widgets.

## createDefaultRepresentation()

Virtual method, needs to be overrides in derived class.
It defines the representation of the widget

## listenEvents()

Attaches interactor events to callbacks. Events are defined in
vtkRenderWindowInteractor.handledEvents, and callbacks need to be formatted
as handle${eventToHandle} and implemented in derived classes.
example: handleMouseMove, handleLeftButtonPress...

## render()

Render the interactor.

## setEnabled(bool)

Enables or disables the widget.
When the widget is enabled, then the default representation is created.

