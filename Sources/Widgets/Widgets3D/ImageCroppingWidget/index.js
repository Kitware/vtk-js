import { vec3 } from 'gl-matrix';

import macro from 'vtk.js/Sources/macro';
import vtkAbstractWidgetFactory from 'vtk.js/Sources/Widgets/Core/AbstractWidgetFactory';
import vtkPlaneManipulator from 'vtk.js/Sources/Widgets/Manipulators/PlaneManipulator';
import vtkLineManipulator from 'vtk.js/Sources/Widgets/Manipulators/LineManipulator';
import vtkSphereHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/SphereHandleRepresentation';
import vtkOutlineContextRepresentation from 'vtk.js/Sources/Widgets/Representations/OutlineContextRepresentation';
import vtkStateBuilder from 'vtk.js/Sources/Widgets/Core/StateBuilder';

import { ViewTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

// Labels used to encode handle position in the handle state's name property
const AXES = ['-', '=', '+'];

// ----------------------------------------------------------------------------

function transformVec3(ain, transform) {
  const vin = vec3.fromValues(ain[0], ain[1], ain[2]);
  const vout = vec3.create();
  vec3.transformMat4(vout, vin, transform);
  return [vout[0], vout[1], vout[2]];
}

// ----------------------------------------------------------------------------

function handleTypeFromName(name) {
  const [i, j, k] = name.split('').map((l) => AXES.indexOf(l) - 1);
  if (i * j * k !== 0) {
    return 'corners';
  }
  if (i * j !== 0 || j * k !== 0 || k * i !== 0) {
    return 'edges';
  }
  return 'faces';
}

// ----------------------------------------------------------------------------
// Widget linked to a view
// ----------------------------------------------------------------------------

function widgetBehavior(publicAPI, model) {
  let isDragging = null;

  publicAPI.setDisplayCallback = (callback) =>
    model.representations[0].setDisplayCallback(callback);

  publicAPI.handleLeftButtonPress = () => {
    if (
      !model.activeState ||
      !model.activeState.getActive() ||
      !model.pickable
    ) {
      return macro.VOID;
    }
    isDragging = true;
    model.interactor.requestAnimation(publicAPI);
    return macro.EVENT_ABORT;
  };

  publicAPI.handleMouseMove = (callData) => {
    if (isDragging && model.pickable) {
      return publicAPI.handleEvent(callData);
    }
    return macro.VOID;
  };

  publicAPI.handleLeftButtonRelease = () => {
    if (isDragging && model.pickable) {
      isDragging = false;
      model.interactor.cancelAnimation(publicAPI);
      model.widgetState.deactivate();
    }
  };

  publicAPI.handleEvent = (callData) => {
    if (model.pickable && model.activeState && model.activeState.getActive()) {
      const manipulator = model.activeState.getManipulator();
      if (manipulator) {
        const name = model.activeState.getName();
        const type = handleTypeFromName(name);
        const index = name.split('').map((l) => AXES.indexOf(l));
        const planes = model.widgetState.getCroppingPlanes().getPlanes();
        const indexToWorldT = model.widgetState.getIndexToWorldT();

        let worldCoords = [];

        if (type === 'corners') {
          // manipulator should be a plane manipulator
          manipulator.setNormal(model.camera.getDirectionOfProjection());
          worldCoords = manipulator.handleEvent(
            callData,
            model.openGLRenderWindow
          );
        }

        if (type === 'faces') {
          // constraint axis is line defined by the index and center point.
          // Since our index point is defined inside a box [0, 2, 0, 2, 0, 2],
          // center point is [1, 1, 1].
          const constraintAxis = [1 - index[0], 1 - index[1], 1 - index[2]];

          // get center of current crop box
          const center = [
            (planes[0] + planes[1]) / 2,
            (planes[2] + planes[3]) / 2,
            (planes[4] + planes[5]) / 2,
          ];

          // manipulator should be a line manipulator
          manipulator.setOrigin(transformVec3(center, indexToWorldT));
          manipulator.setNormal(transformVec3(constraintAxis, indexToWorldT));
          worldCoords = manipulator.handleEvent(
            callData,
            model.openGLRenderWindow
          );
        }

        if (type === 'edges') {
          // constrain to a plane with a normal parallel to the edge
          const edgeAxis = index.map((a) => (a === 1 ? a : 0));

          manipulator.setNormal(transformVec3(edgeAxis, indexToWorldT));
          worldCoords = manipulator.handleEvent(
            callData,
            model.openGLRenderWindow
          );
        }

        if (worldCoords.length) {
          // transform worldCoords to indexCoords, and then update the croppingPlanes() state with setPlanes().
          const worldToIndexT = model.widgetState.getWorldToIndexT();
          const indexCoords = transformVec3(worldCoords, worldToIndexT);

          for (let i = 0; i < 3; i++) {
            if (index[i] === 0) {
              planes[i * 2] = indexCoords[i];
            } else if (index[i] === 2) {
              planes[i * 2 + 1] = indexCoords[i];
            }
          }

          model.activeState.setOrigin(...worldCoords);
          model.widgetState.getCroppingPlanes().setPlanes(...planes);

          return macro.EVENT_ABORT;
        }
      }
    }
    return macro.VOID;
  };

  // --------------------------------------------------------------------------
  // initialization
  // --------------------------------------------------------------------------

  model.camera = model.renderer.getActiveCamera();

  model.classHierarchy.push('vtkImageCroppingWidgetProp');
}

// ----------------------------------------------------------------------------
// Factory
// ----------------------------------------------------------------------------

function vtkImageCroppingWidget(publicAPI, model) {
  model.classHierarchy.push('vtkImageCroppingWidget');

  // --------------------------------------------------------------------------

  function setHandlesEnabled(label, flag) {
    model.widgetState.getStatesWithLabel(label).forEach((handle) => {
      handle.setVisible(flag);
    });
  }

  // Set the visibility of the three classes of handles: face, edge, corner
  publicAPI.setFaceHandlesEnabled = (flag) => setHandlesEnabled('faces', flag);
  publicAPI.setEdgeHandlesEnabled = (flag) => setHandlesEnabled('edges', flag);
  publicAPI.setCornerHandlesEnabled = (flag) =>
    setHandlesEnabled('corners', flag);

  // --------------------------------------------------------------------------

  // Copies the transforms and dimension of a vtkImageData
  publicAPI.copyImageDataDescription = (im) => {
    model.widgetState.setIndexToWorldT(...im.getIndexToWorld());
    model.widgetState.setWorldToIndexT(...im.getWorldToIndex());

    const dims = im.getDimensions();
    const planeState = model.widgetState.getCroppingPlanes();
    planeState.setPlanes([0, dims[0], 0, dims[1], 0, dims[2]]);

    publicAPI.modified();
  };

  // --------------------------------------------------------------------------

  // Updates handle positions based on cropping planes
  publicAPI.updateHandles = () => {
    const planes = model.widgetState.getCroppingPlanes().getPlanes();
    const midpts = [
      (planes[0] + planes[1]) / 2,
      (planes[2] + planes[3]) / 2,
      (planes[4] + planes[5]) / 2,
    ];
    const iAxis = [planes[0], midpts[0], planes[1]];
    const jAxis = [planes[2], midpts[1], planes[3]];
    const kAxis = [planes[4], midpts[2], planes[5]];

    const indexToWorldT = model.widgetState.getIndexToWorldT();
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        for (let k = 0; k < 3; k++) {
          // skip center of box
          if (i !== 1 || j !== 1 || k !== 1) {
            const name = [i, j, k].map((a) => AXES[a]).join('');
            const coord = transformVec3(
              [iAxis[i], jAxis[j], kAxis[k]],
              indexToWorldT
            );

            const [handle] = model.widgetState.getStatesWithLabel(name);
            handle.setOrigin(...coord);
          }
        }
      }
    }
  };

  // --- Widget Requirement ---------------------------------------------------
  model.behavior = widgetBehavior;

  // Given a view type (geometry, slice, volume), return a description
  // of what representations to create and what widget state to pass
  // to the respective representations.
  publicAPI.getRepresentationsForViewType = (viewType) => {
    switch (viewType) {
      case ViewTypes.DEFAULT:
      case ViewTypes.GEOMETRY:
      case ViewTypes.SLICE:
      case ViewTypes.VOLUME:
      default:
        return [
          // Describes constructing a vtkSphereHandleRepresentation, and every
          // time the widget state updates, we will give the representation
          // a list of all handle states (which have the label "handles").
          { builder: vtkSphereHandleRepresentation, labels: ['handles'] },
          {
            builder: vtkOutlineContextRepresentation,
            // outline is defined by corner points
            labels: ['corners'],
          },
        ];
    }
  };

  // --- Widget Requirement ---------------------------------------------------

  // create our state builder
  const builder = vtkStateBuilder.createBuilder();

  // add image data description fields
  builder
    .addField({
      name: 'indexToWorldT',
      initialValue: Array(16).fill(0),
    })
    .addField({
      name: 'worldToIndexT',
      initialValue: Array(16).fill(0),
    });

  // make cropping planes a sub-state so we can listen to it
  // separately from the rest of the widget state.
  const croppingState = vtkStateBuilder
    .createBuilder()
    .addField({
      name: 'planes',
      // index space
      initialValue: [0, 1, 0, 1, 0, 1],
    })
    .build();

  // add cropping planes state to our primary state
  builder.addStateFromInstance({
    labels: ['croppingPlanes'],
    name: 'croppingPlanes',
    instance: croppingState,
  });

  // add all handle states
  // default bounds is [-1, 1] in all dimensions
  for (let i = -1; i < 2; i++) {
    for (let j = -1; j < 2; j++) {
      for (let k = -1; k < 2; k++) {
        // skip center of box
        if (i !== 0 || j !== 0 || k !== 0) {
          const name = AXES[i + 1] + AXES[j + 1] + AXES[k + 1];
          const type = handleTypeFromName(name);

          // since handle states are rendered via vtkSphereHandleRepresentation,
          // we can dictate the handle origin, size (scale1), color, and visibility.
          builder.addStateFromMixin({
            labels: ['handles', name, type],
            mixins: [
              'name',
              'origin',
              'color',
              'scale1',
              'visible',
              'manipulator',
            ],
            name,
            initialValues: {
              scale1: 10,
              origin: [i, j, k],
              visible: true,
              name,
            },
          });
        }
      }
    }
  }

  // construct our state from the fields and sub-state descriptions.
  model.widgetState = builder.build();

  // Update handle positions when cropping planes update
  croppingState.onModified(publicAPI.updateHandles);

  // Add manipulators to our widgets.
  const planeManipulator = vtkPlaneManipulator.newInstance();
  const lineManipulator = vtkLineManipulator.newInstance();

  model.widgetState
    .getStatesWithLabel('corners')
    .forEach((handle) => handle.setManipulator(planeManipulator));
  model.widgetState
    .getStatesWithLabel('edges')
    .forEach((handle) => handle.setManipulator(planeManipulator));
  model.widgetState
    .getStatesWithLabel('faces')
    .forEach((handle) => handle.setManipulator(lineManipulator));
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkAbstractWidgetFactory.extend(publicAPI, model, initialValues);

  vtkImageCroppingWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImageCroppingWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
