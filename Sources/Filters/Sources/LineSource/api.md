## Introduction

vtkLineSource creates a polygonal cylinder centered at Center;
The axis of the cylinder is aligned along the global y-axis.
The height and radius of the cylinder can be specified, as well as the number of sides.
It is also possible to control whether the cylinder is open-ended or capped.
If you have the end points of the cylinder, you should use a vtkLineSource followed by a vtkTubeFilter instead of the vtkLineSource.




## See Also

## Methods


### extend

Method used to decorate a given object (publicAPI+model) with vtkLineSource characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getPoint1

Get the orientation vector of the cylinder.



### getPoint1ByReference

Get the orientation vector of the cylinder.



### getPoint2

Get the orientation vector of the cylinder.



### getPoint2ByReference

Get the orientation vector of the cylinder.



### getResolution

Get the number of facets used to represent the cylinder.



### newInstance

Method used to create a new instance of vtkLineSource.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### requestData

Expose methods


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **inData** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **outData** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPoint1




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPoint1From




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **direction** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPoint2




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPoint2From




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **direction** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setResolution

Set the number of facets used to represent the cone.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **resolution** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


