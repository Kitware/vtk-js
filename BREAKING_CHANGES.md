## From 31.x to 32

- **vtkMapper**: remove `mapScalarsToTexture` from the public API. The function becomes protected and its API changes. This shouldn't cause any issue in most cases.

## From 30.x to 31

- **Picking**: write to depth buffer for translucent pass when picking. This change fixes a picking issue with multiple translucent actors overlaid on top of each other. The hardware selector would just register the propID of the last rendered prop. This was because we explicitly turn off writing to the depth buffer when rendering translucent props as OIT doesn't need it. This change enables writing to the depth buffer when picking in the translucent pass. Applications relying on picked propID would see a difference in the IDs returned by the hardware selector.

## From 29.x to 30

- **ResliceCursorWidget.interactionEvent**: no longer pass an object of `{computeFocalPointOffset, canUpdateFocalPoint}` but simply the type of the handle that triggers the event (e.g. `InteractionMethodsName.RotateLine`). The removed values can easily be recomputed by the consumers of the event by checking the type of the handle. Regarding `computeFocalPointOffset`, it is no longer advised to compute focal point offset for each interaction, instead observing `startInteraction()` should be considered (see ResliceCursorWidget example).
- **ResliceCursorWidget.invokeInternalInteractionEvent(methodName)**: has been removed and should be replaced by `ResliceCursorWidget.invokeInteractionEvent(methodName)`.
- **ResliceCursorWidget.updateCameraPoints(renderer, viewType, resetFocalPoint, keepCenterFocalDistance, computeFocalPointOffset)** has lost the `keepCenterFocalDistance` parameter (because it was ALWAYS the negate of `computeFocalPointOffset`). The new signature is `ResliceCursorWidget.updateCameraPoints(renderer, viewType, resetFocalPoint, keepCenterFocalDistance, computeFocalPointOffset)`

- **vtkAxesActor**: `setXAxisColor`, `setYAxisColor`, `setZAxisColor` now take a single `RGBColor` (array of 3 numbers) instead of 3 numbers for each color component. The `get*AxisColor` methods now return an array of 3 numbers instead of an object with `r`, `g`, `b` properties.

## From 28.x to 29

- **getOpenGLRenderWindow**: `getOpenGLRenderWindow` has been renamed to `getApiSpecificRenderWindow` in `vtkFullScreenRenderWindow`, `vtkGenericRenderWindow` and `vtkViewProxy` to support WebGL and WebGPU backend. ([#2816](https://github.com/Kitware/vtk-js/pull/2816))
- **WidgetManager**: Deprecated APIs have been fully removed. ([#2910](https://github.com/Kitware/vtk-js/pull/2910))
- **OpenGLRenderWindow**: WebXR API has been moved into a WebXR RenderWindowHelper. ([#2924](https://github.com/Kitware/vtk-js/pull/2924))
- **DistanceWidget**: Removed from vtk.js in favor of vtkLineWidget ([#2945](https://github.com/Kitware/vtk-js/pull/2945))

## From 27.x to 28

- **vtkManipulator.handleEvent**: Change all `handleEvent` signatures of manipulators. Used to be `handleEvent(callData, glRenderWindow): vec3`, it is now `handleEvent(callData, glRenderWindow): { worldCoords: Nullable<vec3>, worldDirection?: mat3 }`.
  - To upgrade: all instances of `const coords = manipulator.handleEvent(...)` must now be `const { worldCoords } = manipulator.handleEvent(...)`.

## From 26.x to 27

- **abstractimagemapper**: Before this change, the vtkAbstractImageMapper extended vtkAbstractMapper. Now, it extends vtkAbstractMapper3D. Applications with custom sub-classes of vtkAbstractImageMapper that have their own overrides for {set/get}Bounds and {set/get}Center would shadow the superclass methods.

## From 25.x to 26

- **ResliceCursorWidget**: vtkResliceCursorContextRepresentation is deprecated and removed.
Instead, a `vtkSphereHandleRepresentation` is used for `rotation` and `center` handles,
and a `vtkLineHandleRepresenttion` is used for the axes. `rotateLineInView()` now
takes an axis name (string, e.g. 'XinY') instead of a substate. `enableRotation`, `enableTranslation` and `keepOrthogonality` in widgetState are replaced by widget behavior accessors (e.g. `widgetInView.setEnableRotation(false)`). See RCW example.
  - `widgetState.setShowCenter()` is replaced by `widgetState.getCenterHandle.setVisible()`
  - `widgetState.setSphereRadius()` is replaced by `widgetState.getCenterHandle().setScale1()` and `widgetState.getStatesWithLabel('rotation').forEach((handle) => handle.setScale1())`
  - `widgetState.setLineThickness(t)` is replaced by `widgetState.getStatesWithLabel('line').forEach((handle) => handle.setScale3(t,t,t))`
  - `setScaleInPixels()` should now be set on the widget instead of the `widgetInView`.
  - `widgetState.setOpacity()` is replaced by `widgetState.getStatesWithLabel('handles').forEach((handle) => handle.setOpacity())`
- SVGRepresentation and SVG widget support has been fully removed.

## From 24.x to 25

- **math**: For functions calling math functions for computations with matrices, the format must now be number[] or Matrix as defined in the typescript definitions.
- All widgets handles inheriting from vtkHandleRepresentation now scale up automatically.

## From 23.x to 24

- All old-style widgets except OrientationMarkerWidget and PiecewiseGaussianWidget have been removed.

| **Old-style/deprecated widget**   | **New-style widget**            |
|-----------------------------------|---------------------------------|
| `Sources/Interaction/Widgets/...` | `Sources/Widgets/Widgets3D/...` |
| DistanceWidget			              | DistanceWidget                  |
| HandleWidget				              | PolyLineWidget                  |
| ImageCroppingRegionsWidget        | ImageCroppingWidget             |
| LabelWidget                       | LabelWidget                     |
| LineWidget                        | LineWidget                      |
| OrientationMarkerWidget (kept)    | *not implemented*               |
| PiecewiseGaussianWidget (kept)    | *not implemented*               |
| ResliceCursor                     | ResliceCursorWidget             |

- In SVGLandmarkRepresentation: `model.showCircle` is replaced by `model.circleProps.visible`
- In vtk.js subclasses, prefix with '_' the following "protected" model variables:
  - vtk*: model.openglRenderWindow -> model._openglRenderWindow
  - vtk*: model.openglRenderer -> model._openglRenderer
  - vtkInteractorObserver, vtkOrientationMarkerWidget : model.interactor -> model._interactor
  - vtkAbstractWidget, vtkViewNode: model.parent -> model._parent
  - vtkProp: model.parentProp -> model._parentProp
  - vtkRenderWindowInteractor: model.view -> model._view
  - vtkRenderer: model.renderWindow -> model._renderWindow
  - vtkHardwareSelector: model.renderer -> model._renderer
  - vtkAbstractWidget: model.widgetManager -> model._widgetManager

## From 22.x to 23

- **imagemapper**: The original behavior of the image mapper was that if a lookup table is provided,
it mapped the lookup table's scalar range by default. The new behavior disables using the lookup
table scalar range by default. Instead, the window/level values are used.

## From 21.x to 22

- `config/rules-linter.js` is now gone.
- **AbstractMapper**: Changed removeClippingPlane to use instance instead of index.

## From 20.x to 21

SplineWidget's handles now scale up automatically.

## From 19.x to 20

In ShapeWidget:
- `setLabelTextCallback` is replaced by `text` substate.
- `setPixelScale` has been removed. It should be replaced by point handle `scale1` mixin and `scaleInPixels`.
- `useHandles` has been removed. It should be replaced by `setHandleVisibility`.
- `resetAfterPointPlacement` is now false by default.

RectangleWidget and EllipseWidget handles now scale up automatically.

## From 19.2 to 19.3

Node >=12 is required

## From 18.x to 19

vtkWidgetRepresentation.updateActorVisibility(...) lost the widgetVisibility parameter.
Overrides should no longer define that parameter.

## From 17.x to 18

Explicit import needs to be performed to enable rendering implementation. Profiles
have been created to simplify that task. See vtk.js/Sources/Rendering/OpenGL|WebGPU/Profiles/*.

## From 16.x to 17

vtkBoundingBox has been redesigned to be more light weight with static methods.
A simple class has been created for backward compatibility.

## From 15.x to 16

Deprecation of kw-web-suite and using a newer version of webpack for building vtk.js.

## From 14.x to 15

Semantic release messed up?

## From 13.x to 14

css-loader update means we need to change how css modules are
configured.

## From 12.x to 13

manipulators: No breaking changes internally. But the CompositeMouseManipulator no longer
receives key down and key up events. I don't know of anything that this could break, but it might.

## From 11.x to 12

Manipulators: manipulator lists are now actually modified by removing
the manipulator from the list of manipulators, and not just replacing them
by null value for a certain index. This affects the resulting size of the
manipulator list, and users should not rely on an index that needed to
remain constant. Getters were also removed.

## From 10.x to 11

vtkPlane: return result is changed if the line intersects the plane but outside of the
provided points. Previously would return intersect:false, but now intersect:true and
betweenPoints:false

## From 9.x to 10

PiecewiseGaussianWidget: The optional arguments of setDataArray have been gathered inside a single options
object since we added to that list component and numberOfComponents

## From 8.x to 9

MatrixBuilder: Remove getVTKMatrix function as it had a side-effect, was poorly named, and was not
referenced anywhere else. If the user wants to transpose the matrix, they can do it after calling
getMatrix()

## From 7.x to 8

ToolChain: Webpack rules may differ with babel 7

## From 6.x to 7

RenderWindow: OpenGL/RenderWindow::captureNextImage returns a promise with the imageURL instead of returing it
directly. Core/RenderWindow::captureImages returns an array of promise.
## From 5.x to 6

This switch focuses on simplifying the interactor observers, and forwarding events data to the callbacks:
- Remove `set/getAnimationState` and `start/stopState` in InteractorStyle. Instead, use `start/stop${stateName}`.
- Remove `CharEvent` which was a duplicate of `KeyPressEvent`.
- Rename `setEnable*(` to `setEnabled()` in AbstractWidget.
- Remove `get2DPointerPosition()` from AbstractWidget: the position will now be properly positioned based on the canvas bounds as soon as it is caught by the Interactor.
- Rename `Pinch` events to `MouseWheel` events when those events are triggered by the mouse wheel, and use the wheel delta instead of a scale.
- The interaction state is now passed through the callbacks to the events instead of being stored within the RenderWindowInteractor. That means the following API is replaced as such:
  - `i.getEventPosition` -> `callData.position` (no need for an index)
  - `i.getScale` -> `callData.scale` if pinching, or use `callData.wheelDelta` if you are in a MouseWheel event instead
  - `i.getTranslation` -> `callData.translation`
  - `i.getRotation` -> `callData.rotation`
  - for multitouch, touch positions are forwarded in `callData.positions` as `{touchid1: {x:x1, y:y1, z:z1}, touchid2: {x:x2, y:y2, z:z2}`}
  - every "previous" state (`lastEventPosition`, `lastScale`...) needs to be stored from the observer, for example initialized in a `handleStart${event}` callback and updated in the `handle${event}` callback
  - every callback data also holds `type` which is the event name
- Remove `findPokedRenderer` from the InteractorStyle/Observer. Instead, the latest poked renderer is passed through the callback as `callData.pokedRenderer`. That renderer is never `null` within callbacks since the event won't forward if it is. _You can also query the renderer through `RenderWindowInteractor.getCurrentRenderer()` but this is not recommended._
- Add `renderer` as a parameter to `computeWorldToDisplay` and `computeDisplayToWorld` in InteractorObserver

Add more consistency in Readers
- Readers should have the following set of API
  - setURL(url, options)
  - fetchData(options) // OPTIONAL and should not be required
  - parseAsArrayBuffer(ArrayBuffer) or parseAsText(String)
- Affected readers:
  - STLReader
  - Legacy/PolyDataReader
  - ElevationReader
  - MTLReader
  - OBJReader
  - PDBReader
  - XMLReader

Refactor InteractorStyleManipulator with its manipulator
- Rename all the classes to make them consistent
- Update API to distinguish mode vs state (mode[drag/scroll], state[button,alt,control,shift])
- Update impacted code and example

## From 4.x to 5

Improve and normalize methods inside DataAccessHelper to allow network progress monitoring:
- Refactor fetchText(instance = {}, url, compression, progressCallback) into fetchText(instance = {}, url, options = { compression, progressCallback: fn() })
- Refactor fetchJSON(instance = {}, url, compression) into fetchJSON(instance = {}, baseURL, array, options = { compression, progressCallback: fn() })
- Refactor fetchArray(instance = {}, baseURL, array, fetchGzip = false) into fetchArray(instance = {}, baseURL, array, options = { compression: 'gz', progressCallback: fn() })
- Rename HttpDataSetReader.fetchZipFile(url) to HttpDataSetReader.fetchBinary(url, options)

## From 3.x to 4

The representation module as been removed and a better approach has been taken for OBJ/MTL loading.

## From 2.x to 3

Migrate to Webpack 2+ which changed the way rules are defined and how to intgrate vtk.js into your project. The following [documentation](https://kitware.github.io/vtk-js/docs/intro_vtk_as_es6_dependency.html) has been updated accordingly.

## From 1.x to 2

### vtkDataSetAttributes

vtkDataSetAttributes has been reimplemented to follow the VTK model. By doing so the data model structure as changed and any code that was using it as input will need to be updated.

Before:

{
   "ArrayName": { vtkDataArray instance ... }
}

After:

{
   "activeTCoords": -1,
   "activeScalars": -1,
   "vtkClass": "vtkDataSetAttributes",
   "arrays": [
     { "data": { vtkDataArray instance ... } }
   ],
   "activeNormals": -1,
   "activeGlobalIds": -1,
   "activeTensors": -1,
   "activePedigreeIds": -1,
   "activeVectors": -1
}

### vtkPoints

points used to be simple vtkDataArray.
Now we have a vtkPoint class that contains a vtkDataArray in its data.

Before:

const coordsAsTypedArray = dataset.getPoints().getData();

After:

const dataArray = dataset.getPoints().getData();
const coordsAsTypedArray = dataArray.getData();

### vtk()

Serialization model changed from { type: 'vtkPolyData', ... } to { vtkClass: 'vtkPolyData', ... }.
