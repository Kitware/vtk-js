import macro from 'vtk.js/Sources/macros';
import vtkAbstractWidgetFactory from 'vtk.js/Sources/Widgets/Core/AbstractWidgetFactory';
import vtkConvexFaceContextRepresentation from 'vtk.js/Sources/Widgets/Representations/ConvexFaceContextRepresentation';

import widgetBehavior from 'vtk.js/Sources/Widgets/Widgets3D/InteractiveOrientationWidget/behavior';
import {
  INITIAL_POINTS,
  generateState,
} from 'vtk.js/Sources/Widgets/Widgets3D/InteractiveOrientationWidget/state';

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
  model.widgetState = generateState();

  publicAPI.setBounds = (bounds) => {
    const handles = model.widgetState.getStatesWithLabel('handles');
    for (let i = 0; i < handles.length; i++) {
      const xyz = INITIAL_POINTS[i];
      const x = xyz[0] > 0 ? bounds[1] : bounds[0];
      const y = xyz[1] > 0 ? bounds[3] : bounds[2];
      const z = xyz[2] > 0 ? bounds[5] : bounds[4];
      handles[i].setOrigin(x, y, z);
    }
  };

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
              name: 'Face 1',
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
              name: 'Face 2',
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
              name: 'Face 3',
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
              name: 'Face 4',
            },
          },
          {
            builder: vtkConvexFaceContextRepresentation,
            labels: ['-++', '--+', '+-+', '+++'],
            initialValues: {
              behavior: Behavior.HANDLE,
              pickable: true,
              activeScaleFactor: 1.2,
              activeColor: 1,
              useActiveColor: true,
              name: 'Face 5',
            },
          },
          {
            builder: vtkConvexFaceContextRepresentation,
            labels: ['-+-', '++-', '+--', '---'],
            initialValues: {
              behavior: Behavior.HANDLE,
              pickable: true,
              activeScaleFactor: 1.2,
              activeColor: 1,
              useActiveColor: true,
              name: 'Face 6',
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
