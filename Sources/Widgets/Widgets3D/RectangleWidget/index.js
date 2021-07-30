import macro from 'vtk.js/Sources/macros';
import vtkAbstractWidgetFactory from 'vtk.js/Sources/Widgets/Core/AbstractWidgetFactory';
import vtkPlanePointManipulator from 'vtk.js/Sources/Widgets/Manipulators/PlaneManipulator';
import vtkSphereHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/SphereHandleRepresentation';
import vtkRectangleContextRepresentation from 'vtk.js/Sources/Widgets/Representations/RectangleContextRepresentation';
import widgetBehavior from 'vtk.js/Sources/Widgets/Widgets3D/RectangleWidget/behavior';
import stateGenerator from 'vtk.js/Sources/Widgets/Widgets3D/RectangleWidget/state';

import SHAPE_DEFAULT_VALUES from 'vtk.js/Sources/Widgets/Widgets3D/ShapeWidget';

import {
  BehaviorCategory,
  ShapeBehavior,
} from 'vtk.js/Sources/Widgets/Widgets3D/ShapeWidget/Constants';

import { ViewTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

// ----------------------------------------------------------------------------
// Factory
// ----------------------------------------------------------------------------

function vtkRectangleWidget(publicAPI, model) {
  model.classHierarchy.push('vtkRectangleWidget');

  model.methodsToLink = [
    'activeScaleFactor',
    'activeColor',
    'useActiveColor',
    'drawBorder',
    'drawFace',
    'opacity',
  ];

  // --- Widget Requirement ---------------------------------------------------

  model.behavior = widgetBehavior;
  publicAPI.getRepresentationsForViewType = (viewType) => {
    switch (viewType) {
      case ViewTypes.DEFAULT:
      case ViewTypes.GEOMETRY:
      case ViewTypes.SLICE:
      case ViewTypes.VOLUME:
      default:
        return [
          { builder: vtkSphereHandleRepresentation, labels: ['moveHandle'] },
          {
            builder: vtkRectangleContextRepresentation,
            labels: ['rectangleHandle'],
          },
        ];
    }
  };

  // --------------------------------------------------------------------------
  // initialization
  // --------------------------------------------------------------------------

  // Default manipulator
  model.manipulator = vtkPlanePointManipulator.newInstance();
  model.widgetState = stateGenerator();
  model.shapeHandle = model.widgetState.getRectangleHandle();
  model.point1Handle = model.widgetState.getPoint1Handle();
  model.point2Handle = model.widgetState.getPoint2Handle();
  model.point1Handle.setManipulator(model.manipulator);
  model.point2Handle.setManipulator(model.manipulator);
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  modifierBehavior: {
    None: {
      [BehaviorCategory.PLACEMENT]:
        ShapeBehavior[BehaviorCategory.PLACEMENT].CLICK_AND_DRAG,
      [BehaviorCategory.POINTS]:
        ShapeBehavior[BehaviorCategory.POINTS].CORNER_TO_CORNER,
      [BehaviorCategory.RATIO]: ShapeBehavior[BehaviorCategory.RATIO].FREE,
    },
    Shift: {
      [BehaviorCategory.RATIO]: ShapeBehavior[BehaviorCategory.RATIO].FIXED,
    },
    Control: {
      [BehaviorCategory.POINTS]:
        ShapeBehavior[BehaviorCategory.POINTS].CENTER_TO_CORNER,
    },
  },
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(
    model,
    { ...SHAPE_DEFAULT_VALUES.DEFAULT_VALUES, ...DEFAULT_VALUES },
    initialValues
  );

  vtkAbstractWidgetFactory.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, ['manipulator', 'widgetState']);

  vtkRectangleWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkRectangleWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
