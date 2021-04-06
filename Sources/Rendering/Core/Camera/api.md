## Introduction

vtkCamera is a virtual camera for 3D rendering. It provides methods
to position and orient the view point and focal point. Convenience
methods for moving about the focal point also are provided. More
complex methods allow the manipulation of the computer graphics model 
including view up vector, clipping planes, and camera perspective.




## Methods


### applyTransform

Apply a transform to the camera.
The camera position, focal-point, and view-up are re-calculated 
using the transform's matrix to multiply the old points by the new transform.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **transformMat4** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### azimuth

Rotate the camera about the view up vector centered at the focal point.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **angle** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### computeClippingRange




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **bounds** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


### computeDistance

This method must be called when the focal point or camera position changes



### computeViewParametersFromPhysicalMatrix

the provided matrix should include
translation and orientation only
mat is physical to view


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **mat** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### computeViewParametersFromViewMatrix




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **vmat** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### deepCopy

Not implemented yet


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **sourceCamera** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### dolly

Move the position of the camera along the view plane normal. Moving
towards the focal point (e.g., > 1) is a dolly-in, moving away
from the focal point (e.g., < 1) is a dolly-out.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **amount** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### elevation

Rotate the camera about the cross product of the negative of the direction of projection and the view up vector, using the focal point as the center of rotation.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **angle** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### extend

Method use to decorate a given object (publicAPI+model) with vtkRenderer characteristics.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **publicAPI** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which methods will be bounds (public) |
| **model** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | object on which data structure will be bounds (protected) |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### getCameraLightTransformMatrix

Not implemented yet



### getClippingRange





### getClippingRangeByReference





### getCompositeProjectionMatrix




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **aspect** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **nearz** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **farz** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### getDirectionOfProjection

Get the vector in the direction from the camera position to the focal point.



### getDirectionOfProjectionByReference





### getDistance

Get the distance from the camera position to the focal point.



### getFocalPoint





### getFocalPointByReference





### getFreezeFocalPoint





### getFrustumPlanes

Not implemented yet


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **aspect** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### getOrientation

Not implemented yet



### getOrientationWXYZ

Not implemented yet



### getParallelProjection





### getParallelScale





### getPhysicalScale





### getPhysicalToWorldMatrix




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **result** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### getPhysicalTranslation





### getPhysicalTranslationByReference





### getPhysicalViewNorth





### getPhysicalViewNorthByReference





### getPhysicalViewUp





### getPhysicalViewUpByReference





### getPosition

Get the position of the camera in world coordinates. 



### getPositionByReference





### getProjectionMatrix




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **aspect** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **nearz** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **farz** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### getRoll

Not implemented yet
Get the roll angle of the camera about the direction of projection.



### getScreenBottomLeft

Get top left corner point of the screen.



### getScreenBottomLeftByReference





### getScreenBottomRight

Get bottom left corner point of the screen



### getScreenBottomRightByReference





### getScreenTopRight





### getScreenTopRightByReference





### getThickness

Get the center of the window in viewport coordinates.

#### Returns

| Type | Description |
| ----- | ------------- |
| <span class="arg-type"></span> |  |


### getUseHorizontalViewAngle

Get the value of the UseHorizontalViewAngle instance variable.



### getUseOffAxisProjection

Get use offaxis frustum.



### getViewAngle

Get the camera view angle.



### getViewMatrix





### getViewPlaneNormal

Get the ViewPlaneNormal.
This vector will point opposite to the direction of projection, 
unless you have created a sheared output view using SetViewShear/SetObliqueAngles.



### getViewPlaneNormalByReference

Get the ViewPlaneNormal by reference.



### getViewUp

Get ViewUp vector.



### getViewUpByReference

Get ViewUp vector by reference.



### getWindowCenter

Get the center of the window in viewport coordinates.
The viewport coordinate range is ([-1,+1],[-1,+1]). 



### getWindowCenterByReference





### getWorldToPhysicalMatrix




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **result** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### newInstance

Method use to create a new instance of vtkCamera with its focal point at the origin, 
and position=(0,0,1). The view up is along the y-axis, view angle is 30 degrees, 
and the clipping range is (.1,1000).


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **initialValues** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> | for pre-setting some of its content |


### orthogonalizeViewUp

Recompute the ViewUp vector to force it to be perpendicular to camera->focalpoint vector.



### physicalOrientationToWorldDirection




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **ori** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### pitch

Rotate the focal point about the cross product of the view up vector and the direction of projection, using the camera's position as the center of rotation.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **angle** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### roll

Rotate the camera about the direction of projection.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **angle** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setClippingRange

Set the location of the near and far clipping planes along the direction
of projection.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **near** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **far** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setClippingRange

Set the location of the near and far clipping planes along the direction
of projection.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **clippingRange** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setClippingRangeFrom




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **clippingRange** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setDeviceAngles

used to handle convert js device orientation angles
when you use this method the camera will adjust to the
device orientation such that the physicalViewUp you set
in world coordinates looks up, and the physicalViewNorth
you set in world coorindates will (maybe) point north

NOTE WARNING - much of the documentation out there on how
orientation works is seriously wrong. Even worse the Chrome
device orientation simulator is completely wrong and should
never be used. OMG it is so messed up.

how it seems to work on iOS is that the device orientation
is specified in extrinsic angles with a alpha, beta, gamma
convention with axes of Z, X, Y (the code below substitutes
the physical coordinate system for these axes to get the right
modified coordinate system.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **alpha** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **beta** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **gamma** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **screen** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setDirectionOfProjection




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setDistance




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **distance** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setFocalPoint




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setFocalPointFrom




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **focalPoint** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setObliqueAngles

Not implement yet
Set the oblique viewing angles.
The first angle, alpha, is the angle (measured from the horizontal) that rays along 
the direction of projection will follow once projected onto the 2D screen. 
The second angle, beta, is the angle between the view plane and the direction of projection. 
This creates a shear transform x' = x + dz*cos(alpha)/tan(beta), y' = dz*sin(alpha)/tan(beta) where dz is the distance of the point from the focal plane. 
The angles are (45,90) by default. Oblique projections commonly use (30,63.435).


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **alpha** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **beta** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setOrientationWXYZ




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **degrees** | <span class="arg-type">number</span></br></span><span class="arg-required">required</span> |  |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setParallelProjection




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **parallelProjection** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setParallelScale




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **parallelScale** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPhysicalScale




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **physicalScale** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPhysicalTranslation




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPhysicalTranslationFrom




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **physicalTranslation** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPhysicalViewNorth




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPhysicalViewNorthFrom




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **physicalViewNorth** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPhysicalViewUp




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPhysicalViewUpFrom




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **physicalViewUp** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setPosition

Set the position of the camera in world coordinates.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setProjectionMatrix




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **mat** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setRoll

Not implemented yet


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **angle** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setScreenBottomLeft

Set top left corner point of the screen.

This will be used only for offaxis frustum calculation.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setScreenBottomLeft

Set top left corner point of the screen.

This will be used only for offaxis frustum calculation.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **screenBottomLeft** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setScreenBottomLeftFrom




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **screenBottomLeft** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setScreenBottomRight




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setScreenBottomRightFrom




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **screenBottomRight** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setScreenTopRight

Set top right corner point of the screen.

This will be used only for offaxis frustum calculation.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setScreenTopRight

Set top right corner point of the screen.

This will be used only for offaxis frustum calculation.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **screenTopRight** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setScreenTopRightFrom




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **screenTopRight** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setThickness

Set the distance between clipping planes.

This method adjusts the far clipping plane to be set a distance 'thickness' beyond the near clipping plane.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **thickness** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setThicknessFromFocalPoint




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **thickness** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setUseHorizontalViewAngle




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **useHorizontalViewAngle** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setUseOffAxisProjection

Set use offaxis frustum.

OffAxis frustum is used for off-axis frustum calculations specifically for
stereo rendering. For reference see "High Resolution Virtual Reality", in
Proc. SIGGRAPH '92, Computer Graphics, pages 195-202, 1992.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **useOffAxisProjection** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setViewAngle

Set the camera view angle, which is the angular height of the camera view measured in degrees.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **viewAngle** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setViewMatrix




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **mat** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setViewUp




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **viewUp** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setViewUp




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setViewUpFrom




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **viewUp** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setWindowCenter

Set the center of the window in viewport coordinates.
The viewport coordinate range is ([-1,+1],[-1,+1]). 
This method is for if you have one window which consists of several viewports, or if you have several screens which you want to act together as one large screen


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### setWindowCenterFrom

Set the center of the window in viewport coordinates from an array.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **windowCenter** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### translate




| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **x** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **y** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |
| **z** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### yaw

Rotate the focal point about the view up vector, using the camera's position as the center of rotation.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **angle** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


### zoom

In perspective mode, decrease the view angle by the specified factor.


| Argument | Type | Description |
| ------------- | ------------- | ----- |
| **factor** | <span class="arg-type"></span></br></span><span class="arg-required">required</span> |  |


