## Introduction

vtkCylinderSource creates a polygonal cylinder centered at Center;
The axis of the cylinder is aligned along the global y-axis.
The height and radius of the cylinder can be specified, as well as the number of sides.
It is also possible to control whether the cylinder is open-ended or capped.
If you have the end points of the cylinder, you should use a vtkLineSource followed by a vtkTubeFilter instead of the vtkCylinderSource.




## Methods


### extend

Method used to decorate a given object (publicAPI+model) with vtkCylinderSource characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getCapping

Get the cap the base of the cylinder with a polygon.



### getCenter

Get the center of the cylinder.



### getCenterByReference

Get the center of the cylinder.



### getDirection

Get the orientation vector of the cylinder.



### getDirectionByReference

Get the orientation vector of the cylinder.



### getHeight

Get the height of the cylinder.



### getRadius

Get the base radius of the cylinder.



### getResolution

Get the number of facets used to represent the cylinder.



### newInstance

Method used to create a new instance of vtkCylinderSource.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### requestData




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **inData** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **outData** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setCapping

Turn on/off whether to cap the base of the cone with a polygon.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **capping** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setCenter

Set the center of the cone.
It is located at the middle of the axis of the cone.
Warning: this is not the center of the base of the cone!


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setCenterFrom

Set the center of the cone.
It is located at the middle of the axis of the cone.
Warning: this is not the center of the base of the cone!


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **center** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setDirection




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setDirectionFrom




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **direction** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setHeight

Set the height of the cone.
This is the height along the cone in its specified direction.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **height** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setRadius

Set the base radius of the cone.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **radius** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### setResolution

Set the number of facets used to represent the cone.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **resolution** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


