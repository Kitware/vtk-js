import macro from 'vtk.js/Sources/macros';
import vtkPlanePointManipulator from 'vtk.js/Sources/Widgets/Manipulators/PlaneManipulator';
import vtkShapeWidget from 'vtk.js/Sources/Widgets/Widgets3D/ShapeWidget';
import vtkSphereHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/SphereHandleRepresentation';
import vtkRectangleContextRepresentation from 'vtk.js/Sources/Widgets/Representations/RectangleContextRepresentation';
import vtkSVGLandmarkRepresentation from 'vtk.js/Sources/Widgets/SVG/SVGLandmarkRepresentation';
import widgetBehavior from 'vtk.js/Sources/Widgets/Widgets3D/RectangleWidget/behavior';
import stateGenerator from 'vtk.js/Sources/Widgets/Widgets3D/RectangleWidget/state';

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
    ...model.methodsToLink,
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
          {
            builder: vtkSphereHandleRepresentation,
            labels: ['moveHandle'],
            initialValues: {
              scaleInPixels: true,
            },
          },
          {
            builder: vtkRectangleContextRepresentation,
            labels: ['rectangleHandle'],
          },
          {
            builder: vtkSVGLandmarkRepresentation,
            initialValues: {
              text: '',
            },
            labels: ['SVGtext'],
          },
        ];
    }
  };

  // --------------------------------------------------------------------------
  // initialization
  // --------------------------------------------------------------------------

  model.widgetState = stateGenerator();
  model.manipulator = vtkPlanePointManipulator.newInstance({
    useCameraNormal: true,
  });
}

// ----------------------------------------------------------------------------

function defaultValues(initialValues) {
  return {
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
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  vtkShapeWidget.extend(publicAPI, model, defaultValues(initialValues));
  macro.setGet(publicAPI, model, ['widgetState']);

  vtkRectangleWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkRectangleWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
