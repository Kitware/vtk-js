import { distance2BetweenPoints } from 'vtk.js/Sources/Common/Core/Math';
import macro from 'vtk.js/Sources/macros';
import stateGenerator from 'vtk.js/Sources/Widgets/Widgets3D/LineWidget/state';
import vtkAbstractWidgetFactory from 'vtk.js/Sources/Widgets/Core/AbstractWidgetFactory';
import vtkArrowHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/ArrowHandleRepresentation';
import vtkPlanePointManipulator from 'vtk.js/Sources/Widgets/Manipulators/PlaneManipulator';
import vtkSVGLandmarkRepresentation from 'vtk.js/Sources/Widgets/SVG/SVGLandmarkRepresentation';
import vtkPolyLineRepresentation from 'vtk.js/Sources/Widgets/Representations/PolyLineRepresentation';
import widgetBehavior from 'vtk.js/Sources/Widgets/Widgets3D/LineWidget/behavior';
import { Behavior } from 'vtk.js/Sources/Widgets/Representations/WidgetRepresentation/Constants';
import { ViewTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';
import {
  getPoint,
  updateTextPosition,
} from 'vtk.js/Sources/Widgets/Widgets3D/LineWidget/helpers';
// ----------------------------------------------------------------------------
// Factory
// ----------------------------------------------------------------------------

function vtkLineWidget(publicAPI, model) {
  model.classHierarchy.push('vtkLineWidget');

  const superClass = { ...publicAPI };

  model.widgetState = stateGenerator();
  model.behavior = widgetBehavior;

  // --- Widget Requirement ---------------------------------------------------

  model.methodsToLink = [
    'activeScaleFactor',
    'activeColor',
    'useActiveColor',
    'glyphResolution',
    'defaultScale',
  ];

  publicAPI.getRepresentationsForViewType = (viewType) => {
    switch (viewType) {
      case ViewTypes.DEFAULT:
      case ViewTypes.GEOMETRY:
      case ViewTypes.SLICE:
      case ViewTypes.VOLUME:
      default:
        return [
          {
            builder: vtkArrowHandleRepresentation,
            labels: ['handle1'],
            initialValues: {
              /* to scale handle size when zooming/dezooming, optional */
              scaleInPixels: true,
              /*
               * This table sets the visibility of the handles' actors
               * 1st actor is a displayActor, which hides a rendered object on the HTML layer.
               * operating on its value allows to hide a handle to the user while still being
               * able to detect its presence, so the user can move it. 2nd actor is a classic VTK
               * actor which renders the object on the VTK scene
               */
              visibilityFlagArray: [false, false],
              coincidentTopologyParameters: {
                Point: {
                  factor: -1.0,
                  offset: -1.0,
                },
                Line: {
                  factor: -1.0,
                  offset: -1.0,
                },
                Polygon: {
                  factor: -3.0,
                  offset: -3.0,
                },
              },
            },
          },
          {
            builder: vtkArrowHandleRepresentation,
            labels: ['handle2'],
            initialValues: {
              /* to scale handle size when zooming/dezooming, optional */
              scaleInPixels: true,
              /*
               * This table sets the visibility of the handles' actors
               * 1st actor is a displayActor, which hides a rendered object on the HTML layer.
               * operating on its value allows to hide a handle to the user while still being
               * able to detect its presence, so the user can move it. 2nd actor is a classic VTK
               * actor which renders the object on the VTK scene
               */
              visibilityFlagArray: [false, false],
              coincidentTopologyParameters: {
                Point: {
                  factor: -1.0,
                  offset: -1.0,
                },
                Line: {
                  factor: -1.0,
                  offset: -1.0,
                },
                Polygon: {
                  factor: -3.0,
                  offset: -3.0,
                },
              },
            },
          },
          {
            builder: vtkArrowHandleRepresentation,
            labels: ['moveHandle'],
            initialValues: {
              scaleInPixels: true,
              visibilityFlagArray: [false, false],
              coincidentTopologyParameters: {
                Point: {
                  factor: -1.0,
                  offset: -1.0,
                },
                Line: {
                  factor: -1.0,
                  offset: -1.0,
                },
                Polygon: {
                  factor: -3.0,
                  offset: -3.0,
                },
              },
            },
          },
          {
            builder: vtkSVGLandmarkRepresentation,
            initialValues: {
              text: '',
              textProps: {
                dx: 12,
                dy: -12,
              },
            },
            labels: ['SVGtext'],
          },
          {
            builder: vtkPolyLineRepresentation,
            labels: ['handle1', 'handle2', 'moveHandle'],
            initialValues: {
              behavior: Behavior.HANDLE,
              pickable: true,
            },
          },
        ];
    }
  };

  // --- Public methods -------------------------------------------------------

  publicAPI.getDistance = () => {
    const p1 = getPoint(0, model.widgetState);
    const p2 = getPoint(1, model.widgetState);
    return p1 && p2 ? Math.sqrt(distance2BetweenPoints(p1, p2)) : 0;
  };

  publicAPI.setManipulator = (manipulator) => {
    superClass.setManipulator(manipulator);
    model.widgetState.getMoveHandle().setManipulator(manipulator);
    model.widgetState.getHandle1().setManipulator(manipulator);
    model.widgetState.getHandle2().setManipulator(manipulator);
  };

  // --------------------------------------------------------------------------
  // initialization
  // --------------------------------------------------------------------------

  /**
   * TBD: Why setting the move handle ?
   */
  model.widgetState.onBoundsChange((bounds) => {
    const center = [
      (bounds[0] + bounds[1]) * 0.5,
      (bounds[2] + bounds[3]) * 0.5,
      (bounds[4] + bounds[5]) * 0.5,
    ];
    model.widgetState.getMoveHandle().setOrigin(center);
  });

  model.widgetState.getPositionOnLine().onModified(() => {
    updateTextPosition(model);
  });

  // Default manipulator
  publicAPI.setManipulator(
    model.manipulator ||
      vtkPlanePointManipulator.newInstance({ useCameraNormal: true })
  );
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // manipulator: null,
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
