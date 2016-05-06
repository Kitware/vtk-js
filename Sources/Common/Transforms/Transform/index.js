import * as macro from '../../../macro';

// FIXME need to implement all the transforms...
// FIXME what about gl-matrix?

// ----------------------------------------------------------------------------
// Transform methods
// ----------------------------------------------------------------------------

function transform(publicAPI, model) {
  function update() {
    if (model.deleted) {
      return;
    }
  }

  // Expose methods
  publicAPI.update = update;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
};

// ----------------------------------------------------------------------------

function newInstance(initialValues = {}) {
  const model = Object.assign({}, DEFAULT_VALUES, initialValues);
  const publicAPI = {};

  // Build VTK API
  macro.obj(publicAPI, model);

  // Object methods
  transform(publicAPI, model);

  return Object.freeze(publicAPI);
}

// ----------------------------------------------------------------------------

export default { newInstance };
