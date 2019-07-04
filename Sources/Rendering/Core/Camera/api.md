## Introduction

vtkCamera is a virtual camera for 3D rendering. It provides methods
to position and orient the view point and focal point. Convenience
methods for moving about the focal point also are provided. More
complex methods allow the manipulation of the computer graphics
model including view up vector, clipping planes, and
camera perspective.

## newInstance()

Construct camera instance with its focal point at the origin, and position=(0,0,1). The
view up is along the y-axis, view angle is 30 degrees, and the clipping range is (.1,1000).

### `setPosition(x, y, z)`, `getPosition()`

Set/Get the position of the camera in world coordinates. The default position is (0,0,1).

### `setFocalPoint(x, y, z)`, `getFocalPoint()`

Set/Get the focal of the camera in world coordinates. The default focal point is the origin.

### `setViewUp(x, y, z)`, `getViewUp()`

Set/Get the view up direction for the camera. The default is (0,1,0).

### `orthogonalizeViewUp()`

Recompute the ViewUp vector to force it to be perpendicular to camera->focalpoint vector.
Unless you are going to use Yaw or Azimuth on the camera, there is no need to do this.

### `setDistance(dist)`

Move the focal point so that it is the specified distance from the camera position, along the view plane normal.
This distance must be positive.

### `getDistance()`

Return the distance from the camera position to the focal point. This distance is positive.

### `setDirectionOfProjection(x, y, z)`

Recalculates the focalPoint position to be the same distance from the camera as before, but along the new projection vector.

### `getDirectionOfProjection()`

Get the vector in the direction from the camera position to the focal point. This is usually
the opposite of the ViewPlaneNormal, the vector perpendicular to the screen, unless the view
is oblique.

### `dolly(value)`

Divide the camera's distance from the focal point by the given dolly value. Use a value
greater than one to dolly-in toward the focal point, and use a value less than one to dolly-out
away from the focal point.

### `roll(degrees)`

Rotate the camera about the direction of projection. This will spin the camera about its view axis.

### `azimuth(degrees)`

Rotate the camera about the view up vector centered at the focal point. Note that the view up
vector is whatever was set via SetViewUp, and is not necessarily perpendicular to the direction
of projection. The result is a horizontal rotation of the camera.

### `yaw(degrees)`

Rotate the focal point about the view up vector, using the camera's position as the center of
rotation. Note that the view up vector is whatever was set via SetViewUp, and is not necessarily
perpendicular to the direction of projection. The result is a horizontal rotation of the scene.

### `elevation(degrees)`

Rotate the camera about the cross product of the negative of the direction of projection and the
view up vector, using the focal point as the center of rotation. The result is a vertical rotation
of the scene.

### `pitch(degrees)`

Rotate the focal point about the cross product of the view up vector and the direction of projection,
using the camera's position as the center of rotation. The result is a vertical rotation of the camera.

### `zoom(factor)`

In perspective mode, decrease the view angle by the specified factor. In parallel mode, decrease
the parallel scale by the specified factor. A value greater than 1 is a zoom-in, a value less than
1 is a zoom-out.

### `setParallelProjection(boolean)`, `getParallelProjection()`

Set/Get the value of the ParallelProjection instance variable. This determines if the camera should do
a perspective or parallel projection.

### `setUseHorizontalViewAngle(degrees)`, `getUseHorizontalViewAngle()`

Set/Get the value of the UseHorizontalViewAngle instance variable. If set, the camera's view angle
represents a horizontal view angle, rather than the default vertical view angle. This is useful if
the application uses a display device which whose specs indicate a particular horizontal view angle,
or if the application varies the window height but wants to keep the perspective transform unchanges.

### `setViewAngle(degrees)`, `getViewAngle()`

Set/Get the camera view angle, which is the angular height of the camera view measured in degrees.
The default angle is 30 degrees. This method has no effect in parallel projection mode. The formula
for setting the angle up for perfect perspective viewing is: `angle = 2*atan((h/2)/d)` where `h` is the
height of the RenderWindow (measured by holding a ruler up to your screen) and `d` is the distance
from your eyes to the screen.

### `setParallelScale(scale)`, `getParallelScale()`

Set/Get the scaling used for a parallel projection, i.e. the height of the viewport in
world-coordinate distances. The default is 1. Note that the "scale" parameter works as an "inverse
scale" --- larger numbers produce smaller images. This method has no effect in perspective projection
mode.

### `setClippingRange(near, far)`, `getClippingRange()`

Set/Get the location of the near and far clipping planes along the direction of projection. Both
of these values must be positive. How the clipping planes are set can have a large impact on how
well Z-buffering works. In particular the front clipping plane can make a very big difference.
Setting it to 0.01 when it really could be 1.0 can have a big impact on your Z-buffer resolution
farther away. The default clipping range is (0.1,1000). Clipping distance is measured in world
coordinates.

### `setWindowCenter(x,y)`, `getWindowCenter()`

Set/Get the center of the window in viewport coordinates. The viewport coordinate range is
`([-1,+1],[-1,+1])`. This method is for if you have one window which consists of several viewports,
or if you have several screens which you want to act together as one large screen.

### `getViewPlaneNormal()`

Get the viewPlaneNormal `[x,y,z]` array. This vector will point opposite to the direction of projection, unless
you have created a sheared output view using SetViewShear/SetObliqueAngles (not implemented).

Note: to set the viewPlaneNormal, use `setDirectionOfProjection()`

### `SetUseOffAxisProjection(boolean)`, `getUseOffAxisProjection()`

Set/Get use offaxis frustum. OffAxis frustum is used for off-axis frustum calculations in `getProjectionMatrix()`,
specificly for stereo rendering. For reference see "High Resolution Virtual Reality", in Proc.
SIGGRAPH '92, Computer Graphics, pages 195-202, 1992.

Note: offAxis projection is **_NOT IMPLEMENTED_**.

### `setScreenBottomLeft(x, y, z)`, `getScreenBottomLeft()`

Set/Get top left corner point of the screen. This will be used only for offaxis frustum
calculation. Default is (-0.5, -0.5, -0.5). Can set individual x,y,z, or provide an array `[x,y,z]`. Returns an array.

### `setScreenBottomRight(x, y, z)`, `getScreenBottomRight()`

Set/Get bottom left corner point of the screen. This will be used only for offaxis frustum
calculation. Default is (0.5, -0.5, -0.5). Can set individual x,y,z, or provide an array `[x,y,z]`. Returns an array.

### `setScreenTopRight(x, y, z)`, `getScreenTopRight()`

Set/Get top right corner point of the screen. This will be used only for offaxis frustum
calculation. Default is (0.5, 0.5, -0.5). Can set individual x,y,z, or provide an array `[x,y,z]`. Returns an array.

### `setViewMatrix(mat4)`
Manually set the view matrix. Overrides camera position, focal point, and view up, until set to `null`.

### `getViewMatrix()`

Return the matrix of the view transform. The ViewTransform depends on only three ivars:  the
Position, the FocalPoint, and the ViewUp vector. All the other methods are there simply for
the sake of the users' convenience.

### `setProjectionMatrix(mat4)`

Manually set the projection transform matrix. Overrides camera position, focal point, and view up, until set to `null`.

### `getProjectionMatrix(aspect, nearz, farz)`

Return the projection transform matrix, which converts from camera coordinates to viewport
coordinates. The 'aspect' is the width/height for the viewport, and the nearz and farz are
the Z-buffer values that map to the near and far clipping planes. The viewport coordinates of
a point located inside the frustum are in the range `([-1,+1],[-1,+1],[nearz,farz])`.

### `getCompositeProjectionMatrix(aspect, nearz, farz)`

Return the concatenation of the ViewTransform and the ProjectionTransform. This transform
will convert world coordinates to viewport coordinates. The 'aspect' is the width/height
for the viewport, and the nearz and farz are the Z-buffer values that map to the near and
far clipping planes. The viewport coordinates of a point located inside the frustum are
in the range `([-1,+1],[-1,+1],[nearz,farz])`.

### `setFreezeFocalPoint(boolean)`, `getFreezeFocalPoint()`

Set/Get the value of the FreezeDolly instance variable. This determines if the camera should move the focal
point with the camera position. Only used by the `MouseCameraTrackballZoomManipulator`, or can be referenced in
any manipulator you choose to build.

### `setOrientationWXYZ(degrees, x,y,z)`

Move the focalPoint and viewUp by rotating the camera `degrees` about the `[x,y,z]` vector using Quaternion math, maintaining the focalPoint distance.

### `applyTransform(transformMat4)`

Apply a transform to the camera. The camera position, focal-point, and view-up are all re-calculated
using the 4x4 transform matrix.


## Unimplemented methods

### `getRoll()`, `setRoll(roll)`

**_NOT IMPLEMENTED._** Get/Set the roll angle of the camera about the direction of projection.

### `setThickness(thickness)`, `getThickness()`

**_NOT IMPLEMENTED._** Set/Get the distance between clipping planes. This method adjusts the far clipping plane to be
set a distance 'thickness' beyond the near clipping plane.

### `setObliqueAngles(alpha, beta)`

**_NOT IMPLEMENTED._** Set the oblique viewing angles. The first angle, alpha, is the angle (measured from the horizontal)
that rays along the direction of projection will follow once projected onto the 2D screen. The
second angle, beta, is the angle between the view plane and the direction of projection. This
creates a shear transform x' = x + dz*cos(alpha)/tan(beta), y' = dz*sin(alpha)/tan(beta) where
dz is the distance of the point from the focal plane. The angles are (45,90) by default. Oblique
projections commonly use (30,63.435).

### `getProjectionMatrix(renderer)`

**_NOT IMPLEMENTED._** Given a vtkRenderer, return the projection transform matrix, which converts from camera
coordinates to viewport coordinates. This method computes the aspect, nearz and farz,
then calls the more specific signature of GetCompositeProjectionTransformMatrix.

### `getFrustumPlanes(aspect, planes)`

**_NOT IMPLEMENTED._** Get the plane equations that bound the view frustum. The plane normals point inward.
The planes array contains six plane equations of the form (Ax+By+Cz+D=0), the first
four values are (A,B,C,D) which repeats for each of the planes. The planes are given
in the following order: -x,+x,-y,+y,-z,+z. Warning: it means left,right,bottom,top,far,near
(NOT near,far) The aspect of the viewport is needed to correctly compute the planes

### `getOrientation()`

**_NOT IMPLEMENTED._** Get the orientation of the camera (x, y, z orientation angles from the transformation matrix).

### `getOrientationWXYZ()`

**_NOT IMPLEMENTED._** Get the wxyz angle+axis representing the current orientation. The angle is in degrees and
the axis is a unit vector.

### `getCameraLightTransformMatrix()`

**_NOT IMPLEMENTED._** Returns a transformation matrix for a coordinate frame attached to the camera, where the
camera is located at (0, 0, 1) looking at the focal point at (0, 0, 0), with up being (0, 1, 0).

### `deepCopy(sourceCamera)`

**_NOT IMPLEMENTED._** Copy the properties of `source` into `this`. Copy the contents of the matrices. Do not pass
null source camera or this camera.


## Inherited from macro.obj

### `modified(mtime?)`

Set the camera as modified, update the internal modified time, and notify all callbacks.
If a modifiedTime `mtime` value is provided but older than the internal time, or the camera is marked as deleted, does nothing.

### `getMtime()`
returns the last modified time.

### `onModified(callback)`
registers the callback, and returns a function to unregister and stop listening.

### `shallowCopy(sourceCamera)`

Copy the properties of `sourceCamera` into `this`. Copy pointers of matrices. Do not pass
null source camera or this camera.

### render(renderer)

This method causes the camera to set up whatever is required for viewing the scene. This
is actually handled by an subclass of vtkCamera, which is created through New()
