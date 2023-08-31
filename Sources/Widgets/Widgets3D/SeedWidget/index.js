import vtkAbstractWidgetFactory from 'vtk.js/Sources/Widgets/Core/AbstractWidgetFactory';
import vtkCubeHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/CubeHandleRepresentation';
import macro from 'vtk.js/Sources/macros';

import widgetBehavior from './behavior';
import stateGenerator from './state';

function vtkSeedWidget(publicAPI, model) {
  model.classHierarchy.push('vtkSeedWidget');

  const superClass = { ...publicAPI };

  model.methodsToLink = ['scaleInPixels'];

  publicAPI.getRepresentationsForViewType = (viewType) => [
    {
      builder: vtkCubeHandleRepresentation,
      labels: ['moveHandle'],
      initialValues: {
        useActiveColor: false,
      },
    },
  ];

  publicAPI.setManipulator = (manipulator) => {
    superClass.setManipulator(manipulator);
    model.widgetState.getMoveHandle().setManipulator(manipulator);
  };
}

const defaultValues = (initialValues) => ({
  behavior: widgetBehavior,
  widgetState: stateGenerator(),
  ...initialValues,
});

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, defaultValues(initialValues));
  vtkAbstractWidgetFactory.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, ['manipulator', 'widgetState']);
  vtkSeedWidget(publicAPI, model);
}

export const newInstance = macro.newInstance(extend, 'vtkSeedWidget');

export default { newInstance, extend };
