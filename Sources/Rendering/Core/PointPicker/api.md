## Introduction

vtkPointPicker is used to select a point by shooting a ray into a graphics window 
and intersecting with actor's defining geometry - specifically its points. 
Beside returning coordinates, actor, and mapper, vtkPointPicker returns the id of the point
projecting closest onto the ray (within the specified tolerance). 
Ties are broken (i.e., multiple points all projecting within the tolerance along 
the pick ray) by choosing the point closest to the ray origin (i.e., closest to the eye).




## See Also

[vtkPicker](./Rendering_Core_Picker.html)

[vtkCellPicker](./Rendering_Core_CellPicker.html)

## Methods


### extend

Method use to decorate a given object (publicAPI+model) with vtkPointPicker characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getPointIJK





### getPointIJKByReference





### getPointId

Get the id of the picked point.
If PointId = -1, nothing was picked.



### getUseCells





### intersectActorWithLine




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **p1** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **p2** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **tol** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **mapper** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### intersectWithLine




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **p1** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **p2** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **tol** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **mapper** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### newInstance

Method use to create a new instance of vtkPointPicker


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### setUseCells

Specify whether the point search should be based on cell points or directly on the point list.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **useCells** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


