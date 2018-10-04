## Introduction

vtkTriangle is a cell which representant a triangle.
It contains static method to make some computations directly link to triangle.

## See also vtkCell

### intersectWithLine(p1, p2, tol, x, pcoords)
Compute the intersection point of the intersection between triangle and
line defined by p1 and p2.
tol Tolerance use for the position evaluation
x is the point which intersect triangle (computed in function)
pcoords parametric coordinates (computed in function)
A javascript object is returned :
```js
{
  evaluation: define if the triangle has been intersected or not
  subId: always set to 0
  t: tolerance of the intersection
}
```

### evaluatePosition(x, closestPoint, pcoords, weights)
Evaluate the position of x in relation with triangle. Compute the
closest point in the cell.
pccords parametric coordinate (computed in function)
weights Interpolation weights in cell. the number of weights is equal to
the number of points defining the cell (computed in function)
A javascript object is returned :
```js
{
  evaluation: 1 = inside 0 = outside -1 = problem during execution
  subId: always set to 0
  dist2: squared distance from x to cell
}
```


(static) computeNormalDirection(v1, v2, v3, normal)
: Compute the normal direction according to the three
vertex which composed a triangle. The normal is not normalized.
The normal is returned in normal

(static) computeNormal(v1 , v2, v3, normal)
: Compute the normalized normal of a triangle composed of three points.
The normal is returned in normal
