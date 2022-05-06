import macro from 'vtk.js/Sources/macros';
import vtkAbstractWidgetFactory from 'vtk.js/Sources/Widgets/Core/AbstractWidgetFactory';
import vtkPlanePointManipulator from 'vtk.js/Sources/Widgets/Manipulators/PlaneManipulator';
import vtkSplineContextRepresentation from 'vtk.js/Sources/Widgets/Representations/SplineContextRepresentation';
import vtkSphereHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/SphereHandleRepresentation';

import widgetBehavior from 'vtk.js/Sources/Widgets/Widgets3D/SplineWidget/behavior';
import stateGenerator from 'vtk.js/Sources/Widgets/Widgets3D/SplineWidget/state';

import { ViewTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

// ----------------------------------------------------------------------------
// Factory
// ----------------------------------------------------------------------------

function vtkSplineWidget(publicAPI, model) {
  model.classHierarchy.push('vtkSplineWidget');

  const superClass = { ...publicAPI };

  // --- Widget Requirement ---------------------------------------------------

  model.methodsToLink = [
    'boundaryCondition',
    'close',
    'outputBorder',
    'fill',
    'borderColor',
    'errorBorderColor',
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
            labels: ['handles', 'moveHandle'],
            initialValues: {
              scaleInPixels: true,
            },
          },
          {
            builder: vtkSplineContextRepresentation,
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

  // Default manipulator
  publicAPI.setManipulator(
    model.manipulator ||
      model.manipulator ||
      vtkPlanePointManipulator.newInstance({ useCameraNormal: true })
  );
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // manipulator: null,
  freehandMinDistance: 0.1,
  allowFreehand: true,
  resolution: 32, // propagates to SplineContextRepresentation
  defaultCursor: 'pointer',
  handleSizeInPixels: 10, // propagates to SplineContextRepresentation
  resetAfterPointPlacement: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkAbstractWidgetFactory.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, [
    'manipulator',
    'freehandMinDistance',
    'allowFreehand',
    'resolution',
    'defaultCursor',
    'handleSizeInPixels',
    'resetAfterPointPlacement',
  ]);

  vtkSplineWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkSplineWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
