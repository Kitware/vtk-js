## Introduction

vtkImageProperty provides 2D image display support for vtk.
It can be associated with a vtkImageSlice prop and placed within a Renderer.

This class resolves coincident topology with the same methods as vtkMapper.




## See Also

## Methods


### ambient





### colorLevel





### colorWindow





### componentData





### componentWeight





### diffuse





### extend

Method use to decorate a given object (publicAPI+model) with vtkImageProperty characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getAmbient





### getColorLevel





### getColorWindow





### getComponentWeight




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **index** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### getDiffuse





### getIndependentComponents





### getInterpolationTypeAsString





### getInterpolationTypeAsString





### getOpacity





### getPiecewiseFunction

Get the component weighting function.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **idx** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### getRGBTransferFunction

Get the currently set RGB transfer function.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **idx** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### getScalarOpacity

Alias to get the piecewise function (backwards compatibility)


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **idx** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### independentComponents





### interpolationType





### newInstance

Method use to create a new instance of vtkImageProperty


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### opacity





### piecewiseFunction





### setAmbient





### setColorLevel





### setColorWindow





### setComponentWeight




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **index** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **value** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setDiffuse





### setIndependentComponents





### setInterpolationType





### setInterpolationTypeToLinear





### setInterpolationTypeToNearest





### setOpacity




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **opacity** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPiecewiseFunction

Set the piecewise function


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **index** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **func** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setRGBTransferFunction

Set the color of a volume to an RGB transfer function


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **index** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **func** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setScalarOpacity

Alias to set the piecewise function


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **index** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **func** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


