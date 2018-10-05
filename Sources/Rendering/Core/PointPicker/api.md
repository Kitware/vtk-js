## Introduction

PointPicker is an extension of the picker to pick point from 2D to 3D.
it's used to select a point by shooting a ray into a graphics window
and intersecting with actor's defining geometry - specifically its points

## See Also

[vtkPicker]
[vtkAbstractPicker]

## pointId (get Number)

Get the ID of the picked point.
If pointId = -1, then nothing was picked

## useCellId (set Boolean)

Specify whether the point search should be based on cell points or
directly on the point list.
