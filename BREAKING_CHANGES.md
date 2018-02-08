## From 5.x to 6

This switch focuses on simplifying the interactor observers, and forwarding events data to the callbacks:
- Remove `set/getAnimationState` and `start/stopState` in InteractorStyle. Instead, use `start/stop${stateName}`.
- Remove `CharEvent` whcih was a duplicate of `KeyPressEvent`.
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




