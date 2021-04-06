## Introduction

vtkSTLReader is a source object that reads ASCII or binary stereo lithography
files (.stl files). The object automatically detects whether the file is
ASCII or binary. .stl files are quite inefficient since they duplicate vertex
definitions.




## See Also

## Methods


### extend

Method used to decorate a given object (publicAPI+model) with vtkSTLReader characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getBaseURL





### getDataAccessHelper





### getUrl





### loadData




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **options** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### newInstance

Method used to create a new instance of vtkSTLReader


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### parse




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **content** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### parseAsArrayBuffer




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **content** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### parseAsText




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **content** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### requestData




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **inData** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **outData** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setDataAccessHelper




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **dataAccessHelper** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setUrl




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **url** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **option** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


