## Introduction

The `vtkMatrixBuilder` class provides a system to create a mat4
transformation matrix. All functions return the MatrixBuilder Object
instance, allowing transformations to be chained.


## Usage

```js
let point = [2,5,12];
vtkMatrixBuilder.buildfromDegree().translate(1,0,2).rotateZ(45).apply(point);
```

The vtkMatrixBuilder class has two functions,
`vtkMatrixBuilder.buildFromDegree()` and
`vtkMatrixbuilder.buildFromRadian()`, predefining the angle format used for
transformations and returning a MatrixBuilder instance. The matrix is
initialized with the Identity Matrix.


## See Also

## Methods


### apply

Multiplies the array by the MatrixBuilder's internal matrix, in sets of
3. Updates the array in place. If specified, `offset` starts at a given
position in the array, and `nbIterations` will determine the number of
iterations (sets of 3) to loop through. Assumes the `typedArray` is an
array of multiples of 3, unless specifically handling with offset and
iterations. Returns the instance for chaining.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **typedArray** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **offset** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **nbIterations** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### getMatrix

Returns the internal `mat4` matrix.



### identity

Resets the MatrixBuilder to the Identity matrix.



### multiply

Resets the MatrixBuilder to the Identity matrix.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **mat4x4** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### new




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **useDegree** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### rotate

Normalizes the axis of rotation then rotates the current matrix `angle`
degrees/radians around the provided axis.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **angle** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **axis** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### rotateFromDirections

Multiplies the current matrix with a transformation matrix created by
normalizing both direction vectors and rotating around the axis of the
crossProduct by the angle from the dotProduct of the two directions.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **originDirection** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **targetDirection** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### rotateX

Rotates `angle` degrees/radians around the X axis.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **angle** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### rotateY

Rotates `angle` degrees/radians around the Y axis.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **angle** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### rotateZ

Rotates `angle` degrees/radians around the Z axis.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **angle** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### scale

Scales the matrix by sx, sy, sz.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **sx** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **sy** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **sz** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setMatrix

Copies the given `mat4` into the builder. Useful if you already have a
transformation matrix and want to transform it further. Returns the
instance for chaining.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **mat4x4** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### translate

Translates the matrix by x, y, z.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


