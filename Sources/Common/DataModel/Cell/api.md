## Introduction

vtkCell is an abstract method to define a cell

## See also vtkTriangle, vtkLine

### initialize(points, pointsIds = null)
Initialize the cell with point coordinates and cell point ids, example :
```js
  const points = vtkPoints.newInstance();
  points.setData(Float32Array.from([0, 0, 0, 0, 0, 1, ..., 255, 255, 255]));
  const pointIdsList = [13, 10, 235];
  // Create cell
  const triangle = vtkTriangle.newInstance();
  // Initialize cell
  triangle.initialize(points, pointIdsList);
```
If pointIdsList is null, points are shallow copied and pointIdsList is
generated as such: [0, 1, ..., N-1] where N is the number of points.
If pointIdsList is not null, only pointIdsList point coordinates are copied
into the cell.
pointIdsList is shallow copied.

### getBounds()
Return the bounds of the cell
If cell doesn't contain point, uninitialized bounds are returned

### intersectWithLine(p1, p2, tol, x, pcoords) = 0

### evaluatePosition(x, closestPoint, pcoords, weights) = 0
