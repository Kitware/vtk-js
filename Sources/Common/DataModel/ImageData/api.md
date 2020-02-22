## Introduction

vtkImageData is a data object that is a concrete implementation of vtkDataSet.
vtkImageData represents a geometric structure that is a topological and geometrical regular array of points. Examples include volumes (voxel data) and pixmaps.
All vtkDataSet functions are inherited.


### getExtent(), setExtent(array)
The extent of a dataset is a set of 6 integers. It says what the first and last pixel indices are in each of the three directions. E.g.

```JS
extent = [ i_min, i_max, j_min, j_max, k_min, k_max ]
```

### getDimensions(), setDimensions(array[i,j,k]), setDimensions(i,j,k)
Get the dimensions of the image data as an array of 3 points defining the i,j,k dimensions of the data.
Set the values of the extent, from `0` to `(i-1)`, etc.

### getBounds()
The Bounds of a vtkImage are returned as pairs of world coordinates
```JS
[x_min, x_max, y_min, y_max, z_min, z_max]
```
these are calculated from the Extent, Origin, and Spacing, defined through
```JS
bounds[6] =
[
  i_min*Spacing[0] + Origin[0], i_max*Spacing[0] + Origin[0],
  j_min*Spacing[1] + Origin[1], j_max*Spacing[1] + Origin[1],
  k_min*Spacing[2] + Origin[2], k_max*Spacing[2] + Origin[2]
];
 ```
You can't directly set the bounds. First you need to decide how many pixels across your image will be (i.e. what the extent should be), and then you must find the origin and spacing that will produce the bounds that you need from the extent that you have. This is simple algebra.

In general, always set the extent to start at zero, e.g. `[0, 9, 0, 9, 0, 9]` for a 10x10x10 image. Calling `setDimensions(10,10,10)` does exactly the same thing as `setExtent(0,9,0,9,0,9)` but you should always do the latter to be explicit about where your extent starts.

### getDirection(), setDirection(array[9]), setDirection(...array)
Direction is a `mat3` matrix corresponding to the axes directions in world coordinates for the I, J, K axes of the image. Direction must form an orthonormal basis. `setDirection` can be called with an array of length 9, or each part provided as individual arguments.

### getNumberOfCells()
Standard vtkDataSet API method.

### getNumberOfPoints()
Determine the number of points composing the dataset.

### getPoint(index)
Returns the world position of a data point. Index is the point's index in the 1D data array.

### indexToWorld(in, out), indexToWorldVec3(vin, vout)
Converts the input index vector `[i,j,k]` to world values `[x,y,z]`. Modifies the out vector array in place, but also returns it.
Can be sped up by providing `gl-matrix vec3` objects directly to `indexToWorldVec3`

### worldToIndex(in, out), worldToIndexVec3(vin, vout)
Converts the input world vector `[x,y,z]` to approximate index values `[i,j,k]`. Should be rounded to integers before attempting to access the index. Modifies the out vector array in place, but also returns it.
Can be sped up by providing `gl-matrix vec3` objects directly to `worldToIndexVec3`

### getIndexToWorld(), getWorldToIndex()
Returns the `mat4` matrices used to convert between world and index. `worldToIndex` is the inverse matrix of `indexToWorld`. Both are made with `Float64Array`.

### indexToWorldBounds(in[6], out[6]?)
Calculate the corresponding world bounds for the given index bounds `[i_min, i_max, j_min, j_max, k_min, k_max]`. Modifies `out` in place if provided, or returns a new array.

### worldToIndexBounds(in[6], out[6]?)
Calculate the corresponding index bounds for the given world bounds `[x_min, x_max, y_min, y_max, z_min, z_max]`. Modifies `out` in place if provided, or returns a new array.

### getCenter()
Returns an `[x,y,z]` location of the center of the imageData.

### getOffsetIndexFromWorld(vec3)
Returns the data array index for the point at the provided world position.

### getScalarValueFromWorld(vec3, comp)
Returns the scalar value for the point at the provided world position, or `NaN` if the world bounds are outside the volumeData bounds. `comp` is the scalar component index, for multi-component scalar data.

### computeHistogram(worldBounds[6], voxelFunc?)
Returns an object with `{ minimum, maximum, average, variance, sigma }` of the imageData points found within the provided `worldBounds`.

`voxelFunc(index, bounds)` is an optional function that is called with the `[i,j,k]` index and index `bounds`, expected to return truthy if the data point should be counted in the histogram, and falsey if not.

### *(internal)* extentToBounds(extent)
Returns a bounds array from a given Extent, useful if you need to calculate the world bounds of a subset of the imageData's data.

### *(internal)* computeTransforms()
Calculates the `indexToWorld` and `worldToIndex` conversion matrices from the origin, direction, and spacing. Shouldn't need to call this as it is handled internally, and updated whenever the vtkImageData is modified.

### *(internal)* computeIncrements(extent, numberOfComponents = 1)
Returns an `array[3]` of values to multiply an `[i,j,k]` index to convert into the actual data array index, from the provided extent. `numberOfComponents` should match the Scalar components.

### *(internal)* computeOffsetIndex([i, j, k])
Converts an `[i,j,k]` index to the flat data array index. Returns `NaN` if any of the i,j,k bounds are outside the data Extent.
