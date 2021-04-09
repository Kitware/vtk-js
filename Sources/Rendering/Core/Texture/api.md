## Introduction

vtkTexture is an image algorithm that handles loading and binding of texture maps.
It obtains its data from an input image data dataset type. 
Thus you can create visualization pipelines to read, process, and construct textures. 
Note that textures will only work if texture coordinates are also defined, and if the rendering system supports texture.




## Methods


### edgeClamp





### extend

Method use to decorate a given object (publicAPI+model) with vtkTexture characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getEdgeClamp





### getImage





### getImageLoaded





### getInterpolate





### getRepeat





### imageLoaded





### interpolate





### newInstance

Method use to create a new instance of vtkTexture.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### repeat





### setEdgeClamp




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **edgeClamp** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setImage




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **image** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setInterpolate




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **interpolate** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setRepeat




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **repeat** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


