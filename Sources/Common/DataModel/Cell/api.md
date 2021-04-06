## Introduction

vtkCell is an abstract method to define a cell




## Methods


### deepCopy

Copy this cell by completely copying internal data structures.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **cell** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### evaluatePosition

Given a point x[3] return inside(=1), outside(=0) cell, or (-1)
computational problem encountered; evaluate parametric coordinates,
sub-cell id (!=0 only if cell is composite), distance squared of point
x[3] to cell (in particular, the sub-cell indicated), closest point on
cell to x[3] (unless closestPoint is null, in which case, the closest
point and dist2 are not found), and interpolation weights in cell. (The
number of weights is equal to the number of points defining the cell).
Note: on rare occasions a -1 is returned from the method. This means that
numerical error has occurred and all data returned from this method
should be ignored. Also, inside/outside is determine parametrically. That
is, a point is inside if it satisfies parametric limits. This can cause
problems for cells of topological dimension 2 or less, since a point in
3D can project onto the cell within parametric limits but be "far" from
the cell. Thus the value dist2 may be checked to determine true in/out.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **closestPoint** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **subId** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **pcoords** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **dist2** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **weights** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### extend

Method used to decorate a given object (publicAPI+model) with vtkCell characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getBounds

Get the bounds as [xmin, xmax, ymin, ymax, zmin, zmax].



### getCellDimension

Return the topological dimensional of the cell (0,1,2, or 3).



### getLength2

Compute Length squared of cell (i.e., bounding box diagonal squared).



### getNumberOfPoints

Return the number of points in the cell.



### getParametricDistance

Return the distance of the parametric coordinate provided to the cell. If
inside the cell, a distance of zero is returned. This is used during
picking to get the correct cell picked. (The tolerance will occasionally
allow cells to be picked who are not really intersected "inside" the
cell.)


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **pcoords** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### initialize

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
generated as such: [0, 1, ..., N-1] where N is the number of points. If
pointIdsList is not null, only pointIdsList point coordinates are copied into
the cell. pointIdsList is shallow copied.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **points** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **pointIdsList** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### intersectWithLine

Intersect with a ray.

Return parametric coordinates (both line and cell) and global
intersection coordinates, given ray definition p1[3], p2[3] and tolerance
tol. The method returns non-zero value if intersection occurs. A
parametric distance t between 0 and 1 along the ray representing the
intersection point, the point coordinates x[3] in data coordinates and
also pcoords[3] in parametric coordinates. subId is the index within the
cell if a composed cell like a triangle strip.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **p1** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **p2** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **tol** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **t** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **pcoords** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **subId** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### newInstance

Method used to create a new instance of vtkCell.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


