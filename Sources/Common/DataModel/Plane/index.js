import * as macro from '../../../macro';

function evaluate(normal, origin, x) {
  return normal[0] * (x[0] - origin[0])
       + normal[1] * (x[1] - origin[1])
       + normal[2] * (x[2] - origin[2]);
}

// ----------------------------------------------------------------------------

export const STATIC = {
  evaluate,
};

// ----------------------------------------------------------------------------

function plane(publicAPI, model) {

}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {

};

// ----------------------------------------------------------------------------

export function extend(publicAPI, initialValues = {}) {
  const model = Object.assign(initialValues, DEFAULT_VALUES);

  // Object methods
  macro.setGet(publicAPI, model, ['bounds']);
  plane(publicAPI, model);
}

// ----------------------------------------------------------------------------

export function newInstance(initialValues = {}) {
  const model = Object.assign({}, DEFAULT_VALUES, initialValues);
  const publicAPI = {};

  // Build VTK API
  macro.obj(publicAPI, model, 'vtkPlane');
  extend(publicAPI, model);

  return Object.freeze(publicAPI);
}

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, STATIC);
