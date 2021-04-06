




## Methods


### computeSurfaceNormal




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **data** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **cell** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **weights** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **normal** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### extend

Method use to decorate a given object (publicAPI+model) with vtkCellPicker characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getCellIJK

Get the structured coordinates of the cell at the PickPosition.



### getCellIJKByReference





### getCellId

Get the id of the picked cell.



### getMapperNormal





### getMapperNormalByReference





### getPCoords

Get the parametric coordinates of the picked cell.



### getPCoordsByReference





### initialize





### intersectActorWithLine




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **p1** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **p2** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **t1** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **t2** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
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

Method use to create a new instance of vtkCellPicker


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### pick




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **selection** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **renderer** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


