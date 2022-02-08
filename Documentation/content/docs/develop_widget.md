title: Developing Widgets
---

Widgets allow users to interact with scene objects and drive functionality through clicking, dragging, and touch.
This documentation presents the new vtk.js widget infrastructure introduced on Aug 28, 2018.

## Widget architecture

### Widget Manager

The vtkWidgetManager is the object that manages the creation/suppression/focus of widgets within a view.
There is exactly one vtkWidgetManager per renderer. Widget manager and renderer should be programmatically instantiated and linked with `widgetManager.setRenderer(renderer)`). The link between renderer and widget manager should be set before any other operation.

Each widget manager can give the focus to at most one widget at any given time. The focus defines which widget is active and should handle events. Note that it is still possible to respond to events without having the focus (see Widget Behavior). Focus is given to the widget using `widgetManager.grabFocus(widget)`.
A call to `widgetManager.enablePicking()` allows the user to interact with widgets. It releases the focus of the previously holding widget if any.

### Widget creation

A widget is created by `vtkWidget.newInstance(INITIAL_VALUES)` where `vtkWidget` is the base class of the widget being created and `INITIAL_VALUES` are the arguments given to the constructor of the widget. Note that some parameters cannot be changed later on. `INITIAL_VALUES` may be the only way to set those parameters. During this call the "widget state" is created. It is unique to a widget instance. This allows for synchronization of the same widget across renderers (a change of the widget state in one view is directly rendered in all other views).

The widget must then be set with `widgetManager.addWidget(widget, viewType)`. The `viewType` parameter informs the widget manager about the representations it should build (see Widget representations). `addWidget()` returns a `handle` to the widget specific to the renderer the widget manager is linked to.

A widget can be added to multiple widget managers. Each widget manager will return a `handle` for its specific renderer.

### Widget suppression

Removing a widget from a view is done by `widgetManager.removeWidget(widget)`. Removing a widget from a widget manager also removes all its representations and the widget cannot receive events anymore. Once a widget is removed from all widget managers, it can be safely deleted by `widget.delete()`. Deleting a widget before removing it from every widget managers will cause some issues because these managers will still try to use it.

### Widget state

The widget state stores widget data used across renderers. The widget state is composed of sub-states(i.e. Object) made of properties that describe particular aspects of the widget. For example, sub-states can store positions and sizes of actors to be rendered.
The widget state must be built using `vtkStateBuilder`. There are four ways to build sub-states.

#### Static sub-state
The first way to build sub-state is

    .addStateFromMixin({
        labels: ['{LABEL0}'],
        mixins: ['origin', 'color', 'scale1', 'visible'],
        name: '{NAME}',
        initialValues: {
          scale1: 0.1,
          origin: [1, 2, 3],
          visible: false,
        }
    })

`name` is what uniquely identify the sub-state. It is used to get the sub-state by a call to `state.get{NAME}()`.

`labels` array determines which representations can use that sub-state to be rendered (see Widget Representations). A sub-state can have multiple `labels` so it can be used simultaneously by multiple representations. This allows to render complex widgets by using multiple simple and reusable representations rather that one complex representation per widget.

`mixins` are the fields that store sub-state useful data. Since mixins are meant to be used by representations for render purpose they are standardized and limited in their choice. The complete list of `mixins` can be found in [StateBuilder](https://github.com/Kitware/vtk-js/blob/master/Sources/Widgets/Core/StateBuilder/index.js).
Values stored in sub-states can be accessed through `subState.get{NAME}()` and `subState.set{NAME}()`
Modifying a sub-state triggers a render of the scene.

Finally, `initalValues` is the content at sub-state creation. It is not necessary to have all of them specified because mixins already define default values.

#### Dynamic sub-states

Dynamic sub-states are resizable arrays of sub-states. It is possible to add and remove sub-states on the fly. For example if the user selects a set of points, every time a point is added, the position of that point is added to the widget state). Dynamic sub-states are created by :

    .addDynamicMixinState({
      labels: ['{LABEL0}', '{LABEL1}'],
      mixins: ['origin', 'color', 'scale1', 'visible'],
      name: '{NAME}',
      initialValues: {
        scale1: 0.05,
        origin: [-1, -1, -1],
        visible: false,
      },
    })

Sub-states are added via `state.add{NAME}()`. It returns a handle to the newly created sub-state.
Sub-states are removed via `state.remove{NAME}(handle)` where handle is the handle given by `add{NAME}`.
Sub-states can be retrieved by a call to `state.get{NAME}List()`.
The sub-states list can be cleared by `state.clear{NAME}List()`.

#### Pre-existing sub-state

Pre-existing sub-states take a pre-existing sub-state and add it to the widget state. These are added by :

    .addStateFromInstance({
        labels: ['{LABEL0}', '{LABEL1}'],
        name: '{NAME}',
        instance,
    })

#### Other sub-states

Finally, other sub-states can be created via `state.addField({ name, initialValue })`. This allows to store data not restricted to the mixin list, but these are not passed to representations for rendering. They allow for more complex widget states.

A widget state is the accretion of the previous sub-states. These are simply built by chaining the calls to `stateBuilder.add{...}` this way :

    vtkStateBuilder
        .createBuilder()
        .addStateFromMixin({ ... })
        .addDynamicMixinState({ ... })
        .addDynamicMixinState({ ... })
        .build();

#### Mixins

##### boundsMixin

This mixin adds the properties `bounds` and `placeFactor`, as well as methods
`containsPoint`, `placeWidget`, and `setPlaceFactor`.

##### colorMixin

This mixin adds a `color` property. This is a scalar value between 0 and 1 that
determines color for many HandleRepresentations, such as the
SphereHandleRepresentation and CircleContextRepresentation. When determining
the final color, this scalar value is mapped through a lookup table (LUT) on
the internally used mapper.

In order to achieve custom RGB colors, the lookup table needs to be modified.
For the SphereHandleRepresentation and the CircleContextRepresentation, you can
call `.getMapper().getLookupTable()` to obtain a reference to the internal LUT.
From there, you can modify the LUT to obtain the desired colors given the
scalar values in the colorMixin.

##### directionMixin

This mixin adds a `direction` property, and methods `rotateFromDirections`,
`rotate`, and `rotate[X/Y/Z]`.

##### manipulatorMixin

This mixin adds a manipulator to a state.

##### nameMixin

This mixin adds a `name` property.

##### orientationMixin

This mixin adds properties `up`, `right`, and `direction` to describe the
orientation of a state.

##### originMixin

This mixin adds an `origin` property.

##### scale1Mixin and scale3Mixin

These mixins adds a single scale factor and a 3-component scale factor, respectively.

If `scaleInPixels` is set to true for a representation, then scale1 will be
interpreted as the pixel height of a representation. (Only for representations
that support this; grep for `scaleInPixels` to see which representations do.)
This means that, regardless of where a representation is in world space, it
will always have approximately `scale1` pixels of height.

##### visibleMixin

This mixin adds a `visible` flag.

### Widget Representations

Widget representations are the visual part of the widget. A widget can use multiple representations (for instance dots joined by a line). The representations the widget uses are selected when the widget is added to a widget manager through a call to `getRepresentationsForViewType(viewType)` where `viewType` is the view type given in parameter to `widgetManager.addWidget(...)`. This method should return an array like this :

    switch (viewType) {
      case ViewTypes.DEFAULT:
      case ViewTypes.GEOMETRY:
      case ViewTypes.SLICE:
        return [
          {
            builder: vtkCircleContextRepresentation,
            labels: ['handle', 'trail'],
          },
          {
            builder: vtkPolyLineRepresentation,
            labels: ['trail'],
          },
        ];
      case ViewTypes.VOLUME:
      default:
        return [{ builder: vtkSphereHandleRepresentation, labels: ['handle'] }];
    }

The `builder` field is the class of the representation to be used by the widget.
The `labels` field determines which sub-states of the widget should be used by the representation.
A representation can have multiple sub-states as input. Different sub-states can be rendered similarly.
Returning different representation parameters for different view types allows for an adapted view depending on the context. For example, having a widget rendered in a 2D view and a 3D view simultaneously with different 2D and 3D widget representations.

Representations are automatically recomputed when sub-states are modified. They are implemented as VTK.js filters since all the rendering computations happen in the `requestData(inData, outData)` method where `inData` is the list of states coming from sub-states and `outData` is a `vtkPolyData` representing the geometry to render.

Representations manage their own actors and mappers. Actors are usually created when the representation is created. Actors should be pushed in `model.actors` to be rendered (see vtkRectangleContextRepresentation for a simple example).

A representation should inherit from either `vtkHandleRepresentation` or `vtkContextRepresentation`. The difference between these two base classes is that user can click and interact with handle representations but not with context ones.

### Widget behavior

The widget behavior is the place where the logic of the widget happens. The widget behavior is the handle returned when a widget is added to a widget manager. The widget behavior receives and responds to mouse and keyboard events through handler methods. These methods are named `handle{XXX}(callData)` where `XXX` is the name of the event (like `KeyPress`, `KeyUp`, `MouseMove`, `LeftButtonPress`, etc...) and `callData` is the event data (it contains information like the mouse position, the keyboard state ...). All events don't need a handler method: if no handler is provided the widget behavior ignores the event. Each handler must return either `macro.EVENT_ABORT` or `macro.VOID`. `macro.EVENT_ABORT` means that the event should not be propagated to other widgets wherehas `macro.VOID` means that the event should be propagated. Note that the order in which widgets receive events is not guaranteed, so returning the wrong value might starve other widgets from events they expect.

The widget behavior has also access to the renderer, openGLRenderWindow and interactor.

#### Complex widget interaction

##### Focus

"Focus" as a widget concept means that a particular widget should be the only one interactable. This use-case arises when there is a primary widget.

An example is the paint widget needs focus, since when it's active it shouldn't be possible to move rulers, crosshairs, etc. The widget manager should only allow the paint state to be active, and not activate any other state.

When a widget is given the focus, the widget behavior is notified through the `grabFocus()` method. This is usually the place to setup complex interaction states such as initializing the widget behavior's internal state (distinct from the widget state), starting animations (see Animations) or setting up the active state (see Active State).

The `loseFocus()` method is called when the widget manager removes the focus from the widget. It can also be called by the widget behavior itself if necessary. For example, a widget might decide to lose the focus after the escape key was pressed.

##### Active state

The widget state can have an active sub-state. This is usually useful to flag the handle the user is interacting with and keep track of it or to change its visual appearance. For example, `vtkSphereHandleRepresentation` increases temporarily the radius of the active handle to emphasize the active handle.

The active state can be set by the widget behavior with `subState.activate()`. Similarly a sub-state can be deactivated with a call to `subState.deactivate()`.

When the widget does not have the focus, a sub-state can be activated if the user hovers a handle. A pointer to the active handle is stored in `model.activeState`. This allows interactions to happen when the widget does not have the focus.

For consistency, when a focus widget sets the active state, the `model.activeState` member is set to also point to the active handle.

##### Animations

A widget can request animations. Animations tell vtk.js to re-render when necessary. Animations are not required since the widget can trigger a render by calling `model.interactor.render()` so they are only useful if you don't want to think about renders. A widget starts an animation by calling `model.interactor.startAnimation(publicAPI)` and stops it by calling `model.interactor.cancelAnimation(publicAPI)`.

### Code architecture

Each widget has it's own directory in `Sources/Widgets/Widgets3D`. In this directory there are three files:
* state.js
* behavior.js
* index.js

Note that widgets may have all their code into index.js, but the architecture concept is the same.

#### state.js

The state.js file contains the state building function which usually looks like:

    export default function generateState() {
      return vtkStateBuilder
        .createBuilder()
        .addStateFromMixin({ ... })
        .addDynamicMixinState({ ... })
        .build();
    }

This function is later used in index.js to actually build the widget state.

#### behavior.js

The behavior.js file defines the methods of the widget behavior and typically looks like:

    export default function widgetBehavior(publicAPI, model) {
      model.classHierarchy.push('vtk{NAME}WidgetProp');
    
      publicAPI.handle{XXX} = () => {...}
    
      publicAPI.grabFocus = () => {...}
      publicAPI.loseFocus = () => {...}
    }

#### index.js

The index.js file contains the definition of the widget and glues all the parts together. The widget definition is a regular vtk.js [class](https://kitware.github.io/vtk-js/docs/develop_class.html).
The widget behavior is set by setting the member `model.behavior = widgetBehavior`.
The widget state is built by setting the member `model.widgetState = stateGenerator()`.
It is in this file that the `getRepresentationsForViewType` method should be implemented.
The strings of the array `model.methodsToLink` describe the names of methods that should be created by vtk.js to interface directly with representations. For instance if `'{NAME}'` is in `model.methodsToLink` then vtk.js will add the `set{NAME}()` and `get{NAME}()` methods to the widget behavior. These methods internally call the same methods on each representation that expose them. 



















