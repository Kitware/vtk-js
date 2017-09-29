## Introduction

vtkSampleFunction - sample an implicit function over a volume

vtkSampelFunction is a filter that samples an implicit function over
a volume. For example, a vtkPlane or vtkSphere can be defined, along with a 
volume extent (dimensions and geometric bounds) and spacing. The filter will
then sample the implicit function over all voxels.

## Public API

### sampleDimensions

Set/Get the dimensions of the volume in the x-y-z directions.

### modelBounds

Set/Get the bounds of the volume in 3D space.

