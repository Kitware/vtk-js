import macro from 'vtk.js/Sources/macros';
import vtkAbstractMapper3D from 'vtk.js/Sources/Rendering/Core/AbstractMapper3D';

// ----------------------------------------------------------------------------
// vtkAbstractImageMapper methods
// ----------------------------------------------------------------------------

function vtkAbstractImageMapper(publicAPI, model) {
  model.classHierarchy.push('vtkAbstractImageMapper');

  publicAPI.getIsOpaque = () => true;

  publicAPI.getCurrentImage = () => null;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  slice: 0,
  customDisplayExtent: [0, 0, 0, 0, 0, 0],
  useCustomExtents: false,
  backgroundColor: [0, 0, 0, 1],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  vtkAbstractMapper3D.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['slice', 'useCustomExtents']);
  macro.setGetArray(publicAPI, model, ['customDisplayExtent'], 6);
  macro.setGetArray(publicAPI, model, ['backgroundColor'], 4);

  vtkAbstractImageMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------
export default { extend };
