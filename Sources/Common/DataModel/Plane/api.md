## Introduction

vtkPlane provides methods for various plane computations. These include
projecting points onto a plane, evaluating the plane equation, and
returning plane normal.

### normal (set/get)
Plane normal. Plane is defined by point and normal. Default is [0.0, 0.0, 1.0].

### origin (set/get)
Point through which plane passes. Plane is defined by point and normal.
Default is [0.0, 0.0, 0.0].

## Methods

### evaluateFunction(x)
Evaluate plane equation for point x.
Accepts both an array point representation and individual xyz arguments.
```js
plane.evaluateFunction([0.0, 0.0, 0.0]);
plane.evaluateFunction(0.0, 0.0, 0.0);
```

### evaluateGradient(xyz)
Given the point xyz (three floating values) evaluate the equation for the plane gradient. Note that the normal and origin must have already been specified. The method returns an array of three floats.


### push(distance)
Translate the plane in the direction of the normal by the distance
specified. Negative values move the plane in the opposite direction.


### *(static)* projectPoint(x, origin, normal, xproj)
### projectPoint(x, xproj)
Project a point x onto plane defined by origin and normal. The
projected point is returned in xproj. **NOTE:** normal assumed to
have magnitude 1.


### *(static)* projectVector(v, normal, vproj)
### projectVector(v, vproj)
Project a vector v onto plane defined by origin and normal. The
projected vector is returned in vproj.


### *(static)* generalizedProjectPoint(x, origin, normal, xproj)
### generalizedProjectPoint(x, xproj)
Project a point x onto plane defined by origin and normal. The
projected point is returned in xproj. **NOTE:** normal does NOT have to
have magnitude 1.


### *(static)* evaluate(normal, origin, x)
Quick evaluation of plane equation n(x-origin) = 0.


### *(static)* distanceToPlane(x, origin, normal)
### distanceToPlane(x)
Return the distance of a point x to a plane defined by n (x-p0) = 0.
The normal n must be magnitude = 1.


### *(static)* intersectWithLine(p1, p2, origin, normal)
### intersectWithLine(p1, p2)
Given a line defined by the two points p1,p2; and a plane defined by the
normal n and point p0, compute an intersection.
Return an object:
```js
let obj = {intersection: ..., t: ..., x: ...};
```
where:
- **intersection** (*boolean*): indicates if the plane and line intersect.
 Intersection is true if (0 <= t <= 1), and false otherwise.
- **t** (*Number*): parametric coordinate along the line.
- **x** (*Array*): coordinates of intersection.

If the plane and line are parallel, intersection is false and t is set
to Number.MAX_VALUE.

### *(static)* intersectWithPlane(plane1Origin, plane1Normal, plane2Origin, plane2Normal)
### intersectWithPlane(planeOrigin, planeNormal)
Given a planes defined by the normals n0 & n1 and origin points p0 & p1, compute the line representing the plane intersection.
Return an object:
```js
let obj = {intersection: ..., t: ..., l0: ..., l1: ...};
```
where:
- **intersection** (*boolean*): indicates if the two planes intersect.
 Intersection is true if (0 <= t <= 1), and false otherwise.
- **l0** (*Array*): coordinates of point 0 of the intersection line.
- **l1** (*Array*): coordinates of point 1 of the intersection line.
- **error** (*String|null*): Conditional, if the planes do not intersect, is it because they are coplanar ('coincide') or parallel ('disjoint').