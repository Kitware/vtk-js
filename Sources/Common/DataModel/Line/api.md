## Introduction

vtkLine is a cell which representant a line.
It contains static method to make some computations directly link to line.

## See also vtkCell

### intersectWithLine(p1, p2, tol, x, pcoords)
Compute the intersection point of the intersection between line and
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


(static) distanceToLine(x, p1, p2, closestPoint = null)
: Compute the distance from x to the line composed by p1 and p2.
If an object is set as a fourth argument, then the closest point on the line from
x will be set into it.
```js
{
  t: tolerance of the distance
  distance: quared distance between closest point and x
}
```

(static) intersection(a1, a2, b1, b2, u, v)
: Performs intersection of two finite 3D lines.
An intersection is found if the projection of the two lines onto the plane perpendicular to the cross product of the two lines intersect, and if the distance between the closest points of approach are within a relative tolerance. The parameters (u,v) are the parametric coordinates of the lines at the position of closest approach.
Careful, u and v are filled inside the function. Outside the function, they
have to be access with : u[0] and v[0]
return IntersectionState enum :
```js
IntersectionState : {
	NO_INTERSECTION,
	YES_INTERSECTION,
	ON_LINE
}
```
