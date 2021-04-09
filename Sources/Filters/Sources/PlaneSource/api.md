## Introduction

vtkPlaneSource creates an m x n array of quadrilaterals arranged as a regular
tiling in a plane. The plane is defined by specifying an origin point, and then
two other points that, together with the origin, define two axes for the plane.
These axes do not have to be orthogonal - so you can create a parallelogram.
(The axes must not be parallel.) The resolution of the plane (i.e., number of
subdivisions) is controlled by the ivars XResolution and YResolution.

By default, the plane is centered at the origin and perpendicular to the z-axis,
with width and height of length 1 and resolutions set to 1.




## Methods


### extend

Method used to decorate a given object (publicAPI+model) with vtkPlaneSource characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getCenter

Get the center of the plane.



### getCenterByReference

Get the center of the plane.



### getNormal

Get the normal of the plane.



### getNormalByReference

Get the normal of the plane.



### getOrigin

Get the origin of the plane, lower-left corner.



### getOriginByReference

Get the origin of the plane, lower-left corner.



### getPoint1

Get the x axes of the plane.



### getPoint1ByReference

Get the x axes of the plane.



### getPoint2

Get the y axes of the plane.



### getPoint2ByReference

Get the y axes of the plane.



### getXResolution

Get the x resolution of the plane.



### getYResolution

Get the y resolution of the plane.



### newInstance

Method used to create a new instance of vtkPlaneSource.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### requestData




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **inData** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **outData** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### rotate

Rotate plane around a given axis


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **angle** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | theta Angle (radian) to rotate about |
| **rotationAxis** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | Axis to rotate around |


### setCenter

Set the center of the plane.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **center** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setCenter

Set the center of the plane.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setNormal

Set the normal of the plane.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **normal** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setOrigin

Set the origin of the plane.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setOriginFrom

Set the origin of the plane.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **point2** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPoint1

Specify a point defining the first axis of the plane.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPoint1

Specify a point defining the first axis of the plane.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **point1** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPoint2

Specify a point defining the second axis of the plane.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **point2** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPoint2

Specify a point defining the second axis of the plane.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setXResolution

Set the number of facets used to represent the cone.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **resolution** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setYResolution

Set the number of facets used to represent the cone.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **resolution** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### updatePlane




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **v1** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **v2** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


