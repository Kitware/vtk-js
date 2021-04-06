## Introduction

vtkCursor3D creates a cube centered at origin. The cube is represented with four-sided polygons.
It is possible to specify the length, width, and height of the cube independently.




## See Also

## Methods


### allOff

Turn every part of the 3D cursor off.



### allOn

Turn every part of the 3D cursor on.



### extend

Method used to decorate a given object (publicAPI+model) with vtkCursor3D characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getAxes





### getFocalPoint

Get the position of cursor focus.



### getFocalPointByReference





### getFocus





### getModelBounds

Set the boundary of the 3D cursor.



### getModelBoundsByReference





### getOutline





### getTranslationMode

Get the translation mode.



### getWrap

Get the state of the cursor wrapping.



### getXShadows

Get the state of the wireframe x-shadows.



### getYShadows

Get the state of the wireframe y-shadows.



### getZShadows

Get the state of the wireframe z-shadows.



### newInstance

Method used to create a new instance of vtkCursor3D.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### requestData

Expose methods


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **inData** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **outData** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setAll




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **flag** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setAxes

Turn on/off the wireframe axes.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **axes** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setFocalPoint

Set/Get the position of cursor focus.
If translation mode is on, then the entire cursor (including bounding box, cursor, and shadows) is
translated. Otherwise, the focal point will either be clamped to the bounding box, or wrapped, if Wrap is on.
(Note: this behavior requires that the bounding box is set prior to the focal point.)


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **points** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setModelBounds

Set the boundary of the 3D cursor.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **bounds** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setTranslationMode

Enable/disable the translation mode.
If on, changes in cursor position cause the entire widget to translate along with the cursor.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **translationMode** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setWrap

Turn on/off cursor wrapping.
If the cursor focus moves outside the specified bounds,
the cursor will either be restrained against the nearest "wall" (Wrap=off),
or it will wrap around (Wrap=on).


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **wrap** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setXShadows

Turn on/off the wireframe x-shadows.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **xLength** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setYShadows

Turn on/off the wireframe y-shadows.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **yLength** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setZShadows

Turn on/off the wireframe z-shadows.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **zLength** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


