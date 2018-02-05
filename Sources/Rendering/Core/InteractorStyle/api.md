## Introduction

vtkInteractorStyle - provide event-driven interface to the rendering window

vtkInteractorStyle is a base class implementing the majority of motion
control routines and defines an event driven interface to support
vtkRenderWindowInteractor. vtkRenderWindowInteractor implements
platform dependent key/mouse routing and timer control, which forwards
events in a neutral form to vtkInteractorStyle.

vtkInteractorStyle can be subclassed to provide new interaction styles and
a facility to override any of the default mouse/key operations which
currently handle trackball or joystick styles is provided. Note that this
class will fire a variety of events that can be watched using an observer,
such as AnimationEvent, MouseMoveEvent, LeftButtonPressEvent, LeftButtonReleaseEvent,
MiddleButtonPressEvent, MiddleButtonReleaseEvent, RightButtonPressEvent,
RightButtonReleaseEvent, KeyPressEvent, KeyUpEvent,

vtkInteractorStyle subclasses may implement various styles of 
interaction. Some common controls are

### Left Mouse Move: rotate the camera around its focal point (if camera mode) or
rotate the actor around its origin (if actor mode). The rotation is in the
direction defined from the center of the renderer's viewport towards
the mouse position. In joystick mode, the magnitude of the rotation is
determined by the distance the mouse is from the center of the render
window.

### Shift Left Mouse Move: pan the camera (if camera mode) or translate the actor (if
actor mode). In joystick mode, the direction of pan or translation is
from the center of the viewport towards the mouse position. In trackball
mode, the direction of motion is the direction the mouse moves.

### Ctrl/Cmd Left Mouse Move: zoom the camera (if camera mode) or scale the actor (if
actor mode). Zoom in/increase scale if the mouse position is in the top
half of the viewport; zoom out/decrease scale if the mouse position is in
the bottom half. In joystick mode, the amount of zoom is controlled by the
distance of the mouse pointer from the horizontal centerline of the
window.

### Keypress r: reset the camera view along the current view
direction. Centers the actors and moves the camera so that all actors are
visible.

### Keypress s: modify the representation of all actors so that they are
surfaces.

### Keypress w: modify the representation of all actors so that they are
wireframe.

