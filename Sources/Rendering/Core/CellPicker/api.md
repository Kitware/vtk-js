## Introduction

CellPicker is an extension of the picker to pick point from 2D to 3D.
it's used to select a point by shooting a ray into a graphics window
and intersecting with actor's defining geometry - specifically its points

## Warning

The cellPicker only pick cells composed of three points for now.
It need to be improved to allow picking quads, polygons,...
Images and volumes can't be pick too.
The best way to use it for now, is to allow pickFromList (cf example).

## See Also

[vtkPicker]
[vtkAbstractPicker]

## pointId (get Number)

Get the ID of the closest picked point

## cellId (get Number)

Id of the intersected cell. If -1, no cell has been intersected.
