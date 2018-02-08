## Introduction

vtkCameraManipulator is a superclass for actions inside an interactor style
and associated with a single button. An example might be rubber-band
bounding-box zoom. This abstraction allows a camera manipulator to be
assigned to any button.  This super class might become a subclass of
vtkInteractorObserver in the future.

## Settings

These settings determine which button and modifiers the manipulator responds
to. Button can be either 1 (left), 2 (middle), and 3 (right).

### button

Set/Get button association, default is 1.

### shift

Set/Get whether shift key is associated with manipulator, default is 0.

### control

Set/Get whether control key is associated with manipulator, default is 0.

### center

Set/Get center of rotation, default is [0, 0, 0].

### rotationFactor

Set/Get the rotation factor, default is 1.

### manipulatorName

Set/Get the manipulator name.  Default is empty string.

## Methods

The following methods are abstract and must be implemented by subclasses

### startInteraction()

Event bindings controlling the effects of pressing mouse buttons or moving
the mouse.

### endInteraction()

Event bindings controlling the effects of pressing mouse buttons or moving
the mouse.

### onMouseMove(eventX, eventY, vtkRenderer, vtkRenderWindowInteractor)

Event bindings controlling the effects of pressing mouse buttons or moving
the mouse.

### onButtonDown(eventX, eventY, vtkRenderer, vtkRenderWindowInteractor)

Event bindings controlling the effects of pressing mouse buttons or moving
the mouse.

### onButtonUp(eventX, eventY, vtkRenderer, vtkRenderWindowInteractor)

Event bindings controlling the effects of pressing mouse buttons or moving
the mouse.

### onKeyUp(vtkRenderWindowInteractor)

Called on all registered manipulators, not just the active one. Hence, this
should just be used to record state and not perform any interactions.

### onKeyDown(vtkRenderWindowInteractor)

Called on all registered manipulators, not just the active one. Hence, this
should just be used to record state and not perform any interactions.

### computeDisplayCenter(vtkInteractorObserver)

Save the center of rotation in screen coordinates
