## Introduction

vtkVolumeProperty is used to represent common properties associated
with volume rendering. This includes properties for determining the type
of interpolation to use when sampling a volume, the color of a volume,
the scalar opacity of a volume, the gradient opacity of a volume, and the
shading parameters of a volume.

When the scalar opacity or the gradient opacity of a volume is not set,
then the function is defined to be a constant value of 1.0. When a
scalar and gradient opacity are both set simultaneously, then the opacity
is defined to be the product of the scalar opacity and gradient opacity
transfer functions.

Most properties can be set per "component" for volume mappers that
support multiple independent components. If you are using 2 component
data as LV or 4 component data as RGBV (as specified in the mapper)
only the first scalar opacity and gradient opacity transfer functions
will be used (and all color functions will be ignored). Omitting the
index parameter on the Set/Get methods will access index = 0.

vtkColorTransferFunction is a color mapping in RGB or HSV space that
uses piecewise hermite functions to allow interpolation that can be
piecewise constant, piecewise linear, or somewhere in-between
(a modified piecewise hermite function that squishes the function
according to a sharpness parameter). The function also allows for
the specification of the midpoint (the place where the function
reaches the average of the two bounding nodes) as a normalize distance
between nodes.

See the description of class vtkPiecewiseFunction for an explanation of
midpoint and sharpness.

## Usage

```js

  // create color and opacity transfer functions
  const ctfun = vtkColorTransferFunction.newInstance();
  ctfun.addRGBPoint(200.0, 1.0, 1.0, 1.0);
  ctfun.addRGBPoint(2000.0, 0.0, 0.0, 0.0);
  const ofun = vtkPiecewiseFunction.newInstance();
  ofun.addPoint(200.0, 0.0);
  ofun.addPoint(1200.0, 0.2);
  ofun.addPoint(4000.0, 0.4);

  // set them on the property
  volume.getProperty().setRGBTransferFunction(0, ctfun);
  volume.getProperty().setScalarOpacity(0, ofun);
  volume.getProperty().setScalarOpacityUnitDistance(0, 4.5);
  volume.getProperty().setInterpolationTypeToLinear();

```

## See Also

[vtkColorTransferFunction](./Rendering_Core_ColorTransferFunction.html)
[vtkPiecewiseFunction](./Common_DataModel_PiecewiseFunction.html)
[vtkVolume](./Rendering_Core_Volume.html)

## Methods

### getInterpolationType
### getInterpolationTypeAsString
### setInterpolationTypeToNearest
### setInterpolationTypeToFastLinear
### setInterpolationTypeToLinear

Set/Get the interpolation type for sampling a volume. The initial
value is FAST_LINEAR. NEAREST interpolation will snap to the closest
voxel, LINEAR will perform trilinear interpolation to compute a
scalar value from surrounding voxels. FAST_LINEAR under WebGL 1
will perform bilinear interpolation on X and Y but use nearest
for Z. This is slightly faster than full linear at the cost of
no Z axis linear interpolation.

### setScalarOpacityUnitDistance

Set/Get the unit distance on which the scalar opacity transfer function
is defined. By default this is 1.0, meaning that over a distance of
1.0 units, a given opacity (from the transfer function) is accumulated.
This is adjusted for the actual sampling distance during rendering.
