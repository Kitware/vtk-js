## Introduction

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

## Useage

```js
  // create color transfer function
  const ctfun = vtkColorTransferFunction.newInstance();
  ctfun.addRGBPoint(200.0, 1.0, 1.0, 1.0);
  ctfun.addRGBPoint(2000.0, 0.0, 0.0, 0.0);
```

## See Also

[vtkPiecewiseFunction](./Common_DataModel_PiecewiseFunction.html) 

## newInstance()

Construct a new vtkColorTransferFunction with some initial content.

### api TBD


### addRGBPoint( x, r, g, b)
### addRGBPointLong( x, r, g, b, midpoint, sharpness)
### removePoint( x );
### removeAllPoints();

Add/Remove a point to/from the function defined in RGB or HSV
Return the index of the point (0 based), or -1 on error.
See the description of class vtkPiecewiseFunction for an explanation of
midpoint and sharpness.

### addRGBSegment(x1, r1, g1, b1, x2, r2, g2, b2 );
### addHSVSegment(x1, h1, s1, v1, x2, h2, s2, v2 );

Add two points to the function and remove all the points between them

### getColor(x, rgb);

Returns an RGB color for the specified scalar value
