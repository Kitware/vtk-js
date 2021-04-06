## Introduction

All propertyObjects may have any of the following keys:
* text: the face text (default “”)
* faceColor: the face color (default “white”)
* faceRotation: the face rotation, in degrees (default 0)
* fontFamily: the font family to use (default Arial)
* fontColor: the font color (default “black”)
* fontStyle: the CSS style for the text (default “normal”)
* fontSizeScale: A function that takes the face resolution and returns the
pixel size of the font (default (resolution) => resolution / 1.8)
* edgeThickness: the face edge/border thickness, which is a fraction of the
cube resolution (default 0.1)
* edgeColor: the color of each face’s edge/border (default “white”)
resolution: the pixel resolution of a face, i.e. pixel side length (default 200)
If a key is not specified, then the default value is used.




## See Also

## Methods


### extend

Method use to decorate a given object (publicAPI+model) with vtkAnnotatedCubeActor characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### newInstance

Method use to create a new instance of vtkAnnotatedCubeActor


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### setDefaultStyle

Set the default style.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **style** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


### setXMinusFaceProperty

The -X face property.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **prop** | <span class="arg-type">vtkProperty</span></br></span><span class="arg-required">required</span> | face property |
#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


### setXPlusFaceProperty

The +X face property.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **prop** | <span class="arg-type">vtkProperty</span></br></span><span class="arg-required">required</span> | face property |
#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


### setYMinusFaceProperty

The -Y face property.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **prop** | <span class="arg-type">vtkProperty</span></br></span><span class="arg-required">required</span> | face property |
#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


### setYPlusFaceProperty

The +Y face property.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **prop** | <span class="arg-type">vtkProperty</span></br></span><span class="arg-required">required</span> | face property |
#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


### setZMinusFaceProperty

The -Z face property.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **prop** | <span class="arg-type">vtkProperty</span></br></span><span class="arg-required">required</span> | face property |
#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


### setZPlusFaceProperty

The +Z face property.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **prop** | <span class="arg-type">vtkProperty</span></br></span><span class="arg-required">required</span> | face property |
#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


