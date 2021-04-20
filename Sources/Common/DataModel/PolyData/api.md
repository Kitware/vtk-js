## Introduction

vtkPolyData creates an m x n array of quadrilaterals arranged as a regular
tiling in a plane. The plane is defined by specifying an origin point, and then
two other points that, together with the origin, define two axes for the plane.
These axes do not have to be orthogonal - so you can create a parallelogram.
(The axes must not be parallel.) The resolution of the plane (i.e., number of
subdivisions) is controlled by the ivars XResolution and YResolution.

By default, the plane is centered at the origin and perpendicular to the z-axis,
with width and height of length 1 and resolutions set to 1.




## Methods


### buildCells

Create data structure that allows random access of cells.



### buildLinks

Create upward links from points to cells that use each point. Enables
topologically complex queries.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialSize** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | {number} |


### extend

Method used to decorate a given object (publicAPI+model) with vtkPolyData characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getCell

If you know the type of cell, you may provide it to improve performances.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **cellId** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **cellHint** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### getCellEdgeNeighbors

Get the neighbors at an edge.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **cellId** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **point1** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **point2** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### getCellPoints

Get a list of point ids that define a cell.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **cellId** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | {number} |
#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> | an object made of the cellType and a subarray `cellPointIds` of the cell points. |


### getCells

Get the cell array defining cells.



### getLines

Get the cell array defining lines.



### getLinks





### getNumberOfCells

Determine the number of cells composing the polydata.



### getNumberOfLines

Determine the number of lines composing the polydata.



### getNumberOfPoints

Determine the number of points composing the polydata.



### getNumberOfPolys

Determine the number of polys composing the polydata.



### getNumberOfStrips

Determine the number of strips composing the polydata.



### getNumberOfVerts

Determine the number of vertices composing the polydata.



### getPointCells

Topological inquiry to get cells using point.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **ptId** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### getPolys

Get the cell array defining polys.



### getStrips

Get the cell array defining strips.



### getVerts

Get the cell array defining vertices. If there are no vertices, an empty
array will be returned (convenience to simplify traversal).



### newInstance

Method used to create a new instance of vtkPolyData.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### setLines

Set the cell array defining lines. 


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **lines** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | {vtkCellArray} |


### setPolys

Set the cell array defining polys. 


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **polys** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | {vtkCellArray} |


### setStrips

Set the cell array defining strips. 


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **strips** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | {vtkCellArray} |


### setVerts

Set the cell array defining vertices.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **verts** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | {vtkCellArray} |


