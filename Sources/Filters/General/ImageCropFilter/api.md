## Introduction

The vtkImageCropFilter will crop a vtkImageData. This will only crop against
IJK-aligned planes. 

Note this is slow on large datasets due to CPU-bound
cropping.




## See Also

## Methods


### extend

Method used to decorate a given object (publicAPI+model) with vtkImageCropFilter characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getCroppingPlanes

Get The cropping planes, in IJK space.



### getCroppingPlanesByReference

Get The cropping planes, in IJK space.



### isResetAvailable





### newInstance

Method used to create a new instance of vtkImageCropFilter


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### requestData




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **inData** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **outData** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### reset





### setCroppingPlanes




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **croppingPlanes** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setCroppingPlanesFrom




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **croppingPlanes** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


