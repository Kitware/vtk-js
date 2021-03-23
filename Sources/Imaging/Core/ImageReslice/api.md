## Introduction
vtkImageReslice - Reslices a volume along a new set of axes

vtkImageReslice is the swiss-army-knife of image geometry filters:
It can permute, rotate, flip, scale, resample, deform, and pad image
data in any combination with reasonably high efficiency.  Simple
operations such as permutation, resampling and padding are done
with similar efficiently to the specialized vtkImagePermute,
vtkImageResample, and vtkImagePad filters.  There are a number of
tasks that vtkImageReslice is well suited for:
1) Application of simple rotations, scales, and translations to
an image. It is often a good idea to use vtkImageChangeInformation
to center the image first, so that scales and rotations occur around
the center rather than around the lower-left corner of the image.
2) Extraction of slices from an image volume. The method
SetOutputDimensionality(2) is used to specify that want to output a
slice rather than a volume. You can use both the resliceAxes and the
resliceTransform at the same time, in order to extract slices from a
volume that you have applied a transformation to.

## Usage

Provide the input to the filter via the standard
`SetInput(Data/Connection)` methods.

```js
const imageReslice = vtkImageReslice.newInstance();
imageReslice.setInputData(imageData);
imageReslice.setOutputDimensionality(2);
const axes = mat4.identity(new Float64Array(16));
mat4.rotateX(axes, axes, 45 * Math.PI / 180);
imageReslice.setResliceAxes(axes);
imageReslice.setOutputScalarType('Uint16Array');
imageReslice.setScalarScale(65535 / 255);

const obliqueSlice = imageReslice.getOutputData();
```

## Public API

### ResliceAxes (set/get)

This method is used to set up the axes for the output voxels.
The output Spacing, Origin, and Extent specify the locations
of the voxels within the coordinate system defined by the axes.
The ResliceAxes are used most often to permute the data, e.g.
to extract ZY or XZ slices of a volume as 2D XY images.
The first column of the matrix specifies the x-axis
vector (the fourth element must be set to zero), the second
column specifies the y-axis, and the third column the
z-axis.  The fourth column is the origin of the
axes (the fourth element must be set to one).

### OutputDimensionality (set/get)

Force the dimensionality of the output to either 1, 2,
3 or 0 (default: 3).  If the dimensionality is 2D, then
the Z extent of the output is forced to (0,0) and the Z
origin of the output is forced to 0.0 (i.e. the output
extent is confined to the xy plane).  If the dimensionality
is 1D, the output extent is confined to the x axis.
For 0D, the output extent consists of a single voxel at
(0,0,0).

### OutputOrigin (set/get)

Set the origin for the output data.  The default output origin
is the input origin permuted through the ResliceAxes.

### OutputSpacing (set/get)

Set the voxel spacing for the output data.  The default output
spacing is the input spacing permuted through the ResliceAxes.

### OutputExtent (set/get)

Set the extent for the output data.  The default output extent
is the input extent permuted through the ResliceAxes.

### OutputScalarType (set/get)

Set the scalar type of the output to be different from the input.
The default value is null, which means that the input scalar type will be
used to set the output scalar type.  Otherwise, this must be set to one
of the following types: VtkDataTypes.CHAR, VtkDataTypes.SIGNED_CHAR,
VtkDataTypes.UNSIGNED_CHAR, VtkDataTypes.SHORT, VtkDataTypes.UNSIGNED_SHORT,
VtkDataTypes.INT, VtkDataTypes.UNSIGNED_INT, VtkDataTypes.FLOAT or
VtkDataTypes.DOUBLE. Other types are not permitted. If the output type
is an integer type, the output will be rounded and clamped to the limits of
the type.

See the documentation for [vtkDataArray::getDataType()](../api/Common_Core_DataArray.html#getDataType-String) for additional data type settings.

### ScalarShift (set/get)

Set a value to add to all the output voxels.
After a sample value has been interpolated from the input image, the
equation u = (v + ScalarShift)*ScalarScale will be applied to it before
it is written to the output image.  The result will always be clamped to
the limits of the output data type.

### ScalarScale (set/get)

Set multiplication factor to apply to all the output voxels.
After a sample value has been interpolated from the input image, the
equation u = (v + ScalarShift)*ScalarScale will be applied to it before
it is written to the output image.  The result will always be clamped to
the limits of the output data type.

### Wrap (set/get)

Turn on wrap-pad feature (default: false).

### Mirror (set/get)

Turn on mirror-pad feature (default: false). This will override the wrap-pad.

### Border (set/get)

Extend the apparent input border by a half voxel (default: On).
This changes how interpolation is handled at the borders of the
input image: if the center of an output voxel is beyond the edge
of the input image, but is within a half voxel width of the edge
(using the input voxel width), then the value of the output voxel
is calculated as if the input's edge voxels were duplicated past
the edges of the input.
This has no effect if Mirror or Wrap are on.

### BackgroundColor (set/get)

Set the background color (for multi-component images).


### TransformInputSampling (set/get)

Specify whether to transform the spacing, origin and extent
of the Input (or the InformationInput) according to the
direction cosines and origin of the ResliceAxes before applying
them as the default output spacing, origin and extent
(default: true).

### AutoCropOutput (set/get)

Turn this on if you want to guarantee that the extent of the
output will be large enough to ensure that none of the
data will be cropped (default: false).
