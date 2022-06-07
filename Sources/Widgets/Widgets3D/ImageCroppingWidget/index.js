import macro from 'vtk.js/Sources/macros';
import vtkAbstractWidgetFactory from 'vtk.js/Sources/Widgets/Core/AbstractWidgetFactory';
import vtkPlaneManipulator from 'vtk.js/Sources/Widgets/Manipulators/PlaneManipulator';
import vtkLineManipulator from 'vtk.js/Sources/Widgets/Manipulators/LineManipulator';
import vtkSphereHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/SphereHandleRepresentation';
import vtkCroppingOutlineRepresentation from 'vtk.js/Sources/Widgets/Representations/CroppingOutlineRepresentation';

import behavior from 'vtk.js/Sources/Widgets/Widgets3D/ImageCroppingWidget/behavior';
import state from 'vtk.js/Sources/Widgets/Widgets3D/ImageCroppingWidget/state';

import {
  AXES,
  transformVec3,
} from 'vtk.js/Sources/Widgets/Widgets3D/ImageCroppingWidget/helpers';

import { ViewTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Factory
// ----------------------------------------------------------------------------

function vtkImageCroppingWidget(publicAPI, model) {
  model.classHierarchy.push('vtkImageCroppingWidget');

  const superClass = { ...publicAPI };

  let stateSub = null;

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
    const getAxis = (a) => AXES[a];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        for (let k = 0; k < 3; k++) {
          // skip center of box
          if (i !== 1 || j !== 1 || k !== 1) {
            const name = [i, j, k].map(getAxis).join('');
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

  // --------------------------------------------------------------------------

  publicAPI.delete = macro.chain(publicAPI.delete, () => {
    if (stateSub) {
      stateSub.unsubscribe();
    }
  });

  // --- Widget Requirement ---------------------------------------------------

  model.behavior = behavior;
  model.widgetState = state();

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
            builder: vtkCroppingOutlineRepresentation,
            // outline is defined by corner points
            labels: ['corners'],
          },
        ];
    }
  };

  // Update handle positions when cropping planes update
  stateSub = model.widgetState
    .getCroppingPlanes()
    .onModified(publicAPI.updateHandles);

  publicAPI.setCornerManipulator = (manipulator) => {
    superClass.setCornerManipulator(manipulator);
    model.widgetState
      .getStatesWithLabel('corners')
      .forEach((handle) => handle.setManipulator(manipulator));
  };

  publicAPI.setEdgeManipulator = (manipulator) => {
    superClass.setEdgeManipulator(manipulator);
    model.widgetState
      .getStatesWithLabel('edges')
      .forEach((handle) => handle.setManipulator(manipulator));
  };

  publicAPI.setFaceManipulator = (manipulator) => {
    superClass.setFaceManipulator(manipulator);
    model.widgetState
      .getStatesWithLabel('faces')
      .forEach((handle) => handle.setManipulator(manipulator));
  };

  // --------------------------------------------------------------------------
  // initialization
  // --------------------------------------------------------------------------

  publicAPI.setCornerManipulator(
    vtkPlaneManipulator.newInstance({ useCameraNormal: true })
  );
  publicAPI.setEdgeManipulator(vtkPlaneManipulator.newInstance());
  publicAPI.setFaceManipulator(vtkLineManipulator.newInstance());
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // cornerManipulator: null,
  // edgeManipulator: null,
  // faceManipulator: null
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkAbstractWidgetFactory.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, [
    'cornerManipulator',
    'edgeManipulator',
    'faceManipulator',
  ]);

  vtkImageCroppingWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImageCroppingWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
