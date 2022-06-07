import macro from 'vtk.js/Sources/macros';
import vtkAbstractWidgetFactory from 'vtk.js/Sources/Widgets/Core/AbstractWidgetFactory';
import vtkPlanePointManipulator from 'vtk.js/Sources/Widgets/Manipulators/PlaneManipulator';
import vtkPolyLineRepresentation from 'vtk.js/Sources/Widgets/Representations/PolyLineRepresentation';
import vtkSphereHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/SphereHandleRepresentation';
import vtkSVGLandmarkRepresentation from 'vtk.js/Sources/Widgets/SVG/SVGLandmarkRepresentation';

import widgetBehavior from 'vtk.js/Sources/Widgets/Widgets3D/PolyLineWidget/behavior';
import stateGenerator from 'vtk.js/Sources/Widgets/Widgets3D/PolyLineWidget/state';

import { ViewTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

// ----------------------------------------------------------------------------
// Factory
// ----------------------------------------------------------------------------

function vtkPolyLineWidget(publicAPI, model) {
  model.classHierarchy.push('vtkPolyLineWidget');

  const superClass = { ...publicAPI };

  // --- Widget Requirement ---------------------------------------------------

  model.methodsToLink = [
    'activeColor',
    'activeScaleFactor',
    'closePolyLine',
    'defaultScale',
    'glyphResolution',
    'lineThickness',
    'useActiveColor',
    'scaleInPixels',
  ];
  model.behavior = widgetBehavior;
  model.widgetState = stateGenerator();

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
            labels: ['handles'],
            initialValues: {
              scaleInPixels: true,
            },
          },
          {
            builder: vtkSphereHandleRepresentation,
            labels: ['moveHandle'],
            initialValues: {
              scaleInPixels: true,
            },
          },
          {
            builder: vtkSVGLandmarkRepresentation,
            initialValues: {
              textProps: {
                dx: 12,
                dy: -12,
              },
            },
            labels: ['handles'],
          },
          {
            builder: vtkPolyLineRepresentation,
            labels: ['handles', 'moveHandle'],
          },
        ];
    }
  };

  // --- Public methods -------------------------------------------------------
  publicAPI.setManipulator = (manipulator) => {
    superClass.setManipulator(manipulator);
    model.widgetState.getMoveHandle().setManipulator(manipulator);
    model.widgetState.getHandleList().forEach((handle) => {
      handle.setManipulator(manipulator);
    });
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
  publicAPI.setManipulator(
    model.manipulator ||
      vtkPlanePointManipulator.newInstance({
        useCameraFocalPoint: true,
        useCameraNormal: true,
      })
  );
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // manipulator: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkAbstractWidgetFactory.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, ['manipulator']);

  vtkPolyLineWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPolyLineWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
