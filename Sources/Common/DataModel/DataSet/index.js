import macro from 'vtk.js/Sources/macros';
import vtk from 'vtk.js/Sources/vtk';
import vtkDataSetAttributes from 'vtk.js/Sources/Common/DataModel/DataSetAttributes';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import Constants from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

const DATASET_FIELDS = ['pointData', 'cellData', 'fieldData'];

// ----------------------------------------------------------------------------
// vtkDataSet methods
// ----------------------------------------------------------------------------

function vtkDataSet(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkDataSet');

  // Add dataset attributes
  DATASET_FIELDS.forEach((fieldName) => {
    if (!model[fieldName]) {
      model[fieldName] = vtkDataSetAttributes.newInstance();
    } else {
      model[fieldName] = vtk(model[fieldName]);
    }
  });

  //------------------------------------------------------------------------------
  // Compute the data bounding box from data points.
  publicAPI.computeBounds = () => {
    if (
      (model.modifiedTime &&
        model.computeTime &&
        model.modifiedTime > model.computeTime) ||
      !model.computeTime
    ) {
      const points = publicAPI.getPoints();
      if (points?.getNumberOfPoints()) {
        // Compute bounds from points
        const bounds = vtkBoundingBox.INIT_BOUNDS.slice();
        const numberOfPoints = points.getNumberOfPoints();
        for (let i = 0; i < numberOfPoints; i++) {
          const pt = points.getPoint(i);
          vtkBoundingBox.addPoint(bounds, pt[0], pt[1], pt[2]);
        }
        model.bounds = bounds;
      } else {
        model.bounds = vtkMath.createUninitializedBounds();
      }
      // Update computeTime
      model.computeTime = Date.now();
    }
  };

  /**
   * Returns the bounds as [xmin, xmax, ymin, ymax, zmin, zmax]
   */
  publicAPI.getBounds = () => {
    if (model.bounds && model.bounds.length === 6) {
      return model.bounds;
    }
    // fallback: try to get bounds from pointData if available
    if (publicAPI.getPoints && publicAPI.getPoints()) {
      return publicAPI.getPoints().getBounds();
    }
    return vtkMath.createUninitializedBounds();
  };

  /**
   * Returns the squared length of the diagonal of the bounding box
   */
  publicAPI.getLength2 = () => {
    const bounds = publicAPI.getBounds();
    if (!bounds || bounds.length !== 6) return 0;
    return vtkBoundingBox.getDiagonalLength2(bounds);
  };

  /**
   * Returns the length of the diagonal of the bounding box
   */
  publicAPI.getLength = () => Math.sqrt(publicAPI.getLength2());

  /**
   * Returns the center of the bounding box as [x, y, z]
   */
  publicAPI.getCenter = () => {
    const bounds = publicAPI.getBounds();
    if (!bounds || bounds.length !== 6) return [0, 0, 0];
    return [
      (bounds[0] + bounds[1]) / 2,
      (bounds[2] + bounds[3]) / 2,
      (bounds[4] + bounds[5]) / 2,
    ];
  };

  /**
   * Get the bounding box of a cell with the given cellId
   * @param {Number} cellId - The id of the cell
   * @returns {Number[]} - The bounds as [xmin, xmax, ymin, ymax, zmin, zmax]
   */
  publicAPI.getCellBounds = (cellId) => {
    const cell = publicAPI.getCell(cellId);
    if (cell) {
      return cell.getBounds();
    }
    return vtkMath.createUninitializedBounds();
  };

  const superShallowCopy = publicAPI.shallowCopy;
  publicAPI.shallowCopy = (other, debug = false) => {
    superShallowCopy(other, debug);
    DATASET_FIELDS.forEach((fieldName) => {
      model[fieldName] = vtkDataSetAttributes.newInstance();
      model[fieldName].shallowCopy(other.getReferenceByName(fieldName));
    });
  };

  const superGetMTime = publicAPI.getMTime;
  publicAPI.getMTime = () =>
    DATASET_FIELDS.reduce(
      (mTime, fieldName) =>
        Math.max(mTime, model[fieldName]?.getMTime() ?? mTime),
      superGetMTime()
    );

  publicAPI.initialize = () => {
    DATASET_FIELDS.forEach((fieldName) => model[fieldName]?.initialize());
    return publicAPI;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // pointData: null,
  // cellData: null,
  // fieldData: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, DATASET_FIELDS);

  // Object specific methods
  vtkDataSet(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkDataSet');

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...Constants };
