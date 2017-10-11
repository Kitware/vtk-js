## Introduction

A spherical rendition of point in 3D space

## See also

[vtkHandleRepresentation] [vtkHandleWidget]

## getActors()

Return actors use in the representation. Here, only one actor is used : sphere

## placeWidget(bounds)

Place the widget inside bounds

## setSphereRadius(radius)

Change the radius of the sphere

## getSphereRadius()

Return the current radius of the sphere

## getBounds()

Return the bounds of the widget.
Here it's the bounds of the sphere.

## setWorldPosition(position)

Set the world position [vtkHandleRepresentation]

## setDisplayPosition(position)

Set the display position [vtkHandleRepresentation]

## setHandleSize (size)

Change the size of the handle

## computeInteractionState(pos)

Compute the current interaction state according to the mouse position
Returns `InteractionState` enum :
- OUTSIDE
- NEARBY
- SELECTING
- TRANSLATING
- SCALING

## determineConstraintAxis(constraint, x)

Determine which axis is constraint

## moveFocus(p1, p2)

Method called if the current interaction state is SELECTING

## translate(p1, p2)

Method called if the current interaction state is TRANSLATING

## sizeBounds()

Update the sphere radius

## scale(p1, p2, eventPos)

Method called if the current interaction state is SCALING

## highlight(highlight)

Change the coloration of the sphere when user clicks on it

## buildRepresentation()

Initialize the sphere radius.
