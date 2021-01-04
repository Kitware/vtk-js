import Constants from 'vtk.js/Sources/Widgets/Widgets3D/LineWidget/Constants';
import { distance2BetweenPoints } from 'vtk.js/Sources/Common/Core/Math';
import macro from 'vtk.js/Sources/macro';
import stateGenerator from 'vtk.js/Sources/Widgets/Widgets3D/LineWidget/state';
import vtkAbstractWidgetFactory from 'vtk.js/Sources/Widgets/Core/AbstractWidgetFactory';
import vtkArrowHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/ArrowHandleRepresentation';
import vtkPlanePointManipulator from 'vtk.js/Sources/Widgets/Manipulators/PlaneManipulator';
import vtkSphereHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/SphereHandleRepresentation';
import vtkCircleHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/CircleHandleRepresentation';
import vtkCubeHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/CubeHandleRepresentation';
import vtkConeHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/ConeHandleRepresentation';
import vtkSVGLandmarkRepresentation from 'vtk.js/Sources/Widgets/SVG/SVGLandmarkRepresentation';
import vtkPolyLineRepresentation from 'vtk.js/Sources/Widgets/Representations/PolyLineRepresentation';
import widgetBehavior from 'vtk.js/Sources/Widgets/Widgets3D/LineWidget/behavior';
import { ViewTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

// ----------------------------------------------------------------------------
// Factory
// ----------------------------------------------------------------------------

const { HandleRepresentationType /* , HandleRepresentation */ } = Constants;

const shapeToRepresentation = {};

function vtkLineWidget(publicAPI, model) {
  model.classHierarchy.push('vtkLineWidget');

  model.handleRepresentations = [0, 0];

  // --- Widget Requirement ---------------------------------------------------

  // custom handles set in default values
  // 3D source handles
  shapeToRepresentation[
    HandleRepresentationType.SPHERE
  ] = vtkSphereHandleRepresentation;
  shapeToRepresentation[
    HandleRepresentationType.CUBE
  ] = vtkCubeHandleRepresentation;
  shapeToRepresentation[
    HandleRepresentationType.CONE
  ] = vtkConeHandleRepresentation;
  shapeToRepresentation[
    HandleRepresentationType.NONE
  ] = vtkSphereHandleRepresentation;
  // 2D source handles
  shapeToRepresentation[
    HandleRepresentationType.ARROWHEAD3
  ] = vtkArrowHandleRepresentation;
  shapeToRepresentation[
    HandleRepresentationType.ARROWHEAD4
  ] = vtkArrowHandleRepresentation;
  shapeToRepresentation[
    HandleRepresentationType.ARROWHEAD6
  ] = vtkArrowHandleRepresentation;
  shapeToRepresentation[
    HandleRepresentationType.STAR
  ] = vtkArrowHandleRepresentation;
  shapeToRepresentation[
    HandleRepresentationType.CIRCLE
  ] = vtkCircleHandleRepresentation;

  function initializeHandleRepresentations() {
    model.handleRepresentations[0] =
      shapeToRepresentation[model.handle1Shape] ||
      vtkSphereHandleRepresentation;
    model.handleRepresentations[1] =
      shapeToRepresentation[model.handle2Shape] ||
      vtkSphereHandleRepresentation;
    if (model.handle1Shape === HandleRepresentationType.NONE) {
      model.handle1Visibility = false;
    }
    if (model.handle2Shape === HandleRepresentationType.NONE) {
      model.handle2Visibility = false;
    }
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
  model.widgetState.setPositionOnLine(model.positionOnLine);
  model.widgetState.setNbHandles(0);
  initializeHandleRepresentations();

  publicAPI.getRepresentationsForViewType = (viewType) => {
    switch (viewType) {
      case ViewTypes.DEFAULT:
      case ViewTypes.GEOMETRY:
      case ViewTypes.SLICE:
      case ViewTypes.VOLUME:
      default:
        return [
          {
            builder: model.handleRepresentations[0],
            labels: ['handle1'],
            initialValues: {
              /* to scale handle size when zooming/dezooming, optional */
              scaleInPixels: true,
              /* to detect arrow type in ArrowHandleRepresentation, mandatory */
              handleType: model.handle1Shape,
              /*
               * This table sets the visibility of the handles' actors
               * 1st actor is a displayActor, which hides a rendered object on the HTML layer.
               * operating on its value allows to hide a handle to the user while still being
               * able to detect its presence, so the user can move it. 2nd actor is a normal VTK
               * actor which renders the object on the VTK scene
               */
              visibilityFlagArray: [model.handle1Visibility, true],
              faceCamera: model.handle1CameraOrientation,
            },
          },
          {
            builder: model.handleRepresentations[1],
            labels: ['handle2'],
            initialValues: {
              /* to scale handle size when zooming/dezooming, optional */
              scaleInPixels: true,
              /* to detect arrow type in ArrowHandleRepresentation, mandatory */
              handleType: model.handle2Shape,
              /*
               * This table sets the visibility of the handles' actors
               * 1st actor is a displayActor, which hides a rendered object on the HTML layer.
               * operating on its value allows to hide a handle to the user while still being
               * able to detect its presence, so the user can move it. 2nd actor is a normal VTK
               * actor which renders the object on the VTK scene
               */
              visibilityFlagArray: [model.handle2Visibility, true],
              faceCamera: model.handle2CameraOrientation,
            },
          },
          {
            builder: vtkSVGLandmarkRepresentation,
            initialValues: {
              showCircle: false,
              isVisible: false,
              fromLineWidget: true,
            },
            labels: ['SVGtext'],
          },
          {
            builder: vtkPolyLineRepresentation,
            labels: ['handle1', 'handle2', 'moveHandle'],
            initialValues: { scaleInPixels: true },
          },
          {
            builder: vtkSphereHandleRepresentation,
            labels: ['moveHandle'],
            initialValues: {
              scaleInPixels: true,
            },
          },
        ];
    }
  };

  // --- Public methods -------------------------------------------------------

  publicAPI.getDistance = () => {
    const nbHandles = model.widgetState.getNbHandles();
    if (nbHandles < 1) {
      return 0;
    }
    if (nbHandles === 1) {
      return Math.sqrt(
        distance2BetweenPoints(
          model.widgetState.getMoveHandle().getOrigin(),
          model.widgetState.getHandle2().getOrigin()
        )
      );
    }
    return Math.sqrt(
      distance2BetweenPoints(
        model.widgetState.getHandle1().getOrigin(),
        model.widgetState.getHandle2().getOrigin()
      )
    );
  };

  publicAPI.setHandleShape = (handleId, shape) => {
    model[`handle${handleId}Shape`] = shape;
    initializeHandleRepresentations();
    publicAPI.getRepresentationsForViewType(0);
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
  handle1Shape: HandleRepresentationType.ARROWHEAD6,
  handle2Shape: HandleRepresentationType.SPHERE,
  handle1Visibility: false,
  handle2Visibility: true,
  handle1CameraOrientation: true,
  handle2CameraOrientation: true,
  /* Position of the text on the line where 0 is handle1 and 1 is handle2 */
  positionOnLine: 1,
  /*
   * The initialValue variable of the state is meant to create an empty text
   * to insert the desired text when both handles are set, and avoids having
   * a default text before.
   */
  text: '',
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkAbstractWidgetFactory.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, [
    'manipulator',
    'handle1Shape',
    'handle2Shape',
    'handle1Visibility',
    'handle2Visibility',
    'handle1CameraOrientation',
    'handle2CameraOrientation',
    'positionOnLine',
  ]);

  vtkLineWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkLineWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
