## Introduction

vtkProperty2D is an object that represents lighting and other surface
properties of a 2D geometric object. The primary properties that can be
set are colors (overall, ambient, diffuse, specular, and edge color);
specular power; opacity of the object; the representation of the
object (points, wireframe, or surface); and the shading method to be
used (flat, Gouraud, and Phong). Also, some special graphics features
like backface properties can be set and manipulated with this object.




## Methods


### extend

Method use to decorate a given object (publicAPI+model) with vtkProperty2D characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getColor

Get the color of the object.

#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> | the color of the object |


### getColorByReference

Get the color of the object.



### getDisplayLocation

Get the display location of the object.

#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


### getLineWidth

Get the width of a Line. The width is expressed in screen units.

#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


### getOpacity

Get the opacity of the object.

#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


### getPointSize

Get the diameter of a point. The size is expressed in screen units.

#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


### newInstance

Method use to create a new instance of vtkProperty2D with object color, ambient color, diffuse color,
specular color, and edge color white; ambient coefficient=0; diffuse
coefficient=0; specular coefficient=0; specular power=1; Gouraud shading;
and surface representation. Backface and frontface culling are off.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### setColor

Set the color of the object. Has the side effect of setting the
ambient diffuse and specular colors as well. This is basically
a quick overall color setting method.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **r** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **g** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **b** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


### setColorFrom

Set the color of the object. Has the side effect of setting the
ambient diffuse and specular colors as well. This is basically
a quick overall color setting method.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **r** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **g** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **b** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


### setDisplayLocation

Set the display location of the object.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **displayLocation** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


### setLineWidth

Set the width of a Line. The width is expressed in screen units.
This is only implemented for OpenGL.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **lineWidth** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


### setOpacity

Set/Get the object’s opacity. 1.0 is totally opaque and 0.0 is 
completely transparent.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **opacity** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


### setPointSize

Set the diameter of a point. The size is expressed in screen units.
This is only implemented for OpenGL.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **pointSize** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


