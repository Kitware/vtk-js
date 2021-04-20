## Introduction

vtkImageOutlineFilter - generates outline of labelmap from an vtkImageData
input in a given direction (slicing mode).   

vtkImageOutlineFilter creates a region (labelmap) outline based on input data
given . The output is a vtkImageData object containing only boundary voxels.




## Methods


### extend

Method used to decorate a given object (publicAPI+model) with vtkImageOutlineFilter characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getBackground





### getSlicingMode





### newInstance

Method used to create a new instance of vtkImageOutlineFilter


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### requestData




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **inData** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **outData** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setBackground




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **background** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setSlicingMode




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **slicingMode** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


