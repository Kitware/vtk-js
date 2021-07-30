import macro from 'vtk.js/Sources/macros';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkSurfaceLICInterface from 'vtk.js/Sources/Rendering/Core/SurfaceLICInterface';

// ----------------------------------------------------------------------------
// vtkSurfaceLICMapper methods
// ----------------------------------------------------------------------------

function vtkSurfaceLICMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSurfaceLICMapper');

  publicAPI.getLicInterface = () => {
    if (!model.licInterface) {
      model.licInterface = vtkSurfaceLICInterface.newInstance();
    }
    return model.licInterface;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  licInterface: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkMapper.extend(publicAPI, model, initialValues);

  macro.set(publicAPI, model, ['licInterface']);

  // Object methods
  vtkSurfaceLICMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkSurfaceLICMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
