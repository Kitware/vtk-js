## Introduction

The vtkImageCropFilter will crop a vtkImageData. This will only crop against
IJK-aligned planes.

Note this is slow on large datasets due to CPU-bound cropping.

## croppingPlanes (get/set, array length 6)

The cropping planes, in IJK space. Defaults to [0, 0, 0, 0, 0, 0].
