## Introduction

vtkPolygon represents a 2D n-sided polygon.
The polygons cannot have any internal holes, and cannot self-intersect.
Define the polygon with n-points ordered in the counter-clockwise direction.
Do not repeat the last point.

### points (set)
Set the polygon's points

### pointArray (get)
Get the array of triangles that triangulate the polygon.

## Methods

triangulate()
:Triangulate this polygon. The output data must be accessed
  through `getPointArray`. The output data contains points
  by group of three: each three-group defines one triangle.
