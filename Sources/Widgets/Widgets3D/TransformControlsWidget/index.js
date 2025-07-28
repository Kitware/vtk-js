import { mat3 } from 'gl-matrix';
import macro from 'vtk.js/Sources/macros';
import vtkAbstractWidgetFactory from 'vtk.js/Sources/Widgets/Core/AbstractWidgetFactory';

import vtkTranslateTransformHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/TranslateTransformHandleRepresentation';
import vtkScaleTransformHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/ScaleTransformHandleRepresentation';
import vtkRotateTransformHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/RotateTransformHandleRepresentation';

import {
  TRANSLATE_HANDLE_RADIUS,
  SCALE_HANDLE_RADIUS,
  SCALE_HANDLE_CUBE_SIDE_LENGTH,
  SCALE_HANDLE_PIXEL_SCALE,
  TransformMode,
} from './constants';

import widgetBehavior from './behavior';
import stateGenerator from './state';

function updateHandleTransforms(widgetState) {
  const transformState = widgetState.getTransform();

  const sx = widgetState.getScaleHandleX();
  const sy = widgetState.getScaleHandleY();
  const sz = widgetState.getScaleHandleZ();

  const hx = widgetState.getRotateHandleX();
  const hy = widgetState.getRotateHandleY();
  const hz = widgetState.getRotateHandleZ();

  // translation
  widgetState.getStatesWithLabel('handles').forEach((state) => {
    state.setOrigin(transformState.getTranslation());
  });

  // rotation
  const m3 = mat3.create();
  mat3.fromQuat(m3, transformState.getRotation());

  [sx, hx].forEach((state) => {
    state.setDirection(m3.slice(0, 3));
    state.setUp(m3.slice(3, 6).map((c) => -c));
    state.setRight(m3.slice(6, 9));
  });

  [sy, hy].forEach((state) => {
    state.setDirection(m3.slice(3, 6));
    state.setUp(m3.slice(6, 9));
    state.setRight(m3.slice(0, 3));
  });

  [sz, hz].forEach((state) => {
    state.setDirection(m3.slice(6, 9));
    state.setUp(m3.slice(3, 6));
    state.setRight(m3.slice(0, 3));
  });
}

// ----------------------------------------------------------------------------
// Factory
// ----------------------------------------------------------------------------

function vtkTransformControlsWidget(publicAPI, model) {
  model.classHierarchy.push('vtkTransformControlsWidget');

  // --- Widget Requirement ---------------------------------------------------

  model.behavior = widgetBehavior;
  model.widgetState = stateGenerator();

  model.methodsToLink = [
    'scaleInPixels',
    'activeScaleFactor',
    'useActiveColor',
    'activeColor',
  ];

  publicAPI.getRepresentationsForViewType = (viewType) => {
    switch (viewType) {
      default:
        return [
          {
            builder: vtkTranslateTransformHandleRepresentation,
            labels: ['translateHandles'],
            initialValues: {
              radius: TRANSLATE_HANDLE_RADIUS,
              glyphResolution: 12,
              coneSource: {
                radius: 8,
                height: 0.05,
                direction: [0, 1, 0],
              },
            },
          },
          {
            builder: vtkScaleTransformHandleRepresentation,
            labels: ['scaleHandles'],
            initialValues: {
              radius: SCALE_HANDLE_RADIUS,
              glyphResolution: 12,
              cubeSource: {
                xLength: SCALE_HANDLE_CUBE_SIDE_LENGTH,
                yLength:
                  SCALE_HANDLE_CUBE_SIDE_LENGTH / SCALE_HANDLE_PIXEL_SCALE,
                zLength: SCALE_HANDLE_CUBE_SIDE_LENGTH,
              },
            },
          },
          {
            builder: vtkRotateTransformHandleRepresentation,
            labels: ['rotateHandles'],
          },
        ];
    }
  };

  publicAPI.updateHandleVisibility = () => {
    model.widgetState
      .getStatesWithLabel('translateHandles')
      .forEach((state) => {
        state.setVisible(model.mode === 'translate');
      });
    model.widgetState.getStatesWithLabel('scaleHandles').forEach((state) => {
      state.setVisible(model.mode === 'scale');
    });
    model.widgetState.getStatesWithLabel('rotateHandles').forEach((state) => {
      state.setVisible(model.mode === 'rotate');
    });
  };

  model._onModeChanged = () => {
    publicAPI.updateHandleVisibility();
  };

  // --- Widget Requirement ---------------------------------------------------

  // sync translation/scale/rotation states to the handle states
  const transformSubscription = model.widgetState
    .getTransform()
    .onModified((state) => {
      updateHandleTransforms(model.widgetState);
    });

  publicAPI.delete = macro.chain(publicAPI.delete, () => {
    transformSubscription.unsubscribe();
  });

  updateHandleTransforms(model.widgetState);
  publicAPI.updateHandleVisibility();
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  mode: TransformMode.TRANSLATE,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkAbstractWidgetFactory.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['mode']);
  macro.get(publicAPI, model, ['lineManipulator', 'rotateManipulator']);
  vtkTransformControlsWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkTransformControlsWidget'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend, TransformMode };
