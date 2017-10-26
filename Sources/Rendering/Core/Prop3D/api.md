## Introduction

vtkProp3D is an abstract class used to represent an entity in a rendering
scene (i.e., vtkProp3D is a vtkProp with an associated transformation
matrix). It handles functions related to the position, orientation and
scaling. It combines these instance variables into one 4x4 transformation
matrix as follows: [x y z 1] = [x y z 1] Translate(-origin) Scale(scale)
Rot(y) Rot(x) Rot (z) Trans(origin) Trans(position). Both vtkActor and
vtkVolume are specializations of class vtkProp. The constructor defaults
to: origin(0,0,0) position=(0,0,0) orientation=(0,0,0), no user defined
matrix or transform, and no texture map.

## newInstance()

### position (add/set/get)

Set/Get/Add the position of the Prop3D in world coordinates.

### origin

Set/Get the origin of the Prop3D. This is the point about which all
rotations take place.

### scale

Set/Get the scale of the actor. Scaling in performed independently on the
X, Y and Z axis. A scale of zero is illegal and will be replaced with one.

### getMatrix() : mat4

Return a reference to the Prop3D's 4x4 composite matrix.
Get the matrix from the position, origin, scale and orientation This
matrix is cached, so multiple GetMatrix() calls will be efficient.

### getBounds() : []

Get the bounds for this Prop3D as (Xmin,Xmax,Ymin,Ymax,Zmin,Zmax).

### getCenter() : []

Get the center of the bounding box in world coordinates.

### getXRange() : []

Get the Prop3D's x range in world coordinates.

### getYRange() : []

Get the Prop3D's y range in world coordinates.

### getZRange() : []

Get the Prop3D's z range in world coordinates.

### getLength() : Number

Get the length of the diagonal of the bounding box.

### rotateX(angle)

Rotate the Prop3D in degrees about the X axis using the right hand
rule. The axis is the Prop3D's X axis, which can change as other
rotations are performed. To rotate about the world X axis use
RotateWXYZ (angle, 1, 0, 0). This rotation is applied before all
others in the current transformation matrix.

### rotateY(angle)

Rotate the Prop3D in degrees about the Y axis using the right hand
rule. The axis is the Prop3D's Y axis, which can change as other
rotations are performed. To rotate about the world Y axis use
RotateWXYZ (angle, 0, 1, 0). This rotation is applied before all
others in the current transformation matrix.

### rotateZ(angle)

Rotate the Prop3D in degrees about the Z axis using the right hand
rule. The axis is the Prop3D's Z axis, which can change as other
rotations are performed. To rotate about the world Z axis use
RotateWXYZ (angle, 0, 0, 1). This rotation is applied before all
others in the current transformation matrix.

### rotateWXYZ(w, x, y, z)

Rotate the Prop3D in degrees about an arbitrary axis specified by
the last three arguments. The axis is specified in world
coordinates. To rotate an about its model axes, use RotateX,
RotateY, RotateZ.

### orientation (set/get)

Orientation is specified as X, Y and Z rotations in that order,
but they are performed as RotateZ, RotateX, and finally RotateY.

So the returned the orientation is such that the ordering in
which these rotations must be done to generate the same matrix
is RotateZ, RotateX, and finally RotateY.

### getOrientationWXYZ()

Returns the WXYZ orientation of the Prop3D.

### addOrientation(xyz)

Add to the current orientation. See SetOrientation and
getOrientation for more details. This basically does a
getOrientation, adds the passed in arguments, and then calls
setOrientation.

### getUserTransformMatrixMTime()

Get the modified time of the user matrix or user transform.

### setUserMatrix()

In addition to the instance variables such as position and orientation,
you can add an additional transformation matrix for your own use.  This
matrix is concatenated with the actor's internal matrix,
which you implicitly create through the use of setPosition(),
setOrigin() and setOrientation().

### computeMatrix()

Generate the matrix based on internal model.

### getIsIdentity() : Boolean

Return true if no modification/transformation have been set.
