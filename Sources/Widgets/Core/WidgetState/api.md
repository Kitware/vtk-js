A central store containing all of the state for a widget. It is recommended to
use vtkStateBuilder to construct a widget state.

## bindState(subState, labels)

Adds a nested sub-state with the associated labels.

## unbindState(subState)

Removes a nested sub-state.

## unbindAll()

Removes all nested sub-states.

## activate()

Marks the state as active.

## deactivate(stateToExclude)

Deactivates current state and all sub-states.  If an excluding state is
provided, then do not deactivate the specified state.

## activateOnly(subState)

Only activates a provided sub-state.

## getStatesWithLabel(label)

Retrieves a list of sub-states with the associated label.

## getAllNestedStates()

Returns the list of nested states.

