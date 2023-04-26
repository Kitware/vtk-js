import macro from 'vtk.js/Sources/macros';
import vtkAbstractMapper from 'vtk.js/Sources/Rendering/Core/AbstractMapper';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';

// ----------------------------------------------------------------------------
// vtkAbstractMapper methods
// ----------------------------------------------------------------------------

function vtkAbstractMapper3D(publicAPI, model) {
  publicAPI.getBounds = () => {
    macro.vtkErrorMacro(`vtkAbstractMapper3D.getBounds - NOT IMPLEMENTED`);
  };

  publicAPI.getCenter = () => {
    const bounds = publicAPI.getBounds();
    model.center = vtkBoundingBox.isValid(bounds)
      ? vtkBoundingBox.getCenter(bounds)
      : null;
    return model.center?.slice();
  };

  publicAPI.getLength = () => {
    const bounds = publicAPI.getBounds();
    return vtkBoundingBox.getDiagonalLength(bounds);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const defaultValues = (initialValues) => ({
  bounds: [...vtkBoundingBox.INIT_BOUNDS],
  center: [0, 0, 0],
  viewSpecificProperties: {},
  ...initialValues,
});

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, defaultValues(initialValues));
  // Inheritance
  vtkAbstractMapper.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['viewSpecificProperties']);

  vtkAbstractMapper3D(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend };
