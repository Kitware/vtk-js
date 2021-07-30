import macro from 'vtk.js/Sources/macros';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';

// ----------------------------------------------------------------------------
// vtkSkybox methods
// ----------------------------------------------------------------------------

function vtkSkybox(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSkybox');

  publicAPI.getIsOpaque = () => true;

  publicAPI.hasTranslucentPolygonalGeometry = () => false;

  publicAPI.getSupportsSelection = () => false;
}

// ----------------------------------------------------------------------------
// Object fSkyboxy
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  format: 'box',
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkActor.extend(publicAPI, model, initialValues);

  // Build VTK API
  macro.setGet(publicAPI, model, [
    'format', // can be box or background, in the future sphere, floor as well
  ]);

  // Object methods
  vtkSkybox(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkSkybox');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
