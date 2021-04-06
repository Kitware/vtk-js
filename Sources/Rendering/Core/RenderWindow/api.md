## Introduction

vtkRenderWindow is an abstract object to specify the behavior of a rendering window.

A rendering window is a window in a graphical user interface where renderers draw their images.
Methods are provided to synchronize the rendering process, set window size, and control double buffering.
The window also allows rendering in stereo. The interlaced render stereo type is for output to a VRex stereo projector.
All of the odd horizontal lines are from the left eye, and the even lines are from the right eye.
The user has to make the render window aligned with the VRex projector, or the eye will be swapped.




## See Also

## Methods


### addRenderer

Add renderer


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **renderer** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### addView

Add renderer


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **view** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### captureImages




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **format** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### extend

Method use to decorate a given object (publicAPI+model) with vtkRenderWindow characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getDefaultViewAPI





### getInteractor





### getNeverRendered





### getNumberOfLayers





### getRenderers





### getRenderersByReference





### getStatistics





### getViews





### hasRenderer




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **ren** | <span class="arg-type">vtkRenderer</span></br></span><span class="arg-required">required</span> |  |


### hasView




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **view** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### invisiblePropCount





### listViewAPIs





### newAPISpecificView




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **name** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### newAPISpecificView





### newInstance

Method use to create a new instance of vtkRenderWindow



### onCompletion




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **callback** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### propCount





### registerViewConstructor





### removeRenderer

Remove renderer


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **renderer** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### removeView

Remove renderer


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **view** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### render





### setDefaultViewAPI




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **defaultViewAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setInteractor




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **interactor** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setNumberOfLayers




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **numberOfLayers** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setViews




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **views** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### str





