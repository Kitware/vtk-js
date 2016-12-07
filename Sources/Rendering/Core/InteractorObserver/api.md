vtkInteractorObserver - an abstract superclass for classes observing events invoked by vtkRenderWindowInteractor


### Description

vtkInteractorObserver is an abstract superclass for subclasses that observe
events invoked by vtkRenderWindowInteractor. These subclasses are
typically things like 3D widgets; objects that interact with actors
in the scene, or interactively probe the scene for information.

vtkInteractorObserver defines the method SetInteractor() and enables and
disables the processing of events by the vtkInteractorObserver. Use the
methods EnabledOn() or SetEnabled(1) to turn on the interactor observer,
and the methods EnabledOff() or SetEnabled(0) to turn off the interactor.
Initial value is 0.

To support interactive manipulation of objects, this class (and
subclasses) invoke the events StartInteractionEvent, InteractionEvent, and
EndInteractionEvent. These events are invoked when the
vtkInteractorObserver enters a state where rapid response is desired:
mouse motion, etc. The events can be used, for example, to set the desired
update frame rate (StartInteractionEvent), operate on data or update a
pipeline (InteractionEvent), and set the desired frame rate back to normal
values (EndInteractionEvent). Two other events, EnableEvent and
DisableEvent, are invoked when the interactor observer is enabled or
disabled.
