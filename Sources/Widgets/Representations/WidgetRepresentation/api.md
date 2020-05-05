Representations are scene objects that render based on the attached widget
state. These are not to be instantiated directly; rather, these should be
referenced in an implementation of
`vtkAbstractWidgetFactory.getRepresentationsForViewType`.


Look at `vtkContextRepresentation` and `vtkHandleRepresentation` for more usable
base classes.

## getRepresentationStates(inputState)

This will return a list of all states that match against the list of labels set
via `setLabels(...labels)`.

## setLabels(...labels)

Used internally to set the target labels. When requestData is invoked,
`getRepresentationStates(inData[0])` can be used to retrieve the list of states
that match the target labels.

## addActor(actor)

Should be used when creating an actor for the representation. It will apply widget-wide configuration such as coincident topology parameters to the mapper.

