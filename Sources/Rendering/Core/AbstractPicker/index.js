import macro from 'vtk.js/Sources/macros';

// ----------------------------------------------------------------------------
// vtkAbstractPicker methods
// ----------------------------------------------------------------------------

function vtkAbstractPicker(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkAbstractPicker');

  publicAPI.initialize = () => {
    model.renderer = null;

    model.selectionPoint[0] = 0.0;
    model.selectionPoint[1] = 0.0;
    model.selectionPoint[2] = 0.0;

    model.pickPosition[0] = 0.0;
    model.pickPosition[1] = 0.0;
    model.pickPosition[2] = 0.0;
  };

  publicAPI.initializePickList = () => {
    model.pickList = [];
  };

  publicAPI.addPickList = (actor) => {
    model.pickList.push(actor);
  };

  publicAPI.deletePickList = (actor) => {
    const i = model.pickList.indexOf(actor);
    if (i !== -1) {
      model.pickList.splice(i, 1);
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  renderer: null,
  selectionPoint: [0.0, 0.0, 0.0],
  pickPosition: [0.0, 0.0, 0.0],
  pickFromList: 0,
  pickList: [],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  macro.get(publicAPI, model, ['renderer']);
  macro.getArray(publicAPI, model, ['selectionPoint', 'pickPosition']);
  macro.setGet(publicAPI, model, ['pickFromList', 'pickList']);

  vtkAbstractPicker(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkAbstractPicker');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
