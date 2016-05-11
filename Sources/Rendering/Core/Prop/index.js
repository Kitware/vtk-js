import * as macro from '../../../macro';

// ----------------------------------------------------------------------------
// vtkProp methods
// ----------------------------------------------------------------------------

function prop(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkProp');

  publicAPI.getRedrawMTime = () => model.mtime;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  visibility: true,
  pickable: true,
  dragable: true,
  useBounds: true,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, initialValues = {}) {
  const model = Object.assign(initialValues, DEFAULT_VALUES);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, Object.keys(DEFAULT_VALUES));

  // Object methods
  prop(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
