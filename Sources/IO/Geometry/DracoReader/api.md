## Introduction

vtkDracoReader is a source object that reads a geometry compressed with the
Draco library.




## Methods


### extend

Method used to decorate a given object (publicAPI+model) with vtkDracoReader characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getBaseURL





### getDataAccessHelper





### getDracoDecoder





### getUrl





### loadData




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **options** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### newInstance

Method used to create a new instance of vtkDracoReader


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


### setDracoDecoder




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **createDracoModule** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setUrl




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **url** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **option** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setWasmBinary

Load the WASM decoder from url and set the decoderModule


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **url** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **binaryName** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


