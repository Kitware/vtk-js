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

const { handleRepresentationType, handleRepresentation } = Constants;

const shapeToRepresentation = {};

function vtkLineWidget(publicAPI, model) {
  model.classHierarchy.push('vtkLineWidget');

  // --- Widget Requirement ---------------------------------------------------

  // custom handles set in default values
  // 3D source handles
  shapeToRepresentation[
    handleRepresentationType.SPHERE
  ] = vtkSphereHandleRepresentation;
  shapeToRepresentation[
    handleRepresentationType.CUBE
  ] = vtkCubeHandleRepresentation;
  shapeToRepresentation[
    handleRepresentationType.CONE
  ] = vtkConeHandleRepresentation;
  shapeToRepresentation[
    handleRepresentationType.NONE
  ] = vtkSphereHandleRepresentation;
  // 2D source handles
  shapeToRepresentation[
    handleRepresentationType.ARROWHEAD3
  ] = vtkArrowHandleRepresentation;
  shapeToRepresentation[
    handleRepresentationType.ARROWHEAD4
  ] = vtkArrowHandleRepresentation;
  shapeToRepresentation[
    handleRepresentationType.ARROWHEAD6
  ] = vtkArrowHandleRepresentation;
  shapeToRepresentation[
    handleRepresentationType.STAR
  ] = vtkArrowHandleRepresentation;
  shapeToRepresentation[
    handleRepresentationType.CIRCLE
  ] = vtkCircleHandleRepresentation;

  function initializeHandleRepresentations() {
    handleRepresentation[0] = shapeToRepresentation[model.handle1Shape];
    if (!handleRepresentation[0]) {
      handleRepresentation[0] = vtkSphereHandleRepresentation;
    }
    handleRepresentation[1] = shapeToRepresentation[model.handle2Shape];
    if (!handleRepresentation[1]) {
      handleRepresentation[1] = vtkSphereHandleRepresentation;
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
            builder: handleRepresentation[0],
            labels: ['handle1'],
            initialValues: {
              scaleInPixels: true, // for scaling handles, optionnal
              handleType: model.handle1Shape, // to detect arrow type in ArrowHandleRepresentation, mandatory
            },
          },
          {
            builder: handleRepresentation[1],
            labels: ['handle2'],
            initialValues: {
              scaleInPixels: true, // for scaling handles, optionnal
              handleType: model.handle2Shape, // to detect arrow type in ArrowHandleRepresentation, mandatory
              visible: false,
            },
          },
          {
            builder: vtkSVGLandmarkRepresentation,
            initialValues: {
              visibleCircle: true,
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
    const nbHandles =
      model.widgetState.getHandle1List().length +
      model.widgetState.getHandle2List().length;
    if (nbHandles !== 2) {
      return 0;
    }
    return Math.sqrt(
      distance2BetweenPoints(
        model.widgetState.getHandle1List()[0].getOrigin(),
        model.widgetState.getHandle2List()[0].getOrigin()
      )
    );
  };

  publicAPI.updateTextValue = (text) => {
    if (typeof model.widgetState.getTextList()[0] !== 'undefined')
      model.widgetState.getTextList()[0].setText(text);
  };

  publicAPI.updateTextProps = (input, prop) => {
    if (prop === 'linePos') publicAPI.setLinePos(input / 100);
		console.log("essayons de faire passer la data dans le state");
//		model.setResetBvForPos(true);
		updateTextPosition(model, publicAPI.getLinePos());

	//	model.setResetBvForPos(false);
		//publicAPI.updateHandleFromUI();
		model.behavior = widgetBehavior;
		console.log("allo ca marche plus? " + model.linePos);
  };

  publicAPI.updateHandleFromUI = (input, handleId) => {
    if (handleId === 1) {
      model.handle1Shape = input;
    } else if (handleId === 2) {
      model.handle2Shape = input;
    }
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
  handle1Shape: handleRepresentationType.ARROWHEAD4,
  handle2Shape: handleRepresentationType.ARROWHEAD4,
  linePos: 0.5,
	resetBvForPos: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkAbstractWidgetFactory.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, [
    'manipulator',
    'handle1Shape',
    'handle2Shape',
    'linePos',
	//	'resetBvForPos',
  ]);
  vtkLineWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkLineWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
