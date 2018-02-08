## Handled events
This interactor style handles the following events:

* Left Mouse: Rotate
* Left Mouse + Shift: Pan
* Left Mouse + Ctrl/Alt: Spin
* Left Mouse + Shift + Ctrl/Alt: Dolly
* Mouse Wheel: Dolly
* Multi-Touch Rotate: Rotate
* Multi-Touch Pinch: Dolly
* Multi-Touch Pan: Pan
* 3D Events: Camera Pose

## Callbacks

### Rotate Camera
The rotation is in the direction defined from the center of the renderer's
viewport towards the mouse position.

### Spin Camera
The rotation is a roll, around the axis defined between the center of the
renderer's viewport towards the mouse position.

### Pan Camera
The direction of motion is the direction the mouse moves.

### Dolly Camera
Zoom in/increase scale if the mouse position is in the top half of the viewport, or if the mouse is scrolling forward, or if pinching out;
zoom out/decrease scale if the mouse position is in the bottom half,
or if the mouse is scrolling backward, of if pinching in.

## motionFactor (get/set): Number

Get/set the motion factor for mouse events. Set it to a different value to emphasize or de-emphasize the action triggered, Default is 10.
