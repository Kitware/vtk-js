import macro from 'vtk.js/Sources/macros';
import vtkShapeWidget from 'vtk.js/Sources/Widgets/Widgets3D/ShapeWidget';
import vtkPlanePointManipulator from 'vtk.js/Sources/Widgets/Manipulators/PlaneManipulator';
import vtkSphereHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/SphereHandleRepresentation';
import vtkCircleContextRepresentation from 'vtk.js/Sources/Widgets/Representations/CircleContextRepresentation';
import widgetBehavior from 'vtk.js/Sources/Widgets/Widgets3D/EllipseWidget/behavior';
import stateGenerator from 'vtk.js/Sources/Widgets/Widgets3D/EllipseWidget/state';

import {
  BehaviorCategory,
  ShapeBehavior,
} from 'vtk.js/Sources/Widgets/Widgets3D/ShapeWidget/Constants';

import { ViewTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

// ----------------------------------------------------------------------------
// Factory
// ----------------------------------------------------------------------------

function vtkEllipseWidget(publicAPI, model) {
  model.classHierarchy.push('vtkEllipseWidget');

  // --- Widget Requirement ---------------------------------------------------

  model.methodsToLink = [
    'activeScaleFactor',
    'activeColor',
    'useActiveColor',
    'glyphResolution',
    'defaultScale',
    'drawBorder',
    'drawFace',
    'opacity',
  ];

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
            builder: vtkCircleContextRepresentation,
            labels: ['ellipseHandle'],
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
}

// ----------------------------------------------------------------------------

function defaultValues(initialValues) {
  return {
    modifierBehavior: {
      None: {
        [BehaviorCategory.PLACEMENT]:
          ShapeBehavior[BehaviorCategory.PLACEMENT].CLICK_AND_DRAG,
        [BehaviorCategory.POINTS]:
          ShapeBehavior[BehaviorCategory.POINTS].CENTER_TO_CORNER,
        [BehaviorCategory.RATIO]: ShapeBehavior[BehaviorCategory.RATIO].FREE,
      },
      Shift: {
        [BehaviorCategory.RATIO]: ShapeBehavior[BehaviorCategory.RATIO].FIXED,
      },
      Control: {
        [BehaviorCategory.POINTS]:
          ShapeBehavior[BehaviorCategory.POINTS].CORNER_TO_CORNER,
      },
    },
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  vtkShapeWidget.extend(publicAPI, model, defaultValues(initialValues));
  macro.setGet(publicAPI, model, ['manipulator', 'widgetState']);

  vtkEllipseWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkEllipseWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
