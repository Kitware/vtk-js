## Introduction

vtkSTLWriter writes stereo lithography (.stl) files in either ASCII or binary
form. Stereo lithography files contain only triangles. Since VTK 8.1, this
writer converts non-triangle polygons into triangles, so there is no longer a
need to use vtkTriangleFilter prior to using this writer if the input
contains polygons with more than three vertices.




## See Also

## Methods


### extend

Method used to decorate a given object (publicAPI+model) with vtkSTLWriter characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getFormat





### getTransform





### newInstance

Method used to create a new instance of vtkSTLWriter


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### requestData




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **inData** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **outData** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setFormat




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **format** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setTransform




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **format** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### writeSTL





