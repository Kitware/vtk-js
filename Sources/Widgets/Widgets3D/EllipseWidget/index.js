import macro from 'vtk.js/Sources/macros';
import vtkCircleContextRepresentation from 'vtk.js/Sources/Widgets/Representations/CircleContextRepresentation';
import vtkPlanePointManipulator from 'vtk.js/Sources/Widgets/Manipulators/PlaneManipulator';
import vtkShapeWidget from 'vtk.js/Sources/Widgets/Widgets3D/ShapeWidget';
import vtkSphereHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/SphereHandleRepresentation';
import vtkSVGLandmarkRepresentation from 'vtk.js/Sources/Widgets/SVG/SVGLandmarkRepresentation';
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
    ...model.methodsToLink,
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
          {
            builder: vtkSphereHandleRepresentation,
            labels: ['moveHandle'],
            initialValues: {
              scaleInPixels: true,
            },
          },
          {
            builder: vtkCircleContextRepresentation,
            labels: ['ellipseHandle'],
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
  publicAPI.setManipulator(
    model.manipulator ||
      vtkPlanePointManipulator.newInstance({ useCameraNormal: true })
  );
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
  macro.setGet(publicAPI, model, ['widgetState']);

  vtkEllipseWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkEllipseWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
