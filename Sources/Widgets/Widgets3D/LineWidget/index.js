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

import { updateTextPosition } from 'vtk.js/Sources/Widgets/Widgets3D/LineWidget/helper';

// ----------------------------------------------------------------------------
// Factory
// ----------------------------------------------------------------------------

const { HandleRepresentationType, HandleRepresentation } = Constants;

const shapeToRepresentation = {};

function vtkLineWidget(publicAPI, model) {
  model.classHierarchy.push('vtkLineWidget');

  // --- Widget Requirement ---------------------------------------------------

  // custom handles set in default values
  // 3D source handles
  shapeToRepresentation[
    HandleRepresentationType.SPHERE
  ] = vtkSphereHandleRepresentation;
  shapeToRepresentation[
    HandleRepresentationType.GHOST_SPHERE
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
    HandleRepresentation[0] = shapeToRepresentation[model.handle1Shape];
    if (!HandleRepresentation[0]) {
      HandleRepresentation[0] = vtkSphereHandleRepresentation;
    }
    HandleRepresentation[1] = shapeToRepresentation[model.handle2Shape];
    if (!HandleRepresentation[1]) {
      HandleRepresentation[1] = vtkSphereHandleRepresentation;
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
            builder: HandleRepresentation[0],
            labels: ['handle1'],
            initialValues: {
              /* to scale handle size when zooming/dezooming, optionnal */
              scaleInPixels: true,
              /* to detect arrow type in ArrowHandleRepresentation, mandatory */
              handleType: model.handle1Shape,
            },
          },
          {
            builder: HandleRepresentation[1],
            labels: ['handle2'],
            initialValues: {
              /* to scale handle size when zooming/dezooming, optionnal */
              scaleInPixels: true,
              /* to detect arrow type in ArrowHandleRepresentation, mandatory */
              handleType: model.handle2Shape,
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
        ];
    }
  };

  // --- Public methods -------------------------------------------------------

  publicAPI.getDistance = () => {
    const nbHandles = model.widgetState.getNbHandles();
    if (nbHandles < 2) {
      return 0;
    }
    return Math.sqrt(
      distance2BetweenPoints(
        model.widgetState.getHandle1().getOrigin(),
        model.widgetState.getHandle2().getOrigin()
      )
    );
  };

  publicAPI.setText = (text) => {
    if (model.widgetState.getText()) model.widgetState.getText().setText(text);
  };

  publicAPI.updateTextPosition = (positionOnLine) => {
    updateTextPosition(model, positionOnLine);
    model.widgetState.setPositionOnLine(positionOnLine);
  };

  publicAPI.setPositionOnLine = macro.chain(
    publicAPI.updateTextPosition,
    publicAPI.setPositionOnLine
  );

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
  handle1Shape: HandleRepresentationType.NONE,
  handle2Shape: HandleRepresentationType.NONE,
  /* Position of the text on the line where 0 is handle1 and 1 is handle2 */
  positionOnLine: 0.5,
  /**
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
    'positionOnLine',
  ]);

  vtkLineWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkLineWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
