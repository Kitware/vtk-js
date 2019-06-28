## Introduction

vtkImageOutlineFilter - generates outline of labelmap from an vtkImageData input in a given direction (slicing mode).   


vtkImageOutlineFilter creates a region (labelmap) outline based on input data given . The output
is a vtkImageData object containing only boundary voxels.

## Parameters
### slicingMode
[optional, default=SlicingMode.K] -  slicing mode (orientation)
### background
[optional, default=0] -  background value  
 

## Execution
``npm run example -- ImageOutlineFilter``
