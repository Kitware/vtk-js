vtkRenderWindowInteractor - platform-independent render window
interaction including picking and frame rate control.

### Description

vtkRenderWindowInteractor provides a platform-independent interaction
mechanism for mouse/key/time events. It serves as a base class for
platform-dependent implementations that handle routing of mouse/key/timer
messages to vtkInteractorObserver and its subclasses. vtkRenderWindowInteractor
also provides controls for picking, rendering frame rate, and headlights.

vtkRenderWindowInteractor has changed from previous implementations and
now serves only as a shell to hold user preferences and route messages to
vtkInteractorStyle. Callbacks are available for many events.  Platform
specific subclasses should provide methods for manipulating timers,
TerminateApp, and an event loop if required via
Initialize/Start/Enable/Disable.

### Caveats
vtkRenderWindowInteractor routes events through VTK's command/observer
design pattern. That is, when vtkRenderWindowInteractor (actually, one of
its subclasses) sees a platform-dependent event, it translates this into
a VTK event using the InvokeEvent() method. Then any vtkInteractorObservers
registered for that event are expected to respond as appropriate.
