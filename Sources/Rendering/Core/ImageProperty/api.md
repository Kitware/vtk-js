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

### independentComponents

Specify whether image components (0 - 3) are treated independently or
dependently.  If `independentComponents` is `true`, each image component
will be treated as an independent "intensity" value and used to look up
a color and piecewise function value independently.

### set/get rGBTransferFunction

Specify or retrieve, per component, a vtkColorTransferFunction to map
scalars to colors. If set, then colorWindow and colorLevel are not used.

The set method takes two arguments, a component index and an rgb transfer
function, in that order.

### set/get scalarOpacity

The `scalarOpacity` property is an alias for `piecewiseFunction`.

### set/get piecewiseFunction

Specify or retrieve, per component, a vtkPiecewiseFunction.  If
`independentComponents` is `true`, the piecewise function is used as a
component weighting function, and resulting colors on the screen will
be blended using the weights which are normalized per fragment in the
fragment shader.  If `independentComponents` is `false`, then the
piecewise function will be used as a traditional scalar opacity function
to map image intensities to opacities.  This latter way of using the
piecewise function will only work on single-component images. In either case,
the overall image opacity can still be affected by the `opacity` property.

The set method takes two arguments, a component index and a piecewise
function, in that order.

### set/get componentWeight

Specify or retrieve, per component, a single scalar weight value to be
applied to the entire image for that component.  This can be used, for
example, to completely disgregard the contribution from a single component.

The set method takes two arguments, a component index and an floating point
component weight, in that order.
