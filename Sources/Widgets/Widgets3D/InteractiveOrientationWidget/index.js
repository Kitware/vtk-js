import macro from 'vtk.js/Sources/macro';
import vtkAbstractWidgetFactory from 'vtk.js/Sources/Widgets/Core/AbstractWidgetFactory';
import vtkConvexFaceContextRepresentation from 'vtk.js/Sources/Widgets/Representations/ConvexFaceContextRepresentation';

import widgetBehavior from 'vtk.js/Sources/Widgets/Widgets3D/InteractiveOrientationWidget/behavior';
import stateGenerator from 'vtk.js/Sources/Widgets/Widgets3D/InteractiveOrientationWidget/state';

import { Behavior } from 'vtk.js/Sources/Widgets/Representations/WidgetRepresentation/Constants';
import { ViewTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

// ----------------------------------------------------------------------------
// Factory
// ----------------------------------------------------------------------------

function vtkInteractiveOrientationWidget(publicAPI, model) {
  model.classHierarchy.push('vtkInteractiveOrientationWidget');

  // --- Widget Requirement ---------------------------------------------------

  model.methodsToLink = [
    'closePolyLine',
    'activeScaleFactor',
    'activeColor',
    'useActiveColor',
    'glyphResolution',
    'defaultScale',
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
            builder: vtkConvexFaceContextRepresentation,
            labels: ['---', '--+', '-++', '-+-'],
            initialValues: {
              behavior: Behavior.HANDLE,
              pickable: true,
              activeScaleFactor: 1.2,
              activeColor: 1,
              useActiveColor: true,
            },
          },
          {
            builder: vtkConvexFaceContextRepresentation,
            labels: ['---', '+--', '+-+', '--+'],
            initialValues: {
              behavior: Behavior.HANDLE,
              pickable: true,
              activeScaleFactor: 1.2,
              activeColor: 1,
              useActiveColor: true,
            },
          },
          {
            builder: vtkConvexFaceContextRepresentation,
            labels: ['+--', '++-', '+++', '+-+'],
            initialValues: {
              behavior: Behavior.HANDLE,
              pickable: true,
              activeScaleFactor: 1.2,
              activeColor: 1,
              useActiveColor: true,
            },
          },
          {
            builder: vtkConvexFaceContextRepresentation,
            labels: ['++-', '-+-', '-++', '+++'],
            initialValues: {
              behavior: Behavior.HANDLE,
              pickable: true,
              activeScaleFactor: 1.2,
              activeColor: 1,
              useActiveColor: true,
            },
          },
          {
            builder: vtkConvexFaceContextRepresentation,
            labels: ['--+', '+-+', '+++', '-++'],
            initialValues: {
              behavior: Behavior.HANDLE,
              pickable: true,
              activeScaleFactor: 1.2,
              activeColor: 1,
              useActiveColor: true,
            },
          },
          {
            builder: vtkConvexFaceContextRepresentation,
            labels: ['---', '+--', '++-', '-+-'],
            initialValues: {
              behavior: Behavior.HANDLE,
              pickable: true,
              activeScaleFactor: 1.2,
              activeColor: 1,
              useActiveColor: true,
            },
          },
        ];
    }
  };
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkAbstractWidgetFactory.extend(publicAPI, model, initialValues);

  vtkInteractiveOrientationWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkInteractiveOrientationWidget'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
