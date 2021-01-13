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
import vtkSVGLandmarkRepresentation from 'vtk.js/Sources/Widgets/SVG/SVGLandmarkRepresentation';
import vtkPolyLineRepresentation from 'vtk.js/Sources/Widgets/Representations/PolyLineRepresentation';
import widgetBehavior from 'vtk.js/Sources/Widgets/Widgets3D/LineWidget/behavior';
import { ViewTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

// ----------------------------------------------------------------------------
// Factory
// ----------------------------------------------------------------------------

const { HandleRepresentationType } = Constants;

const shapeToRepresentation = {};

function vtkLineWidget(publicAPI, model) {
  model.classHierarchy.push('vtkLineWidget');
  model.widgetState = stateGenerator();
  model.behavior = widgetBehavior;
  model.handleRepresentations = [0, 0];

  model.handle1Shape = model.widgetState.getHandle1Shape();
  model.handle2Shape = model.widgetState.getHandle2Shape();
  model.handle1FaceCamera = model.widgetState.getHandle1FaceCamera();
  model.handle2FaceCamera = model.widgetState.getHandle2FaceCamera();

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
  ] = vtkArrowHandleRepresentation;
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

  model.methodsToLink = [
    'activeScaleFactor',
    'activeColor',
    'useActiveColor',
    'glyphResolution',
    'defaultScale',
  ];

  publicAPI.initializeHandleRepresentations = () => {
    model.handle1Shape = model.widgetState.getHandle1Shape();
    model.handle2Shape = model.widgetState.getHandle2Shape();
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
  };
  publicAPI.initializeHandleRepresentations();

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
              faceCamera: model.handle1FaceCamera,
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
              faceCamera: model.handle2FaceCamera,
            },
          },
          {
            builder: vtkSVGLandmarkRepresentation,
            initialValues: {
              showCircle: false,
              isVisible: false,
              fromLineWidget: true,
              text: '',
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
  isDragging: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkAbstractWidgetFactory.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, ['manipulator', 'isDragging']);

  vtkLineWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkLineWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
