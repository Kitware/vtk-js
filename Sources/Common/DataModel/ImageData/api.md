## Introduction

vtkImageData is a data object that is a concrete implementation of
vtkDataSet. vtkImageData represents a geometric structure that is a
topological and geometrical regular array of points. Examples include volumes
(voxel data) and pixmaps. All vtkDataSet functions are inherited.




## See Also

## Methods


### average





### computeHistogram

Returns an object with `{ minimum, maximum, average, variance, sigma }`
of the imageData points found within the provided `worldBounds`.

`voxelFunc(index, bounds)` is an optional function that is called with
the `[i,j,k]` index and index `bounds`, expected to return truthy if the
data point should be counted in the histogram, and falsey if not.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **worldBounds** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **voxelFunc** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### computeIncrements

Returns an `array[3]` of values to multiply an `[i,j,k]` index to convert
into the actual data array index, from the provided extent.
`numberOfComponents` should match the Scalar components.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **extent** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> |  |
| **numberOfComponents** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |


### computeOffsetIndex

Converts an `[i,j,k]` index to the flat data array index. Returns `NaN`
if any of the i,j,k bounds are outside the data Extent.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **index** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> | the localized `[i,j,k]` pixel array position. Float values will be rounded. |


### computeTransforms

Calculates the `indexToWorld` and `worldToIndex` conversion matrices from
the origin, direction, and spacing. Shouldn't need to call this as it is
handled internally, and updated whenever the vtkImageData is modified.



### extend

Method used to decorate a given object (publicAPI+model) with vtkImageData characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### extentToBounds

Returns a bounds array from a given Extent, useful if you need to
calculate the world bounds of a subset of the imageData's data.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **ex** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### getBounds

The Bounds of a vtkImage are returned as pairs of world coordinates
```[x_min, x_max, y_min, y_max, z_min, z_max]``` these are calculated
from the Extent, Origin, and Spacing, defined
through
```js
bounds[6] =
[
  i_min*Spacing[0] + Origin[0], i_max*Spacing[0] + Origin[0],
  j_min*Spacing[1] + Origin[1], j_max*Spacing[1] + Origin[1],
  k_min*Spacing[2] + Origin[2], k_max*Spacing[2] + Origin[2]
];
 ```
You can't directly set the bounds. First you need to decide how many
pixels across your image will be (i.e. what the extent should be), and
then you must find the origin and spacing that will produce the bounds
that you need from the extent that you have. This is simple algebra. In
general, always set the extent to start at zero, e.g. `[0, 9, 0, 9, 0,
9]` for a 10x10x10 image. Calling `setDimensions(10,10,10)` does exactly
the same thing as `setExtent(0,9,0,9,0,9)` but you should always do the
latter to be explicit about where your extent starts.



### getCenter

Returns an `[x,y,z]` location of the center of the imageData.



### getDimensions

Get dimensions of this structured points dataset. It is the number of
points on each axis. Dimensions are computed from Extents during this
call.



### getDirection

Direction is a `mat3` matrix corresponding to the axes directions in
world coordinates for the I, J, K axes of the image. Direction must form
an orthonormal basis.



### getExtent





### getExtentByReference





### getIndexToWorld

Returns the `mat4` matrices used to convert between world and index.
`worldToIndex` is the inverse matrix of `indexToWorld`. Both are made
with `Float64Array`.



### getOffsetIndexFromWorld

Returns the data array index for the point at the provided world position.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **xyz** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> | the [x,y,z] Array in world coordinates |


### getOrigin

Get the origin of the dataset. The origin is the position in world
coordinates of the point of extent (0,0,0). This point does not have to
be part of the dataset, in other words, the dataset extent does not have
to start at (0,0,0) and the origin can be outside of the dataset bounding
box. The origin plus spacing determine the position in space of the
points.



### getOriginByReference

Get the origin of the dataset. The origin is the position in world



### getPoint

Get the world position of a data point. Index is the point's index in the
1D data array.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **index** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### getScalarValueFromWorld

Returns the scalar value for the point at the provided world position, or
`NaN` if the world bounds are outside the volumeData bounds. `comp` is
the scalar component index, for multi-component scalar data.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **xyz** | <span class="arg-type">Array.<number></span></br></span><span class="arg-required">required</span> | the [x,y,z] Array in world coordinates |
| **comp** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> | the scalar component index for multi-component scalars |
| **xyz** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **comp** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### getSpacing

Set the spacing [width, height, length] of the cubical cells that compose
the data set.



### getSpacingByReference





### getWorldToIndex

Returns the `mat4` matrices used to convert between world and index.
`worldToIndex` is the inverse matrix of `indexToWorld`. Both are made
with `Float64Array`.



### getnumberOfCells





### getnumberOfPoints

Get the number of points composing the dataset.



### indexToWorld

Converts the input index vector `[i,j,k]` to world values `[x,y,z]`.
Modifies the out vector array in place, but also returns it.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **ain** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **aout** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### indexToWorldBounds

Calculate the corresponding world bounds for the given index bounds
`[i_min, i_max, j_min, j_max, k_min, k_max]`. Modifies `out` in place if
provided, or returns a new array.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **bin** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **bout** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### indexToWorldVec3

this is the fast version, requires vec3 arguments


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **vin** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **vout** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### maximum





### minimum





### newInstance

Method used to create a new instance of vtkImageData.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### setDimensions

Set the values of the extent, from `0` to `(i-1)`, etc.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **i** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **j** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **k** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setDimensions

Set the values of the extent, from `0` to `(i-1)`, etc.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **dims** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setDirection

The direction matrix is a 3x3 basis for the I, J, K axes
of the image. The rows of the matrix correspond to the
axes directions in world coordinates. Direction must
form an orthonormal basis, results are undefined if
it is not.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **direction** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setDirection

The direction matrix is a 3x3 basis for the I, J, K axes
of the image. The rows of the matrix correspond to the
axes directions in world coordinates. Direction must
form an orthonormal basis, results are undefined if
it is not.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **e00** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **e01** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **e02** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **e10** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **e11** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **e12** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **e20** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **e21** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **e22** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setExtent

Set the extent.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **extent** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setExtent




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x1** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **x2** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y1** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y2** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z1** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z2** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setOrigin




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **origin** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setOriginFrom




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **origin** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setSpacing




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **spacing** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setSpacingFrom




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **spacing** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### sigma





### variance





### worldToIndex

Converts the input world vector `[x,y,z]` to approximate index values
`[i,j,k]`. Should be rounded to integers before attempting to access the
index. Modifies the out vector array in place, but also returns it.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **ain** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **aout** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### worldToIndexBounds

Calculate the corresponding index bounds for the given world bounds
`[x_min, x_max, y_min, y_max, z_min, z_max]`. Modifies `out` in place if
provided, or returns a new array.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **bin** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **bout** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### worldToIndexVec3

this is the fast version, requires vec3 arguments


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **vin** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **vout** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


