## Introduction

vtkImageMarchingSquares - isocontour an image (or slice from a volume)

Given a specified contour value, generate isolines using the
Marching Squares algorithm (the 2D version of the 3D Marching Cubes
algorithm).

## Public API

### contourValues

Set/Get an array of isocontour values.

### sliceNumber

Set/Get the k-slice number of the input volume. By default the
sliceNumber = 0.

### mergePoints

As lines forming the isolines are generated, indicate whether
conincident points are to be merged. Merging produces connected polylines
at the cost of additional memory and computation.
