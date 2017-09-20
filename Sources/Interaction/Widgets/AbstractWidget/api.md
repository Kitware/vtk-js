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

Virtual method, needs to be overrides in derived class.
It defined which methods will be invoked for each event (see vtkHandleWidget)

## render()

Render the interactor.

## setEnable(bool)

Enable or disable the widget.
When the widget is enabled, then the default representation is created.

