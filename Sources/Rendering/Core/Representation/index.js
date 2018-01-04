import * as macro from '../../../macro';

// ----------------------------------------------------------------------------
// vtkRepresentation methods
// ----------------------------------------------------------------------------

function vtkRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkRepresentation');

  if (!model.actors) {
    model.actors = [];
  }

  publicAPI.addActor = function addActor(...actors) {
    if (actors.length) {
      model.actors = model.actors.concat(actors);
      publicAPI.modified();
    }
  };

  publicAPI.removeActor = function removeActor(...actors) {
    const size = model.actors.length;
    model.actors = model.actors.filter((a) => actors.indexOf(a) === -1);
    if (model.actors.length < size) {
      publicAPI.modified();
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['actors']);
  macro.setGet(publicAPI, model, ['input']);

  // Object methods
  vtkRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkRepresentation');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
