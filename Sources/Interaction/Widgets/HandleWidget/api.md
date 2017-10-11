## Introduction

General widget for moving handles (translate and scale)

## See Also

[vtkAbstractWidget]

## Caught events

List of event catch by the widget :
- MouseMove
- LeftButtonPress
- LeftButtonRelease
- MiddleButtonPress
- MiddleButtonRelease
- RightButtonPress
- RightButtonRelease

## createDefaultRepresentation()

Create a vtkSphereHandleRepresentation as a default representation.

## listenEvents()

For each events, define a method called when event is caught :
- onMouseMove then call handleMouseMove
- onLeftButtonPress then call handleLeftButtonPress
- ...

## allowHandleResize (set/get bool)

Define if the widget representation can be resized (default is true)