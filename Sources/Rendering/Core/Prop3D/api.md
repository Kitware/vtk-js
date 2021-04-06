## Introduction

Introduction
---------------------------------------------------------------------------
vtkProp3D is an abstract class used to represent an entity in a rendering
scene (i.e., vtkProp3D is a vtkProp with an associated transformation
matrix). It handles functions related to the position, orientation and
scaling. It combines these instance variables into one 4x4 transformation
matrix as follows: [x y z 1] = [x y z 1] Translate(-origin) Scale(scale)
Rot(y) Rot(x) Rot (z) Trans(origin) Trans(position). Both vtkActor and
vtkVolume are specializations of class vtkProp. The constructor defaults
to: origin(0,0,0) position=(0,0,0) orientation=(0,0,0), no user defined
matrix or transform, and no texture map.




## See Also

## Methods


### addPosition

Add the position of the Prop3D in world coordinates.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **deltaXYZ** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### bounds





### computeMatrix

Generate the matrix based on internal model.



### extend

Method use to decorate a given object (publicAPI+model) with vtkProp3D characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | (default: {}) |


### getBounds

Get the bounds for this Actor as (Xmin,Xmax,Ymin,Ymax,Zmin,Zmax).

#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


### getCenter

Get the center of the bounding box in world coordinates.



### getIsIdentity



#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> | true if no modification/transformation have been set. |


### getLength

Get the length of the diagonal of the bounding box.



### getMatrix

Return a reference to the Prop3D’s 4x4 composite matrix.
Get the matrix from the position, origin, scale and orientation This
matrix is cached, so multiple GetMatrix() calls will be efficient.



### getOrientation

The ordering in which these rotations must be done to generate the same matrix is RotateZ, RotateX, and finally RotateY. See also SetOrientation.

#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> | the orientation of the Prop3D as s vector of X,Y and Z rotation. |


### getOrientationByReference





### getOrientationWXYZ

Get the WXYZ orientation of the Prop3D.



### getOrientationWXYZ

Returns the WXYZ orientation of the Prop3D.



### getOrigin

Get the origin of the Prop3D. This is the point about which all rotations take place.



### getOriginByReference





### getPosition





### getPositionByReference





### getScale

Get the scale of the actor.



### getScaleByReference





### getUserMatrix





### getXRange

Get the Prop3D's x range in world coordinates.



### getYRange

Get the Prop3D's y range in world coordinates.



### getZRange

Get the Prop3D's z range in world coordinates.



### isIdentity

check for identity



### newInstance

Method use to create a new instance of vtkProp3D


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### orientation





### origin





### position





### rotateWXYZ

Rotate the Prop3D in degrees about an arbitrary axis specified by
the last three arguments. The axis is specified in world
coordinates. To rotate an about its model axes, use RotateX,
RotateY, RotateZ.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **degrees** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### rotateX

Rotate the Prop3D in degrees about the X axis using the right hand
rule. The axis is the Prop3D’s X axis, which can change as other
rotations are performed. To rotate about the world X axis use
RotateWXYZ (angle, 1, 0, 0). This rotation is applied before all
others in the current transformation matrix.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **angle** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### rotateY

Rotate the Prop3D in degrees about the Y axis using the right hand
rule. The axis is the Prop3D’s Y axis, which can change as other
rotations are performed. To rotate about the world Y axis use
RotateWXYZ (angle, 0, 1, 0). This rotation is applied before all
others in the current transformation matrix.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **angle** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### rotateZ

Rotate the Prop3D in degrees about the Z axis using the right hand
rule. The axis is the Prop3D’s Z axis, which can change as other
rotations are performed. To rotate about the world Z axis use
RotateWXYZ (angle, 0, 0, 1). This rotation is applied before all
others in the current transformation matrix.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **angle** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### scale





### setOrientation

Orientation is specified as X, Y and Z rotations in that order,
but they are performed as RotateZ, RotateX, and finally RotateY.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setOrigin

Set the origin of the Prop3D. This is the point about which all rotations take place.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setOrigin

Set the origin of the Prop3D. This is the point about which all rotations take place.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **origin** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setOriginFrom




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **origin** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPosition

Set the origin of the Prop3D.
This is the point about which all rotations take place.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPositionFrom




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **position** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setScale

Set the scale of the actor.
Scaling in performed independently on the X, Y and Z axis. A scale of zero is illegal and will be replaced with one.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setScaleFrom




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **scale** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setUserMatrix

The UserMatrix can be used in place of UserTransform.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **matrix** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


