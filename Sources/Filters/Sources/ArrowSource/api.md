## Introduction

vtkArrowSource was intended to be used as the source for a glyph.
The shaft base is always at (0,0,0). The arrow tip is always at (1,0,0).
If "Invert" is true, then the ends are flipped i.e. tip is at (0,0,0) while base is at (1, 0, 0).
The resolution of the cone and shaft can be set and default to 6.
The radius of the cone and shaft can be set and default to 0.03 and 0.1.
The length of the tip can also be set, and defaults to 0.35.




## See Also

## Methods


### extend

Method used to decorate a given object (publicAPI+model) with vtkArrowSource characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getDirection

Get the orientation vector of the cone.



### getDirectionByReference

Get the orientation vector of the cone.



### getInvert





### getShaftRadius

Get the resolution of the shaft.



### getShaftResolution

Get the resolution of the shaft.



### getTipLength

Get the length of the tip.



### getTipRadius

Get the radius of the tip.



### getTipResolution

Get the resolution of the tip.



### newInstance

Method used to create a new instance of vtkArrowSource.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### requestData

Expose methods


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **inData** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **outData** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setDirection




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setDirectionFrom




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **direction** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setInvert

Inverts the arrow direction.
When set to true, base is at [1, 0, 0] while the tip is at [0, 0, 0].


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **invert** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setShaftRadius

Set the radius of the shaft.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **shaftRadius** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setShaftResolution

Set the resolution of the shaft.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **shaftResolution** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setTipLength

Set the length of the tip.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **tipLength** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setTipRadius

Set the radius of the tip.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **tipRadius** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setTipResolution

Set the resolution of the tip.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **tipResolution** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


