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

### position

Set/Get the position of the camera in world coordinates. The default position is (0,0,1).

### focalPoint

Set/Get the focal of the camera in world coordinates. The default focal point is the origin.

### viewUp

Set/Get the view up direction for the camera. The default is (0,1,0).

### orthogonalizeViewUp()

Recompute the ViewUp vector to force it to be perpendicular to camera->focalpoint vector.
Unless you are going to use Yaw or Azimuth on the camera, there is no need to do this.

### setDistance(dist)

Move the focal point so that it is the specified distance from the camera position. This
distance must be positive.

### getDistance()

Return the distance from the camera position to the focal point. This distance is positive.

### getDirectionOfProjection()

Get the vector in the direction from the camera position to the focal point. This is usually
the opposite of the ViewPlaneNormal, the vector perpendicular to the screen, unless the view
is oblique.

### dolly(value)

Divide the camera's distance from the focal point by the given dolly value. Use a value
greater than one to dolly-in toward the focal point, and use a value less than one to dolly-out
away from the focal point.

### roll

Get/Set the roll angle of the camera about the direction of projection.

### roll(angle)

Rotate the camera about the direction of projection. This will spin the camera about its axis.

### azimuth(angle)

Rotate the camera about the view up vector centered at the focal point. Note that the view up
vector is whatever was set via SetViewUp, and is not necessarily perpendicular to the direction
of projection. The result is a horizontal rotation of the camera.

### yaw(angle)

Rotate the focal point about the view up vector, using the camera's position as the center of
rotation. Note that the view up vector is whatever was set via SetViewUp, and is not necessarily
perpendicular to the direction of projection. The result is a horizontal rotation of the scene.

### elevation(angle)

Rotate the camera about the cross product of the negative of the direction of projection and the
view up vector, using the focal point as the center of rotation. The result is a vertical rotation
of the scene.

### pitch(angle)

Rotate the focal point about the cross product of the view up vector and the direction of projection,
using the camera's position as the center of rotation. The result is a vertical rotation of the camera.

### parallelProjection

Set/Get the value of the ParallelProjection instance variable. This determines if the camera should do
a perspective or parallel projection.

### useHorizontalViewAngle

Set/Get the value of the UseHorizontalViewAngle instance variable. If set, the camera's view angle
represents a horizontal view angle, rather than the default vertical view angle. This is useful if
the application uses a display device which whose specs indicate a particular horizontal view angle,
or if the application varies the window height but wants to keep the perspective transform unchanges.

### viewAngle

Set/Get the camera view angle, which is the angular height of the camera view measured in degrees.
The default angle is 30 degrees. This method has no effect in parallel projection mode. The formula
for setting the angle up for perfect perspective viewing is: angle = 2*atan((h/2)/d) where h is the
height of the RenderWindow (measured by holding a ruler up to your screen) and d is the distance
from your eyes to the screen.

### parallelScale

Set/Get the scaling used for a parallel projection, i.e. the height of the viewport in
world-coordinate distances. The default is 1. Note that the "scale" parameter works as an "inverse
scale" --- larger numbers produce smaller images. This method has no effect in perspective projection
mode.

 ### zoom(factor)

In perspective mode, decrease the view angle by the specified factor. In parallel mode, decrease
the parallel scale by the specified factor. A value greater than 1 is a zoom-in, a value less than
1 is a zoom-out.

### clippingRange

Set/Get the location of the near and far clipping planes along the direction of projection. Both
of these values must be positive. How the clipping planes are set can have a large impact on how
well Z-buffering works. In particular the front clipping plane can make a very big difference.
Setting it to 0.01 when it really could be 1.0 can have a big impact on your Z-buffer resolution
farther away. The default clipping range is (0.1,1000). Clipping distance is measured in world
coordinates.

### thickness

Set/Get the distance between clipping planes. This method adjusts the far clipping plane to be
set a distance 'thickness' beyond the near clipping plane.

### windowCenter

Set/Get the center of the window in viewport coordinates. The viewport coordinate range is
([-1,+1],[-1,+1]). This method is for if you have one window which consists of several viewports,
or if you have several screens which you want to act together as one large screen.

### setObliqueAngles(alpha, beta)

Set the oblique viewing angles. The first angle, alpha, is the angle (measured from the horizontal)
that rays along the direction of projection will follow once projected onto the 2D screen. The
second angle, beta, is the angle between the view plane and the direction of projection. This
creates a shear transform x' = x + dz*cos(alpha)/tan(beta), y' = dz*sin(alpha)/tan(beta) where
dz is the distance of the point from the focal plane. The angles are (45,90) by default. Oblique
projections commonly use (30,63.435).

### applyTransform(transform)

Apply a transform to the camera. The camera position, focal-point, and view-up are re-calculated
using the transform's matrix to multiply the old points by the new transform.

### viewPlaneNormal

Get the ViewPlaneNormal. This vector will point opposite to the direction of projection, unless
you have created a sheared output view using SetViewShear/SetObliqueAngles.

### focalDisk

Set the size of the cameras lens in world coordinates. This is only used when the renderer is
doing focal depth rendering. When that is being done the size of the focal disk will effect
how significant the depth effects will be.

### useOffAxisProjection

Set/Get use offaxis frustum. OffAxis frustum is used for off-axis frustum calculations
specificly for stereo rendering. For reference see "High Resolution Virtual Reality", in Proc.
SIGGRAPH '92, Computer Graphics, pages 195-202, 1992.

### screenBottomLeft

Set/Get top left corner point of the screen. This will be used only for offaxis frustum
calculation. Default is (-0.5, -0.5, -0.5).

### screenBottomRight

Set/Get bottom left corner point of the screen. This will be used only for offaxis frustum
calculation. Default is (0.5, -0.5, -0.5).

### screenTopRight

Set/Get top right corner point of the screen. This will be used only for offaxis frustum
calculation. Default is (0.5, 0.5, -0.5).

### getViewMatrix()

Return the matrix of the view transform. The ViewTransform depends on only three ivars:  the
Position, the FocalPoint, and the ViewUp vector. All the other methods are there simply for
the sake of the users' convenience.

### getProjectionMatrix(aspect, nearz, farz)

Return the projection transform matrix, which converts from camera coordinates to viewport
coordinates. The 'aspect' is the width/height for the viewport, and the nearz and farz are
the Z-buffer values that map to the near and far clipping planes. The viewport coordinates of
a point located inside the frustum are in the range ([-1,+1],[-1,+1],[nearz,farz]).

### getCompositeProjectionMatrix(aspect, nearz, farz)

Return the concatenation of the ViewTransform and the ProjectionTransform. This transform
will convert world coordinates to viewport coordinates. The 'aspect' is the width/height
for the viewport, and the nearz and farz are the Z-buffer values that map to the near and
far clipping planes. The viewport coordinates of a point located inside the frustum are
in the range ([-1,+1],[-1,+1],[nearz,farz]).

### getProjectionMatrix(renderer)

Given a vtkRenderer, return the projection transform matrix, which converts from camera
coordinates to viewport coordinates. This method computes the aspect, nearz and farz,
then calls the more specific signature of GetCompositeProjectionTransformMatrix.

### render(renderer)

This method causes the camera to set up whatever is required for viewing the scene. This
is actually handled by an subclass of vtkCamera, which is created through New()

### getViewingRaysMTime()

Return the MTime that concerns recomputing the view rays of the camera.

### viewingRaysModified()

Mark that something has changed which requires the view rays to be recomputed.

### getFrustumPlanes(aspect, planes)

Get the plane equations that bound the view frustum. The plane normals point inward.
The planes array contains six plane equations of the form (Ax+By+Cz+D=0), the first
four values are (A,B,C,D) which repeats for each of the planes. The planes are given
in the following order: -x,+x,-y,+y,-z,+z. Warning: it means left,right,bottom,top,far,near
(NOT near,far) The aspect of the viewport is needed to correctly compute the planes

### getOrientation()

Get the orientation of the camera (x, y, z orientation angles from the transformation matrix).

### getOrientationWXYZ()

Get the wxyz angle+axis representing the current orientation. The angle is in degrees and
the axis is a unit vector.

### getCameraLightTransformMatrix()

Returns a transformation matrix for a coordinate frame attached to the camera, where the
camera is located at (0, 0, 1) looking at the focal point at (0, 0, 0), with up being (0, 1, 0).

### updateViewport()

Update the viewport.

### leftEye

Set/Get the Left Eye setting.

### shallowCopy(sourceCamera)

Copy the properties of `source' into `this'. Copy pointers of matrices. Do not pass
null source camera or this camera.

### deepCopy(sourceCamera)

Copy the properties of `source' into `this'. Copy the contents of the matrices. Do not pass
null source camera or this camera.

### freezeFocalPoint

Set/Get the value of the FreezeDolly instance variable. This determines if the camera should
move the focal point with the camera position.

### useScissor

Enable/Disable the scissor.

### scissorRect

Set/Get the vtkRect value of the scissor.
