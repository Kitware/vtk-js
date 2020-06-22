vtkFollower is a subclass of Actor that always faces the camera.

You must set the camera before use. This class will update the matrix such
that the follower always faces the camera. Sepcifically the y axis will up
up, the Z axes will point to the camera and the x axis will point to the
right. You may need to rotate, scale, position the follower to get your data
oriented propoerly for this convention.

If useViewUp is set then instea dof using the camera's view up the follow's
vieUp will be used. This is usefull in cases where you want up to be locked
independent of the camera. This is typically the case for VR or AR
annotations where the headset may tilt but text should continue to be
relative to a constant view up vector.

## See Also

[vtkActor](./Rendering_Core_Actor.html)

## setCamera()

Set the camera that this follower should face

## getMTime()

Get the newest "modification time" of the actor, its properties, and texture (if set).
