## Introduction

vtkPoints represents 3D points. The data model for vtkPoints is an array 
of vx-vy-vz triplets accessible by (point or cell) id.




## Methods


### computeBounds

Trigger the computation of bounds



### extend

Method used to decorate a given object (publicAPI+model) with vtkPoints characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getBounds

Get the bounds as [xmin, xmax, ymin, ymax, zmin, zmax].



### getNumberOfPoints

Get the number of points for this object can hold.



### getPoint




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **idx** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **tupleToFill** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default []) |


### newInstance

Method used to create a new instance of vtkPoints


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### setNumberOfPoints

Set the number of points for this object to hold.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **nbPoints** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **dimension** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPoint

Insert point into object.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **idx** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPoint

Insert point into object.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **idx** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **coord** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


