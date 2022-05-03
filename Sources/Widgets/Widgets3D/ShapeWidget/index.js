import macro from 'vtk.js/Sources/macros';
import vtkAbstractWidgetFactory from 'vtk.js/Sources/Widgets/Core/AbstractWidgetFactory';
import {
  BehaviorCategory,
  ShapeBehavior,
} from 'vtk.js/Sources/Widgets/Widgets3D/ShapeWidget/Constants';

function vtkShapeWidget(publicAPI, model) {
  model.classHierarchy.push('vtkShapeWidget');

  const superClass = { ...publicAPI };

  model.methodsToLink = ['scaleInPixels', 'textProps', 'fontProperties'];

  publicAPI.setManipulator = (manipulator) => {
    superClass.setManipulator(manipulator);
    model.widgetState
      .getStatesWithLabel('moveHandle')
      .forEach((handle) => handle.setManipulator(manipulator));
  };
}

function defaultValues(initialValues) {
  return {
    // manipulator: null,
    modifierBehavior: {
      None: {
        [BehaviorCategory.PLACEMENT]:
          ShapeBehavior[BehaviorCategory.PLACEMENT].CLICK_AND_DRAG,
        [BehaviorCategory.POINTS]:
          ShapeBehavior[BehaviorCategory.POINTS].CORNER_TO_CORNER,
        [BehaviorCategory.RATIO]: ShapeBehavior[BehaviorCategory.RATIO].FREE,
      },
    },
    resetAfterPointPlacement: false,
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, defaultValues(initialValues));

  vtkAbstractWidgetFactory.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, [
    'manipulator',
    'modifierBehavior',
    'resetAfterPointPlacement',
  ]);

  vtkShapeWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkShapeWidget');

export default { newInstance, extend };
