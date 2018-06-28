import macro from 'vtk.js/Sources/macro';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import vtkAbstractWidget from 'vtk.js/Sources/Interaction/Widgets/AbstractWidget';
import vtkImageCroppingRegionsRepresentation from 'vtk.js/Sources/Interaction/Widgets/ImageCroppingRegionsRepresentation';
import Constants from 'vtk.js/Sources/Interaction/Widgets/ImageCroppingRegionsWidget/Constants';
import { vec3, mat4 } from 'gl-matrix';

const { vtkErrorMacro, VOID, EVENT_ABORT } = macro;
const { TOTAL_NUM_HANDLES, WidgetState, CropWidgetEvents } = Constants;

// Determines the ordering of edge handles for some fixed axis
const EDGE_ORDER = [[0, 0], [0, 1], [1, 0], [1, 1]];

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

  // camera subscription
  let cameraSub = null;

  model.indexToWorld = mat4.create();
  model.worldToIndex = mat4.create();

  let handlesCache = null;

  model.widgetState = {
    activeHandleIndex: -1,
    // index space: xmin, xmax, ymin, ymax, zmin, zmax
    planes: Array(6).fill(0),
    controlState: WidgetState.IDLE,
  };

  function worldToIndex(ain) {
    const vin = vec3.fromValues(ain[0], ain[1], ain[2]);
    const vout = vec3.create();
    vec3.transformMat4(vout, vin, model.worldToIndex);
    return [vout[0], vout[1], vout[2]];
  }

  function indexToWorld(ain) {
    const vin = vec3.fromValues(ain[0], ain[1], ain[2]);
    const vout = vec3.create();
    vec3.transformMat4(vout, vin, model.indexToWorld);
    return [vout[0], vout[1], vout[2]];
  }

  // Overriden method
  publicAPI.createDefaultRepresentation = () => {
    if (!model.widgetRep) {
      model.widgetRep = vtkImageCroppingRegionsRepresentation.newInstance();
      publicAPI.updateRepresentation();
    }
  };

  publicAPI.getWidgetState = () => Object.assign({}, model.widgetState);

  publicAPI.updateWidgetState = (state) => {
    const needsUpdate = Object.keys(state).reduce(
      (flag, key) => flag || model.widgetState[key] !== state[key],
      false
    );

    if (needsUpdate) {
      const oldState = model.widgetState;
      model.widgetState = Object.assign({}, oldState, state);

      if (!arrayEquals(oldState.planes, model.widgetState.planes)) {
        // invalidate handles cache
        handlesCache = null;
        publicAPI.invokeCroppingPlanesChanged(model.widgetState.planes);
      }

      publicAPI.updateRepresentation();
      publicAPI.modified();
    }
  };

  publicAPI.setVolumeMapper = (volumeMapper) => {
    if (volumeMapper !== model.volumeMapper) {
      model.volumeMapper = volumeMapper;

      publicAPI.resetWidgetState();
      if (model.enabled) {
        publicAPI.updateRepresentation();
      }
    }
  };

  publicAPI.planesToHandles = (planes) => {
    if (!model.volumeMapper || !model.volumeMapper.getInputData()) {
      return null;
    }

    if (handlesCache) {
      return handlesCache;
    }

    // coords are in world space.
    // a null handle means it is disabled
    const handles = Array(TOTAL_NUM_HANDLES).fill(null);

    if (model.faceHandlesEnabled) {
      // construct face handles
      for (let i = 0; i < 6; ++i) {
        const center = [0, 0, 0].map((c, j) => {
          if (j === Math.floor(i / 2)) {
            return planes[i];
          }
          return (planes[j * 2] + planes[j * 2 + 1]) / 2;
        });

        handles[i] = [center[0], center[1], center[2]];
      }
    }

    if (model.edgeHandlesEnabled) {
      // construct edge handles
      for (let i = 0; i < 12; ++i) {
        // the axis around which edge handles will be placed
        const fixedAxis = Math.floor(i / 4);
        const edgeSpec = EDGE_ORDER[i % 4].slice();
        const center = [];

        for (let j = 0; j < 3; ++j) {
          if (j !== fixedAxis) {
            // edgeSpec[j] determines whether to pick a min or max cropping
            // plane for edge selection.
            center.push(planes[j * 2 + edgeSpec.shift()]);
          }
        }

        // set fixed axis coordinate
        center.splice(
          fixedAxis,
          0,
          (planes[fixedAxis * 2] + planes[fixedAxis * 2 + 1]) / 2
        );

        handles[i + 6] = [center[0], center[1], center[2]];
      }
    }

    if (model.cornerHandlesEnabled) {
      // construct corner handles
      for (let i = 0; i < 8; ++i) {
        /* eslint-disable no-bitwise */
        handles[i + 18] = [
          planes[0 + ((i >> 2) & 0x1)],
          planes[2 + ((i >> 1) & 0x1)],
          planes[4 + ((i >> 0) & 0x1)],
        ];
        /* eslint-enable no-bitwise */
      }
    }

    // transform handles from index to world space
    for (let i = 0; i < handles.length; ++i) {
      if (handles[i]) {
        handles[i] = indexToWorld(handles[i]);
      }
    }

    handlesCache = handles;
    return handles;
  };

  publicAPI.planesToBBoxCorners = (planes) => {
    if (!model.volumeMapper || !model.volumeMapper.getInputData()) {
      return null;
    }

    return [
      [planes[0], planes[2], planes[4]],
      [planes[0], planes[2], planes[5]],
      [planes[0], planes[3], planes[4]],
      [planes[0], planes[3], planes[5]],
      [planes[1], planes[2], planes[4]],
      [planes[1], planes[2], planes[5]],
      [planes[1], planes[3], planes[4]],
      [planes[1], planes[3], planes[5]],
    ].map((coord) => indexToWorld(coord));
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

    // cache transforms
    model.indexToWorld = data.getIndexToWorld();
    model.worldToIndex = data.getWorldToIndex();

    const planes = data.getExtent();
    publicAPI.setCroppingPlanes(...planes);
  };

  publicAPI.setEnabled = macro.chain(publicAPI.setEnabled, (enable) => {
    if (cameraSub) {
      cameraSub.unsubscribe();
    }

    if (enable) {
      const camera = publicAPI
        .getInteractor()
        .getCurrentRenderer()
        .getActiveCamera();
      cameraSub = camera.onModified(publicAPI.updateRepresentation);
      publicAPI.updateRepresentation();
    }
  });

  publicAPI.setFaceHandlesEnabled = (enabled) => {
    if (model.faceHandlesEnabled !== enabled) {
      model.faceHandlesEnabled = enabled;
      publicAPI.updateRepresentation();
      publicAPI.modified();
    }
  };

  publicAPI.setEdgeHandlesEnabled = (enabled) => {
    if (model.edgeHandlesEnabled !== enabled) {
      model.edgeHandlesEnabled = enabled;
      publicAPI.updateRepresentation();
      publicAPI.modified();
    }
  };

  publicAPI.setCornerHandlesEnabled = (enabled) => {
    if (model.cornerHandlesEnabled !== enabled) {
      model.cornerHandlesEnabled = enabled;
      publicAPI.updateRepresentation();
      publicAPI.modified();
    }
  };

  publicAPI.setHandleSize = (size) => {
    if (model.handleSize !== size) {
      model.handleSize = size;
      publicAPI.updateRepresentation();
      publicAPI.modified();
    }
  };

  publicAPI.getCroppingPlanes = () => model.widgetState.planes.slice();

  publicAPI.setCroppingPlanes = (...planes) => {
    publicAPI.updateWidgetState({ planes });
  };

  publicAPI.updateRepresentation = () => {
    if (model.widgetRep) {
      const bounds = model.volumeMapper.getBounds();
      model.widgetRep.placeWidget(...bounds);

      const { activeHandleIndex, planes } = model.widgetState;

      const bboxCorners = publicAPI.planesToBBoxCorners(planes);
      const handlePositions = publicAPI.planesToHandles(planes);
      const handleSizes = handlePositions.map((handle) => {
        if (!handle) {
          return model.handleSize;
        }
        return publicAPI.adjustHandleSize(handle, model.handleSize);
      });

      model.widgetRep.set({
        activeHandleIndex,
        handlePositions,
        bboxCorners,
        handleSizes,
      });

      publicAPI.render();
    }
  };

  publicAPI.adjustHandleSize = (pos, size) => {
    const interactor = publicAPI.getInteractor();
    if (!interactor && !interactor.getCurrentRenderer()) {
      return null;
    }
    const renderer = interactor.getCurrentRenderer();
    if (!renderer.getActiveCamera()) {
      return null;
    }

    const worldCoords = publicAPI.computeWorldToDisplay(
      renderer,
      pos[0],
      pos[1],
      pos[2]
    );

    const lowerLeft = publicAPI.computeDisplayToWorld(
      renderer,
      worldCoords[0] - size / 2.0,
      worldCoords[1] - size / 2.0,
      worldCoords[2]
    );

    const upperRight = publicAPI.computeDisplayToWorld(
      renderer,
      worldCoords[0] + size / 2.0,
      worldCoords[1] + size / 2.0,
      worldCoords[2]
    );

    let radius = 0.0;
    for (let i = 0; i < 3; i++) {
      radius += (upperRight[i] - lowerLeft[i]) * (upperRight[i] - lowerLeft[i]);
    }
    return Math.sqrt(radius) / 2.0;
  };

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
        p1World[i] = worldCoords[i] + tF * dop[i];
        p2World[i] = worldCoords[i] + tB * dop[i];
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
    const { controlState, planes, activeHandleIndex } = model.widgetState;
    if (controlState === WidgetState.IDLE || activeHandleIndex === -1) {
      return VOID;
    }

    const handles = publicAPI.planesToHandles(planes);
    const mouse = [callData.position.x, callData.position.y];
    const handlePos = handles[activeHandleIndex];
    const renderer = publicAPI.getInteractor().getCurrentRenderer();
    const camera = renderer.getActiveCamera();
    const dop = camera.getDirectionOfProjection();

    const point = publicAPI.displayToPlane(mouse, handlePos, dop);
    if (!point) {
      return EVENT_ABORT;
    }

    const newPlanes = planes.slice();

    // activeHandleIndex should be > -1 here
    if (activeHandleIndex < 6) {
      // face handle, so constrain to axis
      const moveAxis = Math.floor(activeHandleIndex / 2);

      // Constrain point to axis
      const orientation = model.volumeMapper.getInputData().getDirection();
      const offset = moveAxis * 3;
      const constraintAxis = orientation.slice(offset, offset + 3);

      const newPos = [0, 0, 0];
      const relMoveVect = [0, 0, 0];
      const projection = [0, 0, 0];
      vtkMath.subtract(point, handlePos, relMoveVect);
      vtkMath.projectVector(relMoveVect, constraintAxis, projection);
      vtkMath.add(handlePos, projection, newPos);

      const indexHandle = worldToIndex(newPos);

      // set correct plane value
      newPlanes[activeHandleIndex] = indexHandle[moveAxis];
    } else if (activeHandleIndex < 18) {
      // edge handle, so constrain to plane
      const edgeHandleIndex = activeHandleIndex - 6;
      const fixedAxis = Math.floor(edgeHandleIndex / 4);
      /**
       * edgeHandleIndex: plane, plane
       * 4: xmin, zmin
       * 5: xmin, zmax
       * 6: xmax, zmin
       * 7: xmax, zmax
       * 8: xmin, ymin
       * 9: xmin, ymax
       * 10: xmax, ymin
       * 11: xmax, ymax
       */
      const orientation = model.volumeMapper.getInputData().getDirection();
      const offset = fixedAxis * 3;
      const constraintPlaneNormal = orientation.slice(offset, offset + 3);

      const newPos = [0, 0, 0];
      const relMoveVect = [0, 0, 0];
      const projection = [0, 0, 0];
      vtkMath.subtract(point, handlePos, relMoveVect);
      vtkPlane.projectVector(relMoveVect, constraintPlaneNormal, projection);
      vtkMath.add(handlePos, projection, newPos);

      const indexHandle = worldToIndex(newPos);

      // get the two planes that are being adjusted
      const edgeSpec = EDGE_ORDER[edgeHandleIndex % 4].slice();
      const modifiedPlanes = [];
      for (let i = 0; i < 3; ++i) {
        if (i !== fixedAxis) {
          modifiedPlanes.push(i * 2 + edgeSpec.shift());
        }
      }

      // set correct plane value
      modifiedPlanes.forEach((planeIndex) => {
        // Math.floor(planeIndex / 2) is the corresponding changed
        // coordinate (that dictates the plane position)
        newPlanes[planeIndex] = indexHandle[Math.floor(planeIndex / 2)];
      });
    } else {
      // corner handles, so no constraints
      const cornerHandleIndex = activeHandleIndex - 18;

      const indexHandle = worldToIndex(point);

      // get the three planes that are being adjusted
      /* eslint-disable no-bitwise */
      const modifiedPlanes = [
        0 + ((cornerHandleIndex >> 2) & 0x1),
        2 + ((cornerHandleIndex >> 1) & 0x1),
        4 + ((cornerHandleIndex >> 0) & 0x1),
      ];
      /* eslint-enable no-bitwise */

      // set correct plane value
      modifiedPlanes.forEach((planeIndex) => {
        // Math.floor(planeIndex / 2) is the corresponding changed
        // coordinate (that dictates the plane position)
        newPlanes[planeIndex] = indexHandle[Math.floor(planeIndex / 2)];
      });
    }

    publicAPI.setCroppingPlanes(...newPlanes);

    return EVENT_ABORT;
  };

  publicAPI.endMoveAction = () => {
    if (model.widgetState.activeHandleIndex > -1) {
      publicAPI.updateWidgetState({
        activeHandleIndex: -1,
        controlState: WidgetState.IDLE,
      });
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // volumeMapper: null,
  handleSize: 5,
  faceHandlesEnabled: false,
  edgeHandlesEnabled: false,
  cornerHandlesEnabled: true,
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

  macro.get(publicAPI, model, [
    'volumeMapper',
    'handleSize',
    'faceHandlesEnabled',
    'edgeHandlesEnabled',
    'cornerHandlesEnabled',
  ]);

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
