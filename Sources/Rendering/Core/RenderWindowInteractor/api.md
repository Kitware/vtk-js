vtkRenderWindowInteractor - handle render window
interaction including picking and frame rate control.

### Description

vtkRenderWindowInteractor provides an interaction
mechanism for mouse/key/time events. It handles routing of mouse/key/timer
messages to vtkInteractorObserver and its subclasses. vtkRenderWindowInteractor
also provides controls for picking, rendering frame rate.

vtkRenderWindowInteractor serves to hold user preferences and route messages to
vtkInteractorStyle. Callbacks are available for many events. Platform
specific subclasses should provide methods for manipulating timers,
TerminateApp, and an event loop if required via
Initialize/Start/Enable/Disable.

### Caveats
vtkRenderWindowInteractor routes events through VTK's command/observer
design pattern. That is, when vtkRenderWindowInteractor (actually, one of
its subclasses) sees an event, it translates it into
a VTK event using the InvokeEvent() method. Afterward, any vtkInteractorObservers
registered for that event are expected to respond appropriately.
