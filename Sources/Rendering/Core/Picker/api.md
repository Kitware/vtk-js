## Introduction

Picker is used to select instances of vtkProp3D by shooting a ray into a
graphics window and intersecting with the actor's bounding box.The ray is
defined from a point defined in window (or pixel) coordinates, and a
point located from the camera's position.

## See also

[vtkAbstractPicker]

## tolerance (set/get Number) 

Set/Get the tolerance for the computation of the intersection
Multiple points all projecting within the tolerance along the pick ray

## actors (get) : []

Return the picked actors

## pickedPositions (get) : []

Return the list of picked points

## pick(selection, renderer) : int

Perform pick operation with selection point provided.
If returns 0, means that the pick didn't work
If returns 1, means that the pick worked
Normally the first two values for the selection point are x-y pixel coordinate,
and the third value is =0.
