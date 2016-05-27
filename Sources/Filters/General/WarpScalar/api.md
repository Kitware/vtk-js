## Introduction

vtkWarpScalar - deform geometry with scalar data

vtkWarpScalar is a filter that modifies point coordinates by moving
points along point normals by the scalar amount times the scale factor.
Useful for creating carpet or x-y-z plots.

If normals are not present in data, the Normal instance variable will
be used as the direction along which to warp the geometry. If normals are
present but you would like to use the Normal instance variable, set the
UseNormal boolean to true.

If XYPlane boolean is set true, then the z-value is considered to be
a scalar value (still scaled by scale factor), and the displacement is
along the z-axis. If scalars are also present, these are copied through
and can be used to color the surface.

Note that the filter passes both its point data and cell data to
its output, except for normals, since these are distorted by the
warping.

## Public API

### scaleFactor

Set/Get the value to scale displacement.

### useNormal

Turn on/off use of user specified normal. If on, data normals will be ignored
and instance variable Normal will be used instead.

### normal

Set/Get then normal (i.e., direction) along which to warp geometry. Only used
if useNormal boolean set to true or no normals available in data.

### xyPlane

Turn on/off flag specifying that input data is x-y plane. If x-y plane, then
the z value is used to warp the surface in the z-axis direction (times the scale
factor) and scalars are used to color the surface.
