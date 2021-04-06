## Introduction

vtkPointSet is an abstract class that specifies the interface for
datasets that explicitly use "point" arrays to represent geometry.

For example, vtkPolyData and vtkUnstructuredGrid require point arrays
to specify point position, while vtkStructuredPoints generates point
positions implicitly.




## See Also

## Methods


### computeBounds

Compute the (X, Y, Z) bounds of the data.



### extend

Method used to decorate a given object (publicAPI+model) with vtkPointSet characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getBounds

Get the bounds as [xmin, xmax, ymin, ymax, zmin, zmax].



### getNumberOfPoints





### getPoints





### newInstance

Method used to create a new instance of vtkPointSet.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### setPoints





