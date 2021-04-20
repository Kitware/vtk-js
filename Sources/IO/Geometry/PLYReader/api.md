## Introduction

vtkPLYReader is a source object that reads polygonal data in Stanford
University PLY file format (see http://graphics.stanford.edu/data/3Dscanrep).
It requires that the elements "vertex" and "face" are defined. The "vertex"
element must have the properties "x", "y", and "z". The "face" element must
have the property "vertex_indices" defined. Optionally, if the "face" element
has the properties "intensity" and/or the triplet "red", "green", "blue", and
optionally "alpha"; these are read and added as scalars to the output data.
If the "face" element has the property "texcoord" a new TCoords point array
is created and points are duplicated if they have 2 or more different texture
coordinates.




## Methods


### extend

Method used to decorate a given object (publicAPI+model) with vtkPLYReader characteristics.


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

Method used to create a new instance of vtkPLYReader


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


