## Introduction

vtkTubeFilter - A filter that generates tubes around lines

vtkTubeFilter is a filter that generates a tube around each input line.  The
tubes are made up of triangle strips and rotate around the tube with the
rotation of the line normals. (If no normals are present, they are computed
automatically.) The radius of the tube can be set to vary with scalar or
vector value. If the radius varies with scalar value the radius is linearly
adjusted. If the radius varies with vector value, a mass flux preserving
variation is used. The number of sides for the tube also can be specified.
You can also specify which of the sides are visible. This is useful for
generating interesting striping effects. Other options include the ability to
cap the tube and generate texture coordinates.  Texture coordinates can be
used with an associated texture map to create interesting effects such as
marking the tube with stripes corresponding to length or time.

This filter is typically used to create thick or dramatic lines. Another
common use is to combine this filter with vtkStreamTracer to generate
streamtubes.

**Warning**

The number of tube sides must be greater than 3.

**Warning**

The input line must not have duplicate points, or normals at points that are
parallel to the incoming/outgoing line segments. If a line does not meet this
criteria, then that line is not tubed.




## Methods


### extend

Method used to decorate a given object (publicAPI+model) with vtkTubeFilter characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getCapping

Get whether the capping is enabled or not.



### getDefaultNormal

Get the default normal value.



### getGenerateTCoords

Get generateTCoords value.



### getNumberOfSides

Get the number of sides for the tube.



### getOffset

Get offset value.



### getOnRatio

Get onRatio value.



### getOutputPointsPrecision

Get the desired precision for the output types.



### getRadius

Get the minimum tube radius.



### getRadiusFactor

Get the maximum tube radius in terms of a multiple of the minimum radius.



### getSidesShareVertices

Get sidesShareVertices value.



### getTextureLength

Get textureLength value.



### getUseDefaultNormal

Get useDefaultNormal value.



### getVaryRadius

Get variation of tube radius with scalar or vector values.



### newInstance

Method used to create a new instance of vtkTubeFilter


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### requestData




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **inData** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **outData** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setCapping

Enable / disable capping the ends of the tube with polygons.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **capping** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setDefaultNormal

Set the default normal to use if no normals are supplied. Requires that
useDefaultNormal is set.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **defaultNormal** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setGenerateTCoords

Control whether and how texture coordinates are produced. This is useful
for stripping the tube with length textures, etc. If you use scalars to
create the texture, the scalars are assumed to be monotonically
increasing (or decreasing).


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **generateTCoords** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setNumberOfSides

Set the number of sides for the tube. At a minimum, number of sides is 3.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **numberOfSides** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setOffset

Control the stripping of tubes. The offset sets the first tube side that
is visible. Offset is generally used with onRatio to create nifty
stripping effects.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **offset** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setOnRatio

Control the stripping of tubes. If OnRatio is greater than 1, then every
nth tube side is turned on, beginning with the offset side.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **onRatio** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setOutputPointsPrecision

Set the desired precision for the output types.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **outputPointsPrecision** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setRadius

Set the minimum tube radius (minimum because the tube radius may vary).


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **radius** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### setRadiusFactor

Set the maximum tube radius in terms of a multiple of the minimum radius.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **radiusFactor** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### setSidesShareVertices

Control whether the tube sides should share vertices. This creates
independent strips, with constant normals so the tube is always faceted
in appearance.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **sidesShareVertices** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setTextureLength

Control the conversion of units during texture coordinates calculation.
The texture length indicates what length (whether calculated from scalars
or length) is mapped to [0, 1) texture space.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **textureLength** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setUseDefaultNormal

Control whether to use the defaultNormal.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **useDefaultNormal** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setVaryRadius

Enable or disable variation of tube radius with scalar or vector values.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **varyRadius** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


