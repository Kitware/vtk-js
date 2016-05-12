## OpenGL vertex buffer object

OpenGL buffer object to store geometry and/or attribute data on the GPU.

### createVBO(points, numPoints, normals, tcoords, colors, colorComponents)

Take the points, and pack them into this VBO. This currently takes whatever the input
type might be and packs them into a VBO using floats for the vertices and normals, and
unsigned char for the colors (if the array is non-null).

### appendVBO(points, numPoints, normals, tcoords, colors, colorComponents)

Take the points, and append them into this VBO.

### coordShiftAndScaleEnabled

Set/Get the variable indicating whether coordinate shift and scale is enabled.

### coordShiftAndScaleMethod

Set/Get the shift and scale method.  The options are specified in the "Constants.js"
file, but are shown below:

```js
export const SHIFT_SCALE_METHOD = {
  DISABLE_SHIFT_SCALE: 0,   // Do not shift/scale point coordinates. Ever!
  AUTO_SHIFT_SCALE: 1,      // The default, automatic computation.
  MANUAL_SHIFT_SCALE: 2,    // Manual shift/scale provided (for use with AppendVBO)
};
```

### coordShift

Set/Get the coordinate shift array.

### coordScale

Set/Get the coordinate scale array.

## Coordinate Shift

Coordinate shift and scale is not yet implemented.

```
By default, shift and scale vectors are enabled whenever CreateVBO is called with
points whose bounds are many bbox-lengths away from the origin.

 Shifting and scaling may be completely disabled,
 or manually specified, or left at the default.

 Manual specification is for the case when you
 will be calling AppendVBO instead of just CreateVBO
 and know better bounds than the what CreateVBO
 might produce.

 The automatic method tells CreatVBO to compute shift and
 scale vectors that remap the points to the unit cube.

  // Get the shift and scale vectors computed by CreateVBO;
  // or set the values CreateVBO and AppendVBO will use.
  // Note that the "Set" methods **must** be called before the
  // first time that CreateVBO or AppendVBO is invoked and
  // should never be called afterwards.
  //
  // The CoordShiftAndScaleMethod describes how the shift
  // and scale vectors are obtained (or that they should never
  // be used).
  // The GetCoordShiftAndScaleEnabled() method returns true if
  // a shift and scale are currently being applied (or false if not).
  //
  // The "Get" methods are used by the mapper to modify the world
  // and camera transformation matrices to match the scaling applied
  // to coordinates in the VBO.
  // CreateVBO only applies a shift and scale when the midpoint
  // of the point bounding-box is distant from the origin by a
  // factor of 10,000 or more relative to the size of the box
  // along any axis.
  //
  // For example, if the x coordinates of the points range from
  // 200,000 to 200,001 then the factor is
  // 200,000.5 / (200,001 - 200,000) = 2x10^5, which is larger
  // than 10,000 -- so the coordinates will be shifted and scaled.
  //
  // This is important as many OpenGL drivers use reduced precision
  // to hold point coordinates.
  //
  // These methods are used by the mapper to determine the
  // additional transform (if any) to apply to the rendering transform.
```
