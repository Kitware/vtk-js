## Introduction

vtkConeSource creates a cone centered at a specified point and pointing in a specified direction.
(By default, the center is the origin and the direction is the x-axis.) Depending upon the resolution of this object,
different representations are created. If resolution=0 a line is created; if resolution=1, a single triangle is created;
if resolution=2, two crossed triangles are created. For resolution > 2, a 3D cone (with resolution number of sides)
is created. It also is possible to control whether the bottom of the cone is capped with a (resolution-sided) polygon,
and to specify the height and radius of the cone.




## Methods


### extend

Method used to decorate a given object (publicAPI+model) with vtkConeSource characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getCapping

Get the cap the base of the cone with a polygon.



### getCenter

Get the center of the cone.



### getCenterByReference

Get the center of the cone.



### getDirection

Get the orientation vector of the cone.



### getDirectionByReference

Get the orientation vector of the cone.



### getHeight

Get the height of the cone.



### getRadius

Get the base radius of the cone.



### getResolution

Get the number of facets used to represent the cone.



### newInstance

Method used to create a new instance of vtkConeSource.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### requestData

Expose methods


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
| **center** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


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

Set the direction for the cone.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setDirection

Set the direction for the cone.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setDirectionFrom

Set the direction for the cone.


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


