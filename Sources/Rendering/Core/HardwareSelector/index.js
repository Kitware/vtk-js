import macro from 'vtk.js/Sources/macro';
import vtkDataSet from 'vtk.js/Sources/Common/DataModel/DataSet';

const { FieldAssociations } = vtkDataSet;

// ----------------------------------------------------------------------------
// vtkHardwareSelector methods
// ----------------------------------------------------------------------------

function vtkHardwareSelector(publicAPI, model) {
  model.classHierarchy.push('vtkHardwareSelector');

  // get the source data that is used for generating a selection. This
  // must be called at least once before calling generateSelection. In
  // raster based backends this method will capture the buffers. You can
  // call this once and then make multiple calls to generateSelection.
  publicAPI.getSourceDataAsync = (renderer, fx1, fy1, fx2, fy2) => {};

  publicAPI.selectAsync = (renderer, fx1, fy1, fx2, fy2) =>
    new Promise((resolve, reject) => {
      publicAPI
        .getSourceDataAsync(renderer, fx1, fy1, fx2, fy2)
        .then((srcData) => {
          if (srcData) {
            resolve(srcData.generateSelection(fx1, fy1, fx2, fy2));
          } else {
            resolve([]);
          }
        });
    });
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  fieldAssociation: FieldAssociations.FIELD_ASSOCIATION_CELLS,
  captureZValues: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  macro.obj(publicAPI, model);

  macro.setGet(publicAPI, model, ['fieldAssociation', 'captureZValues']);

  // Object methods
  vtkHardwareSelector(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkHardwareSelector');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
