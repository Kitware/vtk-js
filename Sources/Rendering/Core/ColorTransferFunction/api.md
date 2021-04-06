## Introduction

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
// create color transfer function
const ctfun = vtkColorTransferFunction.newInstance();
ctfun.addRGBPoint(200.0, 1.0, 1.0, 1.0);
ctfun.addRGBPoint(2000.0, 0.0, 0.0, 0.0);
```


## See Also

## Methods


### addHSVPoint

Add a point defined in HSV


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **h** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **s** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **v** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### addHSVPointLong

Add a point defined in HSV


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **h** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **s** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **v** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **midpoint** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **sharpness** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### addHSVSegment

Add a line defined in HSV


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x1** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **h1** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **s1** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **v1** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **x2** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **h2** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **s2** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **v2** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### addRGBPoint

Add a point defined in RGB


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **r** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **g** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **b** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### addRGBPointLong

Add a point defined in RGB


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **r** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **g** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **b** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **midpoint** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **sharpness** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### addRGBSegment

Add a line defined in RGB


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x1** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **r1** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **g1** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **b1** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **x2** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **r2** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **g2** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **b2** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### adjustRange




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **range** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### applyColorMap




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **colorMap** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### buildFunctionFromTable




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **xStart** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **xEnd** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **size** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **table** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### estimateMinNumberOfSamples

--------------------------------------------------------------------------


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x1** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **x2** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### extend

Method use to decorate a given object (publicAPI+model) with vtkColorTransferFunction characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### fillFromDataPointer




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **nb** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **ptr** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### findMinimumXDistance





### getBlueValue

Returns the blue color evaluated at the specified location


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### getColor

Returns the RGB color evaluated at the specified location


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **rgb** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### getGreenValue

Returns the green color evaluated at the specified location


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### getIndexedColor




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **idx** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **rgba** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### getNodeValue

For a specified index value, get the node parameters


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **index** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **val** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### getNumberOfAvailableColors





### getRedValue

Returns the red color evaluated at the specified location


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### getSize

Return the number of points which specify this function



### getTable

Returns a table of RGB colors at regular intervals along the function


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **xStart** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **xEnd** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **size** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **table** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### getUint8Table




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **xStart** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **xEnd** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **size** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **withAlpha** | <span class="arg-type">boolean</span></br></span><span class="arg-required">required</span> |  |


### mapData




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **input** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **output** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **outFormat** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **inputOffset** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### mapScalarsThroughTable




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **input** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **output** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **outFormat** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **inputOffset** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### mapValue

Returns the RGBA color evaluated at the specified location


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### movePoint




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **oldX** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **newX** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### newInstance

Method use to create a new instance of vtkColorTransferFunction


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### removeAllPoints

Remove all points



### removePoint

Remove a point


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### setMappingRange




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **min** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **max** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### setNodeValue

For a specified index value, get the node parameters


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **index** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **val** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |


### setNodes

Set nodes directly


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **nodes** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### sortAndUpdateRange

Sort the vector in increasing order, then fill in
the Range



### updateRange





