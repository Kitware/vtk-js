## Introduction

InteractorStyleManipulator allows the user to interactively manipulate the camera,
the viewpoint of the scene.  The left button is for rotation; shift + left
button is for rolling; the right button is for panning; and shift + right
button is for zooming.  This class fires vtkCommand::StartInteractionEvent
and vtkCommand::EndInteractionEvent to signal start and end of interaction.

If you are looking for the source of this in the VTK codebase, you will not
find it there.  Rather it is derived from the vtkPVInteractorStyle class in
the ParaView codebase, which can be found in "ParaViewCore/Rendering/VTKExtensions/Rendering/".

### cameraManipulators

Get the collection of camera manipulators.

### centerOfRotation

Set/Get the center of rotation.  Propagates the center to the manipulators.  This
simply sets an internal ivar. It is propagated to a manipulator before the event is
sent to it. Also, changing the CenterOfRotation during interaction i.e. after a
button press but before a button up has no effect until the next button press.  The
default value is [0, 0, 0].

### rotationFactor

Set/Get the rotation factor.  Propagates the rotation factor to the manipulators.
This simply sets an internal ivar.  It is propagated to a manipulator before the event
is sent to it.  Also, changing the RotationFactor during interaction i.e. after a
button press but before a button up has no effect until the next button press. The
default value is 1.

### onMouseMove()

Event binding controlling the effect of moving the mouse.

### onLeftButtonDown()

Event binding controlling the effects of pressing mouse button.

### onLeftButtonUp()

Event binding controlling the effects of pressing mouse button.

### onMiddleButtonDown()

Event binding controlling the effects of pressing mouse button.

### onMiddleButtonUp()

Event binding controlling the effects of pressing mouse button.

### onRightButtonDown()

Event binding controlling the effects of pressing mouse button.

### onRightButtonUp()

Event binding controlling the effects of pressing mouse button.

### handleKeyPress()

Unlike mouse events, this is forwarded to all camera manipulators as `onKeyDown(interactor)` since we
don't have a mechanism to activate a manipulator by key presses currently.

### handleKeyUp()

Unlike mouse events, this is forwarded to all camera manipulators as `onKeyUp(interactor)` since we
don't have a mechanism to activate a manipulator by key presses currently.
  
### addManipulator(vtkCameraManipulator)

Adds a camera manipulator to the internal list/

### removeAllManipulators()

Removes all manipulators.
   
### findManipulator(button, shift, control)

Returns the chosen camera manipulator based on the modifiers.

### dollyToPosition(fact, position, vtkRenderer) (STATIC)

Dolly the renderer's camera to a specific point

### translateCamera(vtkRenderer, toX, toY, fromX, fromY) (STATIC)

Translate the renderer's camera

### dolly(factor)

Invokes either static "dollyToPosition" method in this class, or else
defers to the parents "dolly" method, depending on whether the control
key is pressed.
