## Introduction

vtkCubeSource creates a cube centered at origin. The cube is represented with four-sided polygons.
It is possible to specify the length, width, and height of the cube independently.




## See Also

## Methods


### extend

Method used to decorate a given object (publicAPI+model) with vtkCubeSource characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getCenter

Get the center of the cube.



### getCenterByReference

Get the center of the cube.



### getGenerate3DTextureCoordinates





### getRotations





### getRotationsByReference





### getXLength

Get the length of the cube in the x-direction.



### getYLength

Get the length of the cube in the y-direction.



### getZLength

Get the length of the cube in the z-direction.



### newInstance

Method used to create a new instance of vtkCubeSource.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### requestData

Expose methods


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **inData** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **outData** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setBounds

Convenience methods allows creation of cube by specifying bounding box.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **xMin** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **xMax** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **yMin** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **yMax** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **zMin** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **zMax** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setBounds

Convenience methods allows creation of cube by specifying bounding box.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **bounds** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setCenter

Set the center of the cube.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setCenterFrom

Set the center of the cube.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **center** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setGenerate3DTextureCoordinates




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **generate3DTextureCoordinates** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setRotations

Float array of size 3 representing the angles, in degrees, of rotation for the cube.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **xAngle** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **yAngle** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **zAngle** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setRotationsFrom




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **rotations** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setXLength

Set the length of the cube in the x-direction.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **xLength** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setYLength

Set the length of the cube in the y-direction.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **yLength** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setZLength

Set the length of the cube in the z-direction.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **zLength** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


