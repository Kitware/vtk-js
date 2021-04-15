import macro from 'vtk.js/Sources/macro';
import vtkDataSet from 'vtk.js/Sources/Common/DataModel/DataSet';

const { FieldAssociations } = vtkDataSet;

// ----------------------------------------------------------------------------
// vtkHardwareSelector methods
// ----------------------------------------------------------------------------

function vtkHardwareSelector(publicAPI, model) {
  model.classHierarchy.push('vtkHardwareSelector');

  // update and source data that is used for generating a selection. This
  // must be called at least once before calling generateSelection. In
  // raster based backends this method will capture the buffers. You can
  // call this once and then make multiple selections.
  publicAPI.updateSelectionSourceData = (fx1, fy1, fx2, fy2) => {};

  // generate a selection for the specified region
  // Return am array of vtkSelectionNode
  publicAPI.generateSelection = (fx1, fy1, fx2, fy2) => {
    macro.vtkErrorMacro('not implemented');
    return [];
  };

  // override
  const superSetArea = publicAPI.setArea;
  publicAPI.setArea = (...args) => {
    if (superSetArea(...args)) {
      model.area[0] = Math.floor(model.area[0]);
      model.area[1] = Math.floor(model.area[1]);
      model.area[2] = Math.floor(model.area[2]);
      model.area[3] = Math.floor(model.area[3]);
      return true;
    }
    return false;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  area: undefined,
  fieldAssociation: FieldAssociations.FIELD_ASSOCIATION_CELLS,
  captureZValues: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  macro.obj(publicAPI, model);

  if (!model.area) {
    model.area = [0, 0, 0, 0];
  }

  macro.setGetArray(publicAPI, model, ['area'], 4);
  macro.setGet(publicAPI, model, ['fieldAssociation', 'captureZValues']);

  // Object methods
  vtkHardwareSelector(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkHardwareSelector');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
