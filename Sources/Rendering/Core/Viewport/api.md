## Introduction

vtkViewport represents part or all of a RenderWindow. It holds a
colleciton of props that will be rendered into the area it represents.
This class also contains methods to convert between coordinate systems
commonly used in rendering.




## See Also

[vtkActor](./Rendering_Core_Actor.html)

[vtkCoordinate](./Rendering_Core_Coordinate.html)

[vtkProp](./Rendering_Core_Prop.html)

[vtkRender](./Rendering_Core_Renderer.html)

[vtkRenderWindow](./Rendering_Core_RenderWindow.html)

[vtkVolume](./Rendering_Core_Volume.html)

## Methods


### PickPropFrom

Not Implemented yet



### actors2D





### addActor2D

Not Implemented yet



### addViewProp

Add a prop to the list of props.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **prop** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### aspect





### background





### background2





### displayToView

Convert display coordinates to view coordinates.



### extend

Method use to decorate a given object (publicAPI+model) with vtkViewport characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getActors2D





### getBackground





### getBackground2





### getBackground2ByReference





### getBackgroundByReference





### getSize





### getViewProps





### getViewPropsWithNestedProps





### getViewport





### getViewportByReference





### gradientBackground





### hasViewProp




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **prop** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### newInstance

Method use to create a new instance of vtkViewport



### normalizedDisplayToNormalizedViewport




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### normalizedDisplayToProjection




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### normalizedViewportToNormalizedDisplay




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### normalizedViewportToProjection




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### pixelAspect





### projectionToNormalizedDisplay




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### projectionToNormalizedViewport




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### props





### removeActor2D




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **prop** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### removeAllViewProps





### removeViewProp




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **prop** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setBackground




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **r** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **g** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **b** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setBackground




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **background** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setBackground2




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **r** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **g** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **b** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setBackground2




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **background** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setBackground2From




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **background2** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setBackgroundFrom




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **background** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setViewport

Specify the viewport for the Viewport to draw in the rendering window.
Each coordinate is 0 <= coordinate <= 1.0.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **xmin** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **ymin** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **xmax** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **ymax** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setViewportFrom

Specify the viewport for the Viewport to draw in the rendering window.
Coordinates are expressed as [xmin, ymin, xmax, ymax], where each coordinate is 0 <= coordinate <= 1.0.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **viewport** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### viewToDisplay





### viewport





