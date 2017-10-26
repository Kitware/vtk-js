## Introduction

vtkImageMarchingCubes - isocontour a volume

Given a specified contour value, generate a isosurface using the
Marching Cubes algorithm.

## Public API

### contourValue

Set/Get the isocontour value.

### computeNormals

Enable/disable the computing of point normals from the scalar field.
This tends to produce more pleasing visual results but takes
additional computation.

### mergePoints

As triangles forming the isosurface are generated, indicate whether
conincident points are to be merged. Merging produces watertight surfaces
at the cost of additional memory and computation.
