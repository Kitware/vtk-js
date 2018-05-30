import macro from 'vtk.js/Sources/macro';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import vtkAbstractWidget from 'vtk.js/Sources/Interaction/Widgets/AbstractWidget';
import vtkImageCroppingRegionsRepresentation from 'vtk.js/Sources/Interaction/Widgets/ImageCroppingRegionsRepresentation';
import Constants from 'vtk.js/Sources/Interaction/Widgets/ImageCroppingRegionsWidget/Constants';
import { vec3 } from 'gl-matrix';

const { vtkErrorMacro, VOID, EVENT_ABORT } = macro;
const { WidgetState, CropWidgetEvents } = Constants;

// ----------------------------------------------------------------------------
// vtkImageCroppingRegionsWidget methods
// ----------------------------------------------------------------------------

function arrayEquals(a, b) {
  if (a.length === b.length) {
    for (let i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }
  return false;
}

function vtkImageCroppingRegionsWidget(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageCroppingRegionsWidget');

  model.widgetState = {
    activeHandleIndex: -1,
    // index space: xmin, xmax, ymin, ymax, zmin, zmax
    planes: Array(6).fill(0),
    // world space coords
    handles: Array(6)
      .fill([])
      .map(() => [0, 0, 0]),
    controlState: WidgetState.IDLE,
  };

  // Overriden method
  publicAPI.createDefaultRepresentation = () => {
    if (!model.widgetRep) {
      model.widgetRep = vtkImageCroppingRegionsRepresentation.newInstance();
      publicAPI.updateRepresentation();
    }
  };

  publicAPI.updateWidgetState = (state) => {
    const oldState = model.widgetState;
    model.widgetState = Object.assign({}, oldState, state);
    publicAPI.updateRepresentation();

    if (!arrayEquals(oldState.planes, model.widgetState.planes)) {
      publicAPI.invokeCroppingPlanesChanged(model.widgetState.planes);
    }
    publicAPI.modified();
  };

  publicAPI.setVolumeMapper = (volumeMapper) => {
    if (volumeMapper !== model.volumeMapper) {
      model.volumeMapper = volumeMapper;
      if (model.enabled) {
        publicAPI.resetWidgetState();
        publicAPI.updateRepresentation();
      }
    }
  };

  publicAPI.planesToHandles = (planes) => {
    if (!model.volumeMapper || !model.volumeMapper.getInputData()) {
      return null;
    }

    const indexToWorld = model.volumeMapper.getInputData().getIndexToWorld();

    return Array(6)
      .fill([0, 0, 0])
      .map((_, i) => {
        const center = [0, 0, 0].map((c, j) => {
          if (j === Math.floor(i / 2)) {
            return planes[i];
          }
          return (planes[j * 2] + planes[j * 2 + 1]) / 2;
        });

        // transform points
        const vin = vec3.fromValues(...center);
        const vout = vec3.create();
        vec3.transformMat4(vout, vin, indexToWorld);

        return [vout[0], vout[1], vout[2]];
      });
  };

  publicAPI.planesToBBoxCorners = (planes) => {
    if (!model.volumeMapper || !model.volumeMapper.getInputData()) {
      return null;
    }

    const indexToWorld = model.volumeMapper.getInputData().getIndexToWorld();
    return [
      [planes[0], planes[2], planes[4]],
      [planes[0], planes[2], planes[5]],
      [planes[0], planes[3], planes[4]],
      [planes[0], planes[3], planes[5]],
      [planes[1], planes[2], planes[4]],
      [planes[1], planes[2], planes[5]],
      [planes[1], planes[3], planes[4]],
      [planes[1], planes[3], planes[5]],
    ].map((coord) => {
      const vin = vec3.fromValues(...coord);
      const vout = vec3.create();
      vec3.transformMat4(vout, vin, indexToWorld);

      return [vout[0], vout[1], vout[2]];
    });
  };

  publicAPI.handlesToPlanes = (handles) => {
    if (!model.volumeMapper || !model.volumeMapper.getInputData()) {
      return null;
    }

    const worldToIndex = model.volumeMapper.getInputData().getWorldToIndex();

    return handles.map((handle, i) => {
      const vin = vec3.fromValues(...handle);
      const vout = vec3.create();
      vec3.transformMat4(vout, vin, worldToIndex);

      // handle in index space
      const indexHandle = [vout[0], vout[1], vout[2]];
      return indexHandle[Math.floor(i / 2)];
    });
  };

  publicAPI.resetWidgetState = () => {
    if (!model.volumeMapper) {
      vtkErrorMacro('Volume mapper must be set to update representation');
      return;
    }
    if (!model.volumeMapper.getInputData()) {
      vtkErrorMacro('Volume mapper has no input data');
      return;
    }

    const data = model.volumeMapper.getInputData();
    const planes = data.getExtent();
    const handles = publicAPI.planesToHandles(planes);

    publicAPI.updateWidgetState({
      handles,
      planes,
    });
  };

  publicAPI.setEnabled = macro.chain(publicAPI.setEnabled, (enable) => {
    if (enable) {
      publicAPI.resetWidgetState();
    }
  });

  publicAPI.updateRepresentation = () => {
    if (model.widgetRep) {
      const bounds = model.volumeMapper.getBounds();
      model.widgetRep.placeWidget(...bounds);

      const { activeHandleIndex, handles, planes } = model.widgetState;
      const bboxCorners = publicAPI.planesToBBoxCorners(planes);

      model.widgetRep.set({
        activeHandleIndex,
        handlePositions: handles,
        bboxCorners,
      });

      publicAPI.render();
    }
  };

  publicAPI.setSlice = (slice) => {};

  publicAPI.setSliceOrientation = (sliceOrientation) => {};

  // Given display coordinates and a plane, returns the
  // point on the plane that corresponds to display coordinates.
  publicAPI.displayToPlane = (displayCoords, planePoint, planeNormal) => {
    const view = publicAPI.getInteractor().getView();
    const renderer = publicAPI.getInteractor().getCurrentRenderer();
    const camera = renderer.getActiveCamera();

    const cameraFocalPoint = camera.getFocalPoint();
    const cameraPos = camera.getPosition();

    // Adapted from vtkPicker
    const focalPointDispCoords = view.worldToDisplay(
      ...cameraFocalPoint,
      renderer
    );
    const worldCoords = view.displayToWorld(
      displayCoords[0],
      displayCoords[1],
      focalPointDispCoords[2], // Use focal point for z coord
      renderer
    );

    // compute ray from camera to selection
    const ray = [0, 0, 0];
    for (let i = 0; i < 3; ++i) {
      ray[i] = worldCoords[i] - cameraPos[i];
    }

    const dop = camera.getDirectionOfProjection();
    vtkMath.normalize(dop);
    const rayLength = vtkMath.dot(dop, ray);

    const clipRange = camera.getClippingRange();

    const p1World = [0, 0, 0];
    const p2World = [0, 0, 0];

    // get line segment coords from ray based on clip range
    if (camera.getParallelProjection()) {
      const tF = clipRange[0] - rayLength;
      const tB = clipRange[1] - rayLength;
      for (let i = 0; i < 3; i++) {
        p1World[i] = planePoint[i] + tF * dop[i];
        p2World[i] = planePoint[i] + tB * dop[i];
      }
    } else {
      const tF = clipRange[0] / rayLength;
      const tB = clipRange[1] / rayLength;
      for (let i = 0; i < 3; i++) {
        p1World[i] = cameraPos[i] + tF * ray[i];
        p2World[i] = cameraPos[i] + tB * ray[i];
      }
    }

    const r = vtkPlane.intersectWithLine(
      p1World,
      p2World,
      planePoint,
      planeNormal
    );
    return r.intersection ? r.x : null;
  };

  publicAPI.handleLeftButtonPress = (callData) =>
    publicAPI.pressAction(callData);

  publicAPI.handleLeftButtonRelease = (callData) =>
    publicAPI.endMoveAction(callData);

  publicAPI.handleMiddleButtonPress = (callData) =>
    publicAPI.pressAction(callData);

  publicAPI.handleMiddleButtonRelease = (callData) =>
    publicAPI.endMoveAction(callData);

  publicAPI.handleRightButtonPress = (callData) =>
    publicAPI.pressAction(callData);

  publicAPI.handleRightButtonRelease = (callData) =>
    publicAPI.endMoveAction(callData);

  publicAPI.handleMouseMove = (callData) => publicAPI.moveAction(callData);

  publicAPI.pressAction = (callData) => {
    if (model.widgetState.controlState === WidgetState.IDLE) {
      const handleIndex = model.widgetRep.getEventIntersection(callData);
      if (handleIndex > -1) {
        model.activeHandleIndex = handleIndex;
        publicAPI.updateWidgetState({
          activeHandleIndex: handleIndex,
          controlState: WidgetState.CROPPING,
        });
        return EVENT_ABORT;
      }
    }
    return VOID;
  };

  publicAPI.moveAction = (callData) => {
    const { controlState, handles, activeHandleIndex } = model.widgetState;
    if (controlState === WidgetState.IDLE || activeHandleIndex === -1) {
      return VOID;
    }

    const mouse = [callData.position.x, callData.position.y];
    const handlePos = handles[activeHandleIndex];
    const renderer = publicAPI.getInteractor().getCurrentRenderer();
    const camera = renderer.getActiveCamera();
    const dop = camera.getDirectionOfProjection();

    const point = publicAPI.displayToPlane(mouse, handlePos, dop);
    if (point) {
      // Constrain point to axis
      const orientation = model.volumeMapper.getInputData().getDirection();
      const offset = Math.floor(activeHandleIndex / 2) * 3;
      const axis = orientation.slice(offset, offset + 3);

      const newPos = [0, 0, 0];
      const relMoveVect = [0, 0, 0];
      const projection = [0, 0, 0];
      vtkMath.subtract(point, handlePos, relMoveVect);
      vtkMath.projectVector(relMoveVect, axis, projection);
      vtkMath.add(handlePos, projection, newPos);

      const newHandles = handles.slice();
      newHandles[activeHandleIndex] = newPos;

      // perf enhancement: only transform newPos back to index space,
      // since only one plane changed.
      const newPlanes = publicAPI.handlesToPlanes(newHandles);

      publicAPI.updateWidgetState({
        planes: newPlanes,
        handles: newHandles,
      });
    }
    return EVENT_ABORT;
  };

  publicAPI.endMoveAction = () => {
    publicAPI.updateWidgetState({
      activeHandleIndex: -1,
      controlState: WidgetState.IDLE,
    });
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // volumeMapper: null,
  slice: 0,
  sliceOrientation: 2, // XY
  handleSize: 3,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  // Have our default values override whatever is from parent class
  vtkAbstractWidget.extend(publicAPI, model, DEFAULT_VALUES, initialValues);

  CropWidgetEvents.forEach((eventName) =>
    macro.event(publicAPI, model, eventName)
  );

  macro.setGet(publicAPI, model, ['handleSize']);
  macro.get(publicAPI, model, ['volumeMapper', 'slice', 'sliceOrientation']);

  // Object methods
  vtkImageCroppingRegionsWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkImageCroppingRegionsWidget'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
