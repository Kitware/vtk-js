import macro from 'vtk.js/Sources/macro';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';

function vtkBoundsMixin(publicAPI, model) {
  const sourceBounds = [];
  const bbox = vtkBoundingBox.newInstance();

  publicAPI.containsPoint = (x, y, z) => {
    if (Array.isArray(x)) {
      return bbox.containsPoint(x[0], x[1], x[2]);
    }
    return bbox.containsPoint(x, y, z);
  };

  publicAPI.placeWidget = (bounds) => {
    model.bounds = [];
    for (let i = 0; i < 6; i++) {
      sourceBounds[i] = bounds[i];
      model.bounds[i] = bounds[i] * model.placeFactor;
    }
    bbox.setBounds(model.bounds);
    publicAPI.invokeBoundsChange(model.bounds);
    publicAPI.modified();
  };

  publicAPI.setPlaceFactor = (factor) => {
    if (model.placeFactor !== factor) {
      model.placeFactor = factor;
      model.bounds = [];
      for (let i = 0; i < 6; i++) {
        model.bounds[i] = sourceBounds[i] * model.placeFactor;
      }
      bbox.setBounds(model.bounds);
      publicAPI.invokeBoundsChange(model.bounds);
      publicAPI.modified();
    }
  };
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  bounds: [-1, 1, -1, 1, -1, 1],
  placeFactor: 1,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.setGetArray(publicAPI, model, ['bounds'], 6);
  macro.get(publicAPI, model, ['placeFactor']);
  macro.event(publicAPI, model, 'BoundsChange');

  model.bounds = model.bounds.slice();
  vtkBoundsMixin(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend };
