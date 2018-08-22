import macro from 'vtk.js/Sources/macro';

// ----------------------------------------------------------------------------

function vtkHandleWidget(publicAPI, model) {
  model.classHierarchy.push('vtkHandleWidget');

  let subscription = null;

  // --------------------------------------------------------------------------

  publicAPI.update = () => {
    if (model.widgetState) {
      const [x, y, z] = model.manipulator.getWorldCoordsByReference();
      model.widgetState
        .getListForLabel('all')
        .forEach((state) => state.setPosition(x, y, z));
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.setManipulator = (manipulator) => {
    if (model.manipulator !== manipulator || !subscription) {
      if (subscription) {
        subscription.unsubscribe();
        subscription = null;
      }

      model.manipulator = manipulator;

      if (manipulator) {
        subscription = manipulator.onModified(publicAPI.update);
      }
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.delete = macro.chain(publicAPI.delete, () =>
    subscription.unsubscribe()
  );

  // --------------------------------------------------------------------------

  publicAPI.setManipulator(model.manipulator);
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  widgetState: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['widgetState']);
  macro.setGetArray(publicAPI, model, ['displayPosition'], 2);
  macro.setGetArray(publicAPI, model, ['planeNormal', 'planePoint'], 3);

  vtkHandleWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkHandleWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
