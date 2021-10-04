import macro from 'vtk.js/Sources/macros';
import vtkAbstractWidgetFactory from 'vtk.js/Sources/Widgets/Core/AbstractWidgetFactory';
import vtkCircleContextRepresentation from 'vtk.js/Sources/Widgets/Representations/CircleContextRepresentation';
import vtkPlaneManipulator from 'vtk.js/Sources/Widgets/Manipulators/PlaneManipulator';
import vtkSphereHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/SphereHandleRepresentation';

import widgetBehavior from 'vtk.js/Sources/Widgets/Widgets3D/PaintWidget/behavior';
import stateGenerator from 'vtk.js/Sources/Widgets/Widgets3D/PaintWidget/state';

import { ViewTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

// ----------------------------------------------------------------------------
// Factory
// ----------------------------------------------------------------------------

function vtkPaintWidget(publicAPI, model) {
  model.classHierarchy.push('vtkPaintWidget');

  // --- Widget Requirement ---------------------------------------------------
  model.behavior = widgetBehavior;
  model.widgetState = stateGenerator(model.radius);

  publicAPI.getRepresentationsForViewType = (viewType) => {
    switch (viewType) {
      case ViewTypes.DEFAULT:
      case ViewTypes.GEOMETRY:
      case ViewTypes.SLICE:
        return [
          {
            builder: vtkCircleContextRepresentation,
            labels: ['handle', 'trail'],
          },
        ];
      case ViewTypes.VOLUME:
      default:
        return [{ builder: vtkSphereHandleRepresentation, labels: ['handle'] }];
    }
  };
  // --- Widget Requirement ---------------------------------------------------

  const handle = model.widgetState.getHandle();

  // Default manipulator
  model.manipulator = vtkPlaneManipulator.newInstance();
  handle.setManipulator(model.manipulator);

  // override
  const superSetRadius = publicAPI.setRadius;
  publicAPI.setRadius = (r) => {
    if (superSetRadius(r)) {
      handle.setScale1(r);
    }
  };
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  manipulator: null,
  radius: 1,
  painting: false,
  color: [1],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkAbstractWidgetFactory.extend(publicAPI, model, initialValues);

  macro.get(publicAPI, model, ['painting']);
  macro.setGet(publicAPI, model, ['manipulator', 'radius', 'color']);

  vtkPaintWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPaintWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
