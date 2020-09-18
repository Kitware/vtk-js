import macro from 'vtk.js/Sources/macro';
import vtkAbstractWidgetFactory from 'vtk.js/Sources/Widgets/Core/AbstractWidgetFactory';
import vtkPlanePointManipulator from 'vtk.js/Sources/Widgets/Manipulators/PlaneManipulator';
// import vtkLineHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/LineHandleRepresentation';
import vtkSphereHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/SphereHandleRepresentation';
import vtkCubeHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/CubeHandleRepresentation';
import vtkConeHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/ConeHandleRepresentation';
import { distance2BetweenPoints } from 'vtk.js/Sources/Common/Core/Math';
import widgetBehavior from 'vtk.js/Sources/Widgets/Widgets3D/LineWidget/behavior';
import stateGenerator from 'vtk.js/Sources/Widgets/Widgets3D/LineWidget/state';
import { ViewTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';
import vtkSVGCustomLandmarkRepresentation from 'vtk.js/Sources/Widgets/SVG/SVGCustomLandmarkRepresentation';
import vtkPolyLineRepresentation from 'vtk.js/Sources/Widgets/Representations/PolyLineRepresentation';
// ----------------------------------------------------------------------------
// Factory
// ----------------------------------------------------------------------------

function vtkLineWidget(publicAPI, model) {
  model.classHierarchy.push('vtkLineWidget');

  // --- Widget Requirement ---------------------------------------------------

  // custom handles set in default values

  const handleRepresentation = [0, 0, 0];
  function detectHandleShape() {
    switch (model.shapeHandle1) {
      case 'sphere':
        handleRepresentation[0] = vtkSphereHandleRepresentation;
        break;
      case 'cube':
        handleRepresentation[0] = vtkCubeHandleRepresentation;
        break;
      case 'cone':
        handleRepresentation[0] = vtkConeHandleRepresentation;
        break;
      default:
        handleRepresentation[0] = vtkSphereHandleRepresentation;
        break;
    }
    switch (model.shapeHandle2) {
      case 'sphere':
        handleRepresentation[1] = vtkSphereHandleRepresentation;
        break;
      case 'cube':
        handleRepresentation[1] = vtkCubeHandleRepresentation;
        break;
      case 'cone':
        handleRepresentation[1] = vtkConeHandleRepresentation;
        break;
      default:
        handleRepresentation[1] = vtkSphereHandleRepresentation;
        break;
    }
    handleRepresentation[2] = vtkSVGCustomLandmarkRepresentation;
  }

  model.methodsToLink = [
    'activeScaleFactor',
    'activeColor',
    'useActiveColor',
    'glyphResolution',
    'defaultScale',
  ];
  model.behavior = widgetBehavior;
  model.widgetState = stateGenerator();
  detectHandleShape();

  publicAPI.getRepresentationsForViewType = (viewType) => {
    switch (viewType) {
      case ViewTypes.DEFAULT:
      case ViewTypes.GEOMETRY:
      case ViewTypes.SLICE:
      case ViewTypes.VOLUME:
      default:
        return [
          {
            builder: handleRepresentation[0],
            labels: ['handle1'],
            initialValues: { scaleInPixels: true },
          },
          {
            builder: handleRepresentation[1],
            labels: ['handle2'],
            initialValues: { scaleInPixels: true },
          },
          { builder: handleRepresentation[2], labels: ['text'] },
          //    {
          //     builder: vtkLineHandleRepresentation,
          //    labels: ['handle1', 'handle2', 'moveHandle'],
          //  initialValues: { scaleInPixels: true },
          // },
          {
            builder: vtkPolyLineRepresentation,
            labels: ['handle1', 'handle2', 'moveHandle'],
            initialValues: { scaleInPixels: true },
          },
        ];
    }
  };

  // --- Public methods -------------------------------------------------------

  publicAPI.getDistance = () => {
    const handles =
      model.widgetState.getHandle1List() + model.widgetState.getHandle2List();
    if (handles.length !== 2) {
      return 0;
    }
    return Math.sqrt(
      distance2BetweenPoints(handles[0].getOrigin(), handles[1].getOrigin())
    );
  };

  // --------------------------------------------------------------------------
  // initialization
  // --------------------------------------------------------------------------

  model.widgetState.onBoundsChange((bounds) => {
    const center = [
      (bounds[0] + bounds[1]) * 0.5,
      (bounds[2] + bounds[3]) * 0.5,
      (bounds[4] + bounds[5]) * 0.5,
    ];
    model.widgetState.getMoveHandle().setOrigin(center);
  });

  // Default manipulator
  model.manipulator = vtkPlanePointManipulator.newInstance();
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // manipulator: null,
  shapeHandle1: 'cone',
  shapeHandle2: 'cone',
  textInput: 'DEFAULT_VALUES textInput',
  offset: 0.2,
  offsetDir: 2,
  lineDir: 0.1,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkAbstractWidgetFactory.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, [
    'manipulator',
    'shapeHandle1',
    'shapeHandle2',
    'textInput',
  ]);
  vtkLineWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkLineWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
