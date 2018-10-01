## Introduction

vtkImageProperty -- image display properties

vtkImageProperty is an object that allows control of the display
of an image slice.

## See Also

[vtkImageMapper](./Rendering_Core_ImageMapper.html)
[vtkImageProperty](./Rendering_Core_ImageProperty.html)

## Methods

### getInterpolationType
### getInterpolationTypeAsString
### setInterpolationTypeToNearest
### setInterpolationTypeToLinear

Set/Get the interpolation type for sampling a volume. The initial
value is LINEAR. NEAREST interpolation will snap to the closest
voxel, LINEAR will perform bilinear interpolation to compute a
scalar value from surrounding voxels.

### colorWindow

Controls the window in a window level mapping of the input image. Window
level mapping is a technique to map the raw data values of an image
into screen intensities in a manner akin to

pixelIntensity = (inputValue - level)/window;

### colorLevel

Controls the level in a window level mapping of the input image. Window
level mapping is a technique to map the raw data values of an image
into screen intensities in a manner akin to

pixelIntensity = (inputValue - level)/window;

### ambient

Control the ambient lighting intensity for this image.

### diffuse

Control the diffuse lighting intensity of this image.

### opacity

Control the opacity of this image.

### rGBTransferFunction

Specify vtkColorTransferFunction to map scalars to colors. If set, then
colorWindow and colorLevel are not used.

### scalarOpacity

Specify a vtkPiecewiseFunction to map image intensities to opacities. This
will only work on single-component images. The overall image opacity can
still be affected by the `opacity` property.
