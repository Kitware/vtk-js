## Introduction

vtkVolumeProperty is used to represent common properties associated
with volume rendering. This includes properties for determining the type
of interpolation to use when sampling a volume, the color of a volume,
the scalar opacity of a volume, the gradient opacity of a volume, and the
shading parameters of a volume.

When the scalar opacity or the gradient opacity of a volume is not set,
then the function is defined to be a constant value of 1.0. When a
scalar and gradient opacity are both set simultaneously, then the opacity
is defined to be the product of the scalar opacity and gradient opacity
transfer functions.

Most properties can be set per "component" for volume mappers that
support multiple independent components. If you are using 2 component
data as LV or 4 component data as RGBV (as specified in the mapper)
only the first scalar opacity and gradient opacity transfer functions
will be used (and all color functions will be ignored). Omitting the
index parameter on the Set/Get methods will access index = 0.

When independent components is turned on, a separate feature (useful
for volume rendering labelmaps) is available.  By default all components
have an "opacityMode" of `FRACTIONAL`, which results in the usual
addition of that components scalar opacity function value to the final
opacity of the fragment.  By setting one or more components to have a
`PROPORTIONAL` "opacityMode" instead, the scalar opacity lookup value
for those components will not be used to adjust the fragment opacity,
but rather used to multiply the color of that fragment.  This kind of
rendering makes sense for labelmap components because the gradient of
those fields is meaningless and should not be used in opacity
computation.  At the same time, multiplying the color value by the
piecewise scalar opacity function value provides an opportunity to
design piecewise constant opacity functions (step functions) that can
highlight any subset of label values.

vtkColorTransferFunction is a color mapping in RGB or HSV space that
uses piecewise hermite functions to allow interpolation that can be
piecewise constant, piecewise linear, or somewhere in-between
(a modified piecewise hermite function that squishes the function
according to a sharpness parameter). The function also allows for
the specification of the midpoint (the place where the function
reaches the average of the two bounding nodes) as a normalize distance
between nodes.

See the description of class vtkPiecewiseFunction for an explanation of
midpoint and sharpness.


## Usage

```js
// create color and opacity transfer functions
const ctfun = vtkColorTransferFunction.newInstance();
ctfun.addRGBPoint(200.0, 1.0, 1.0, 1.0);
ctfun.addRGBPoint(2000.0, 0.0, 0.0, 0.0);
const ofun = vtkPiecewiseFunction.newInstance();
ofun.addPoint(200.0, 0.0);
ofun.addPoint(1200.0, 0.2);
ofun.addPoint(4000.0, 0.4);

// set them on the property
volume.getProperty().setRGBTransferFunction(0, ctfun);
volume.getProperty().setScalarOpacity(0, ofun);
volume.getProperty().setScalarOpacityUnitDistance(0, 4.5);
volume.getProperty().setInterpolationTypeToLinear();
```


## Methods


### extend

Method use to decorate a given object (publicAPI+model) with vtkVolumeProperty characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getAmbient

Get the ambient lighting coefficient.



### getColorChannels




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **index** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### getComponentWeight

Get the scalar component weights.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **index** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### getDiffuse

Get the diffuse lighting coefficient.



### getGradientOpacityMaximumOpacity




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **index** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### getGradientOpacityMaximumValue




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **index** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### getGradientOpacityMinimumOpacity




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **index** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### getGradientOpacityMinimumValue




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **index** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### getGrayTransferFunction

Get the currently set gray transfer function. Create one if none set.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **index** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### getIndependentComponents





### getInterpolationType

Get the interpolation type for sampling a volume.



### getInterpolationTypeAsString

Get the interpolation type for sampling a volume as a string.



### getLabelOutlineThickness





### getMTime

Return the `Modified Time` which is a monotonic increasing integer
global for all vtkObjects.

This allow to solve a question such as:
 - Is that object created/modified after another one?
 - Do I need to re-execute this filter, or not? ...

#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> | the global modified time |


### getOpacityMode





### getRGBTransferFunction

Get the currently set RGB transfer function. Create one if none set.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **index** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### getScalarOpacity

Get the scalar opacity transfer function. Create one if none set.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **index** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### getScalarOpacityUnitDistance

Get the unit distance on which the scalar opacity transfer function is defined.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **index** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### getShade

Get the shading of a volume.



### getSpecular





### getSpecularPower

Get the specular power.



### getUseGradientOpacity




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **index** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### getUseLabelOutline





### newInstance

Method use to create a new instance of vtkVolumeProperty



### setAmbient

Set the ambient lighting coefficient.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **ambient** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### setComponentWeight

Set the scalar component weights.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **index** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **value** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### setDiffuse

Set the diffuse lighting coefficient.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **diffuse** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### setGradientOpacityMaximumOpacity




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **index** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **value** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### setGradientOpacityMaximumValue




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **index** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **value** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### setGradientOpacityMinimumOpacity




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **index** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **value** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### setGradientOpacityMinimumValue




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **index** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **value** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### setGrayTransferFunction

Set the color of a volume to a gray transfer function


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **index** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **func** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setIndependentComponents

Does the data have independent components, or do some define color only?
If IndependentComponents is On (the default) then each component will be
independently passed through a lookup table to determine RGBA, shaded.

Some volume Mappers can handle 1 to 4 component unsigned char or unsigned
short data (see each mapper header file to determine functionality). If
IndependentComponents is Off, then you must have either 2 or 4 component
data. For 2 component data, the first is passed through the first color
transfer function and the second component is passed through the first
scalar opacity (and gradient opacity) transfer function. Normals will be
generated off of the second component. When using gradient based opacity
modulation, the gradients are computed off of the second component. For 4
component data, the first three will directly represent RGB (no lookup
table). The fourth component will be passed through the first scalar
opacity transfer function for opacity and first gradient opacity transfer
function for gradient based opacity modulation. Normals will be generated
from the fourth component. When using gradient based opacity modulation,
the gradients are computed off of the fourth component.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **independentComponents** | <span class="arg-type">boolean</span></br></span><span class="arg-required">required</span> |  |


### setInterpolationType

Set the interpolation type for sampling a volume.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **interpolationType** | <span class="arg-type">InterpolationType</span></br></span><span class="arg-required">required</span> |  |


### setInterpolationTypeToFastLinear

Set interpolation type to FAST_LINEAR



### setInterpolationTypeToLinear

Set interpolation type to LINEAR



### setInterpolationTypeToNearest

Set interpolation type to NEAREST



### setLabelOutlineThickness




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **labelOutlineThickness** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### setOpacityMode




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **index** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **value** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### setRGBTransferFunction

Set the color of a volume to an RGB transfer function


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **index** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **func** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setScalarOpacity

Set the scalar opacity of a volume to a transfer function


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **index** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **func** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setScalarOpacityUnitDistance

Set the unit distance on which the scalar opacity transfer function is
defined.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **index** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **value** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### setShade

Set the shading of a volume.

If shading is turned off, then the mapper for the volume will not perform
shading calculations. If shading is turned on, the mapper may perform
shading calculations - in some cases shading does not apply (for example,
in a maximum intensity projection) and therefore shading will not be
performed even if this flag is on. For a compositing type of mapper,
turning shading off is generally the same as setting ambient=1,
diffuse=0, specular=0. Shading can be independently turned on/off per
component.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **shade** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### setSpecular




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **specular** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### setSpecularPower

Set the specular power.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **specularPower** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### setUseGradientOpacity




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **index** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **value** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### setUseLabelOutline




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **useLabelOutline** | <span class="arg-type">boolean</span></br></span><span class="arg-required">required</span> |  |


