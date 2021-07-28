import vtk from 'vtk.js/Sources/vtk';
import macro from 'vtk.js/Sources/macros';
import vtkDataSet from 'vtk.js/Sources/Common/DataModel/DataSet';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// vtkPointSet methods
// ----------------------------------------------------------------------------

function vtkPointSet(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPointSet');

  // Create empty points
  if (!model.points) {
    model.points = vtkPoints.newInstance();
  } else {
    model.points = vtk(model.points);
  }

  publicAPI.getNumberOfPoints = () => model.points.getNumberOfPoints();

  publicAPI.getBounds = () => model.points.getBounds();

  publicAPI.computeBounds = () => {
    publicAPI.getBounds();
  };

  const superShallowCopy = publicAPI.shallowCopy;
  publicAPI.shallowCopy = (other, debug = false) => {
    superShallowCopy(other, debug);
    model.points = vtkPoints.newInstance();
    model.points.shallowCopy(other.getPoints());
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // points: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkDataSet.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, ['points']);

  // Object specific methods
  vtkPointSet(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPointSet');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
