import macro from 'vtk.js/Sources/macros';
import vtkPointLocator from 'vtk.js/Sources/Common/DataModel/PointLocator';

const { vtkErrorMacro } = macro;

/**
 * Search for a point in the array using indices from bucketIds
 * @param {Number[]} bucketIds - The list of point IDs in the bucket.
 * @param {vtkPoints} points - The vtkPoints object containing the points.
 * @param {Vector3} x - The point to check.
 * @returns {Number} - The ID of the point if it exists, otherwise -1.
 */
function findPointInBucket(bucketIds, points, x) {
  const data = points.getData();
  for (let i = 0; i < bucketIds.length; ++i) {
    const ptId = bucketIds[i];
    const idx = ptId * 3;
    if (
      x[0] === data[idx] &&
      x[1] === data[idx + 1] &&
      x[2] === data[idx + 2]
    ) {
      return ptId;
    }
  }
  return -1;
}

// ----------------------------------------------------------------------------
// vtkMergePoints methods
// ----------------------------------------------------------------------------

function vtkMergePoints(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkMergePoints');

  /**
   * Check if a point is already inserted in the merge points structure.
   *
   * @param {Vector3} x The point to check.
   * @returns {Number} The ID of the point if it exists, otherwise -1.
   */
  publicAPI.isInsertedPoint = (x) => {
    const idx = publicAPI.getBucketIndex(x);
    const bucketIds = model.hashTable.get(idx);
    if (bucketIds) {
      return findPointInBucket(bucketIds, model.points, x);
    }
    return -1;
  };

  /**
   * Insert a point into the merge points structure.
   * If the point is already present, it returns the existing ID.
   * Otherwise, it inserts the point and returns a new ID.
   *
   * @param {Vector3} x The point to insert as an array of 3 numbers.
   * @returns {IInsertPointResult} An object indicating if the point was inserted and its ID.
   */
  publicAPI.insertUniquePoint = (x) => {
    if (!x || x.length !== 3) {
      vtkErrorMacro('Point must be a Vector3.');
      return { inserted: false, id: -1 };
    }

    const idx = publicAPI.getBucketIndex(x);
    let bucketIds = model.hashTable.get(idx);
    let id = null;

    if (bucketIds !== undefined) {
      const ptId = findPointInBucket(bucketIds, model.points, x);
      if (ptId !== -1) {
        id = ptId;
        return { inserted: false, id };
      }
    } else {
      bucketIds = [];
      model.hashTable.set(idx, bucketIds);
    }

    // Insert new point
    bucketIds.push(model.insertionPointId);
    model.points.insertNextPoint(...x);
    id = model.insertionPointId++;
    return { inserted: true, id };
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

function defaultValues(initialValues) {
  return {
    // points: null,
    // hashTable: null,
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  vtkPointLocator.extend(publicAPI, model, defaultValues(initialValues));

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Object specific methods
  vtkMergePoints(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkMergePoints');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
