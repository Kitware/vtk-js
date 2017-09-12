## Introduction

vtkCell is an abstract method to define a cell

## See also vtkTriangle, vtkLine

### initialize(npts, pointIdsListn pointList)
Initialize the cells with points, example :
```js
  const points = vtkPoints.newInstance();
  points.setNumberOfPoints(4);
  points.setData([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]);
  const pointIdList = [0, 1, 2, 3];
  // Add points
  const triangle = vtkTriangle.newInstance();
  triangle.initialize(points.getNumberOfPoints(), pointIdList, points);
```

### getBounds()
Return the bounds of the cell
If cell doesn't contain point, uninitialized bounds are returned

### intersectWithLine(p1, p2, tol, x, pcoords) = 0

### evaluatePosition(x, closestPoint, pcoords, weights) = 0
