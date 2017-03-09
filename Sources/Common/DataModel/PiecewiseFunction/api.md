## Introduction

Defines a piecewise function mapping. This mapping allows the addition
of control points, and allows the user to control the function between
the control points. A piecewise hermite curve is used between control
points, based on the sharpness and midpoint parameters. A sharpness of
0 yields a piecewise linear function and a sharpness of 1 yields a
piecewise constant function. The midpoint is the normalized distance
between control points at which the curve reaches the median Y value.
The midpoint and sharpness values specified when adding a node are used
to control the transition to the next node (the last node's values are
ignored) Outside the range of nodes, the values are 0 if Clamping is off,
or the nearest node point if Clamping is on. Using the legacy methods for
adding points  (which do not have Sharpness and Midpoint parameters)
will default to Midpoint = 0.5 (halfway between the control points) and
Sharpness = 0.0 (linear).


## Usage

```js
  const ofun = vtkPiecewiseFunction.newInstance();
  ofun.addPoint(200.0, 0.0);
  ofun.addPoint(1200.0, 0.2);
  ofun.addPoint(4000.0, 0.4);
```
## Methods

The main method you will use is addPoint or addPointLong
to add points to the function.

## See Also

[vtkColorTransferFunction](./Rendering_Core_ColorTransferFunction.html)
