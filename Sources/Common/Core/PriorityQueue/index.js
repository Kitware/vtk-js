import macro from 'vtk.js/Sources/macros';

// ----------------------------------------------------------------------------
// vtkPriorityQueue methods
// ----------------------------------------------------------------------------

function vtkPriorityQueue(publicAPI, model) {
  // Set our classname
  model.classHierarchy.push('vtkPriorityQueue');

  publicAPI.push = (priority, element) => {
    // naive algo
    const i = model.elements.findIndex((e) => e.priority > priority);

    model.elements.splice(i, 0, { priority, element });
  };

  publicAPI.pop = () => {
    if (model.elements.length > 0) {
      return model.elements.shift().element;
    }

    return null;
  };

  publicAPI.deleteById = (id) => {
    model.elements = model.elements.filter(({ element }) => element.id !== id);
  };

  publicAPI.length = () => model.elements.length;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  elements: [],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  vtkPriorityQueue(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPriorityQueue');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
