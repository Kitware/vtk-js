import macro from 'vtk.js/Sources/macros';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

const { vtkErrorMacro } = macro;
// ----------------------------------------------------------------------------
// vtkPoints methods
// ----------------------------------------------------------------------------

function vtkPoints(publicAPI, model) {
  // Keep track of modified time for bounds computation
  let boundMTime = 0;

  // Set our className
  model.classHierarchy.push('vtkPoints');

  // Forwarding methods
  publicAPI.getNumberOfPoints = publicAPI.getNumberOfTuples;

  publicAPI.setNumberOfPoints = (nbPoints, dimension = 3) => {
    if (publicAPI.getNumberOfPoints() !== nbPoints) {
      model.size = nbPoints * dimension;
      model.values = macro.newTypedArray(model.dataType, model.size);
      publicAPI.setNumberOfComponents(dimension);
      publicAPI.modified();
    }
  };

  publicAPI.setPoint = (idx, ...xyz) => {
    publicAPI.setTuple(idx, xyz);
  };

  publicAPI.getPoint = publicAPI.getTuple;
  publicAPI.findPoint = publicAPI.findTuple;

  publicAPI.insertNextPoint = (x, y, z) => publicAPI.insertNextTuple([x, y, z]);

  publicAPI.insertPoint = (ptId, point) => publicAPI.insertTuple(ptId, point);

  const superGetBounds = publicAPI.getBounds;
  publicAPI.getBounds = () => {
    if (boundMTime < model.mtime) {
      publicAPI.computeBounds();
    }
    return superGetBounds();
  };

  const superGetBoundsByReference = publicAPI.getBoundsByReference;
  publicAPI.getBoundsByReference = () => {
    if (boundMTime < model.mtime) {
      publicAPI.computeBounds();
    }
    return superGetBoundsByReference();
  };

  // Trigger the computation of bounds
  publicAPI.computeBounds = () => {
    if (publicAPI.getNumberOfComponents() === 3) {
      const xRange = publicAPI.getRange(0);
      model.bounds[0] = xRange[0];
      model.bounds[1] = xRange[1];
      const yRange = publicAPI.getRange(1);
      model.bounds[2] = yRange[0];
      model.bounds[3] = yRange[1];
      const zRange = publicAPI.getRange(2);
      model.bounds[4] = zRange[0];
      model.bounds[5] = zRange[1];
    } else if (publicAPI.getNumberOfComponents() === 2) {
      const xRange = publicAPI.getRange(0);
      model.bounds[0] = xRange[0];
      model.bounds[1] = xRange[1];
      const yRange = publicAPI.getRange(1);
      model.bounds[2] = yRange[0];
      model.bounds[3] = yRange[1];
      model.bounds[4] = 0;
      model.bounds[5] = 0;
    } else {
      vtkErrorMacro(
        `getBounds called on an array with components of ${publicAPI.getNumberOfComponents()}`
      );
      vtkMath.uninitializeBounds(model.bounds);
    }
    boundMTime = macro.getCurrentGlobalMTime();
  };

  // Initialize
  publicAPI.setNumberOfComponents(
    model.numberOfComponents < 2 ? 3 : model.numberOfComponents
  );
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  empty: true,
  numberOfComponents: 3,
  dataType: VtkDataTypes.FLOAT,
  bounds: [1, -1, 1, -1, 1, -1],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkDataArray.extend(publicAPI, model, initialValues);

  macro.getArray(publicAPI, model, ['bounds'], 6);
  vtkPoints(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPoints');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
