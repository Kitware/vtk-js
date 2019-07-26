## Introduction

The `vtkMatrixBuilder` class provides a system to create a mat4 transformation matrix. All functions return the MatrixBuilder Object instance, allowing transformations to be chained.

Example:
```
let point = [2,5,12];
vtkMatrixBuilder.buildfromDegree().translate(1,0,2).rotateZ(45).apply(point);
```

## Creating an instance
The vtkMatrixBuilder class has two functions, `vtkMatrixBuilder.buildFromDegree()` and `vtkMatrixbuilder.buildFromRadian()`, predefining the angle format used for transformations and returning a MatrixBuilder instance. The matrix is initialized with the Identity Matrix.

## Transformation Functions

### `rotateFromDirections(originDirection, targetDirection)`
Multiplies the current matrix with a transformation matrix created by normalizing both direction vectors and rotating around the axis of the crossProduct by the angle from the dotProduct of the two directions.

### `rotate(angle, axis)`
Normalizes the axis of rotation then rotates the current matrix `angle` degrees/radians around the provided axis.

### `rotateX(angle)`
Rotates `angle` degrees/radians around the X axis.

### `rotateY(angle)`
Rotates `angle` degrees/radians around the Y axis.

### `rotateZ(angle)`
Rotates `angle` degrees/radians around the Z axis.

### `translate(x, y, z)`
Translates the matrix by x, y, z.

### `scale(sx, sy, sz)`
Scales the matrix by sx, sy, sz.

### `identity()`
Resets the MatrixBuilder to the Identity matrix.

### `setMatrix(mat4)`
Copies the given `mat4` into the builder. Useful if you already have a transformation matrix and want to transform it further. Returns the instance for chaining.

## Using the MatrixBuilder result

### `apply(typedArray, offset = 0, nbIterations = -1)`
Multiplies the array by the MatrixBuilder's internal matrix, in sets of 3. Updates the array in place.
If specified, `offset` starts at a given position in the array, and `nbIterations` will determine the number of iterations (sets of 3) to loop through. Assumes the `typedArray` is an array of multiples of 3, unless specifically handling with offset and iterations.
Returns the instance for chaining.

### `getMatrix()`
Returns the internal `mat4` matrix.



