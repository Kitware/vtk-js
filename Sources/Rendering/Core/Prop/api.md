## Introduction

vtkProp is an abstract superclass for any objects that can exist in a
rendered scene (either 2D or 3D). Instances of vtkProp may respond to
various render methods (e.g., RenderOpaqueGeometry()). vtkProp also
defines the API for picking, LOD manipulation, and common instance
variables that control visibility, picking, and dragging.




## See Also

## Methods


### addEstimatedRenderTime




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **estimatedRenderTime** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### addTexture




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **texture** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### extend

Method use to decorate a given object (publicAPI+model) with vtkProp characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getActors

Not implemented yet
For some exporters and other other operations we must be able
to collect all the actors or volumes.



### getActors2D

Not implemented yet



### getAllocatedRenderTime





### getDragable

Get the value of the dragable instance variable.



### getEstimatedRenderTime

The value is returned in seconds. For simple geometry the accuracy may not be great
due to buffering. For ray casting, which is already multi-resolution, 
the current resolution of the image is factored into the time. We need the viewport 
for viewing parameters that affect timing. The no-arguments version simply returns the value of the variable with no estimation.



### getNestedProps





### getPickable

Get the pickable instance variable.



### getRedrawMTime

Return the mtime of anything that would cause the rendered image to appear differently. 
Usually this involves checking the mtime of the prop plus anything else it depends on such as properties, 
textures etc.



### getRendertimemultiplier





### getSupportsSelection





### getTextures





### getUseBounds





### getVisibility

Get visibility of this vtkProp.



### getVolumes

Not implemented yet



### hasKey

Not Implemented yet



### hasTexture




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **texture** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### newInstance

Method use to create a new instance of vtkProp


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### pick

Not Implemented yet
Method fires PickEvent if the prop is picked.



### removeAllTextures





### removeTexture




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **texture** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### restoreEstimatedRenderTime

This method is used to restore that old value should the render be aborted.



### setAllocatedRenderTime




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **allocatedRenderTime** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setDragable




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **dragable** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setEstimatedRenderTime




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **estimatedRenderTime** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPickable




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **pickable** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setRendertimemultiplier

This is used for culling and is a number between 0 and 1. It is used to create the allocated render time value.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **renderTimeMultiplier** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setUseBounds

In case the Visibility flag is true, tell if the bounds of this prop should be taken into 
account or ignored during the computation of other bounding boxes, like in vtkRenderer::ResetCamera().


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **useBounds** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setVisibility




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **visibility** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


