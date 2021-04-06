## Introduction

vtkPixelSpaceCallbackMapper iterates over the points of its input dataset,
using the transforms from the active camera to compute the screen coordinates
of each point.




## See Also

## Methods


### callback





### extend

Method use to decorate a given object (publicAPI+model) with vtkPixelSpaceCallbackMapper characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getCallback





### getUseZValues





### invokeCallback




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **dataset** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **camera** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **aspect** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **windowSize** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **depthValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### newInstance

Method use to create a new instance of vtkPixelSpaceCallbackMapper


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### setCallback

Set the callback function the mapper will call, during the rendering
process, with the screen coords of the points in dataset. The callback
function will have the following parameters:

// An array of 4-component arrays, in the index-order of the datasets points

coords: [
  [screenx, screeny, screenz, zBufValue],
  ...
]

// The active camera of the renderer, in case you may need to compute alternate
// depth values for your dataset points.  Using the sphere mapper in your
// application code is one example where this may be useful, so that you can
// account for that mapper's radius when doing depth checks.

camera: vtkCamera

// The aspect ratio of the render view and depthBuffer
aspect: float

// A Uint8Array of size width * height * 4, where the zbuffer values are
// encoded in the red and green components of each pixel.  This will only
// be non-null after you call setUseZValues(true) on the mapper before
// rendering.

depthBuffer: Uint8Array


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **callback** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setUseZValues

Set whether or not this mapper should capture the zbuffer during 
rendering. Useful for allowing depth checks in the application code.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **useZValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### useZValues





### usize

Width



### vsize

Height



