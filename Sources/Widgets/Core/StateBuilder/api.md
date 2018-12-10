Provides a builder API to create a vtkWidgetState. It is recommended to use the
builder to construct a vtkWidgetState, unless there is use-case not covered by
vtkStateBuilder.

A builder object is created via `vtkStateBuilder.createBuilder()`. State is
built via `builder.build()`.

When a sub-state is added, a unique name must be provided. This will act as a
state identifier and make the substate accessible via `state.get{NAME}()`.
Optionally, a list of labels may be provided. Labels categorize sub-states and
group them together. All states associated with a given label can be retrieved
via `state.getStatesWithLabel(LABEL)`.

Mixin sub-states are states constructed from a set of specified mixins. The
resultant sub-state will have all the properties and methods exported by each
mixin.'

Sample usage:

```
const state = vtkStateBuilder
  .createBuilder()
  .addStateFromMixin({
    labels: ['dragHandle'],
    mixins: ['origin', 'color', 'scale1', 'visible'],
    name: 'draggingHandle',
    initialValues: {
      scale1: 0.1,
      origin: [1, 2, 3],
      visible: false,
    }
  })
  .build();
```

## addStateFromMixin({ labels, mixins, name, initialValues })

Creates a sub-state that mixes in the specified set of mixins. Available mixins
can be found in `StateBuilder/index.js`.

## addDynamicMixinState({ labels, mixins, name, initialValues })

Creates a list of sub-states that are all derived from the mixin list.

## addStateFromInstance({ labels, name, instance })

Adds a given vtkWidgetState instance as a sub-state under the given name.

## addField({ name, initialValue })

Add a field (with initial value) to the top-level state.

## build()

Constructs and returns the vtkWidgetState.

