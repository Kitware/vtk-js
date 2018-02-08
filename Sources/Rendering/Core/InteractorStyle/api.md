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

### Keypress r: reset the camera view along the current view
direction. Centers the actors and moves the camera so that all actors are
visible.

### Keypress s: modify the representation of all actors so that they are
surfaces.

### Keypress w: modify the representation of all actors so that they are
wireframe.

