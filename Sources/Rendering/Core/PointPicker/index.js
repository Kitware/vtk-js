import macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPicker from 'vtk.js/Sources/Rendering/Core/Picker';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkPointPicker methods
// ----------------------------------------------------------------------------

function vtkPointPicker(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPointPicker');

  publicAPI.intersectWithLine = (p1, p2, tol, mapper) => {
    let tMin = Number.MAX_VALUE;

    if (mapper.isA('vtkImageMapper')) {
      const pickData = mapper.intersectWithLineForPointPicking(p1, p2);
      if (pickData) {
        tMin = pickData.t;
        model.pointIJK = pickData.ijk;
      }
    } else if (mapper.isA('vtkMapper')) {
      tMin = publicAPI.intersectActorWithLine(p1, p2, tol, mapper);
    }

    return tMin;
  };

  publicAPI.intersectActorWithLine = (p1, p2, tol, mapper) => {
    // Get dataset
    const input = mapper.getInputData();

    // Determine appropriate info
    let ptId = 0;
    const numPts = input.getPoints().getNumberOfPoints();

    if (numPts <= ptId) {
      return 2.0;
    }

    const ray = [];
    for (let i = 0; i < 3; i++) {
      ray[i] = p2[i] - p1[i];
    }

    const rayFactor = vtkMath.dot(ray, ray);
    if (rayFactor === 0.0) {
      vtkErrorMacro('Cannot process points');
      return 2.0;
    }

    let t;
    let minPtId = -1;
    let tMin = Number.MAX_VALUE;
    let minPtDist = Number.MAX_VALUE;
    const projXYZ = [];
    const minXYZ = [];
    const x = [];
    const points = input.getPoints();

    if (model.useCells) {
      const cellData = input.getPolys().getData();
      const nbPointsPerCell = cellData[0];
      const nbCells = input.getPolys().getNumberOfCells();

      for (let cellID = 0; cellID < nbCells; cellID++) {
        const firstPointIndex = cellID * nbPointsPerCell + 1;
        const lastPointIndex = firstPointIndex + nbPointsPerCell;

        for (
          let pointIndex = firstPointIndex;
          pointIndex < lastPointIndex;
          pointIndex++
        ) {
          const pointDataIndex = cellData[pointIndex];
          points.getPoint(pointDataIndex, x);

          t =
            (ray[0] * (x[0] - p1[0]) +
              ray[1] * (x[1] - p1[1]) +
              ray[2] * (x[2] - p1[2])) /
            rayFactor;

          // If we find a point closer than we currently have, see whether it
          // lies within the pick tolerance and clipping planes. We keep track
          // of the point closest to the line (use a fudge factor for points
          // nearly the same distance away.)
          if (t >= 0.0 && t <= 1.0 && t <= tMin + model.tolerance) {
            let maxDist = 0.0;
            for (let i = 0; i < 3; i++) {
              projXYZ[i] = p1[i] + t * ray[i];
              const dist = Math.abs(x[i] - projXYZ[i]);
              if (dist > maxDist) {
                maxDist = dist;
              }
            } // end for i
            if (maxDist <= tol && maxDist < minPtDist) {
              // within tolerance
              minPtId = ptId;
              minXYZ[0] = x[0];
              minXYZ[1] = x[1];
              minXYZ[2] = x[2];
              minPtDist = maxDist;
              tMin = t;
            }
          }
        } // end for pointIndex
      } // end for cellID
    } else {
      // end if model.useCells
      for (ptId = 0; ptId < numPts; ptId++) {
        points.getPoint(ptId, x);

        t =
          (ray[0] * (x[0] - p1[0]) +
            ray[1] * (x[1] - p1[1]) +
            ray[2] * (x[2] - p1[2])) /
          rayFactor;

        // If we find a point closer than we currently have, see whether it
        // lies within the pick tolerance and clipping planes. We keep track
        // of the point closest to the line (use a fudge factor for points
        // nearly the same distance away.)
        if (t >= 0.0 && t <= 1.0 && t <= tMin + model.tolerance) {
          let maxDist = 0.0;
          for (let i = 0; i < 3; i++) {
            projXYZ[i] = p1[i] + t * ray[i];
            const dist = Math.abs(x[i] - projXYZ[i]);
            if (dist > maxDist) {
              maxDist = dist;
            }
          } // end for i
          if (maxDist <= tol && maxDist < minPtDist) {
            // within tolerance
            minPtId = ptId;
            minXYZ[0] = x[0];
            minXYZ[1] = x[1];
            minXYZ[2] = x[2];
            minPtDist = maxDist;
            tMin = t;
          }
        }
      }
    }

    model.pointId = minPtId;
    return tMin;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  pointId: -1,
  pointIJK: [],
  useCells: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkPicker.extend(publicAPI, model, initialValues);

  macro.getArray(publicAPI, model, ['pointIJK']);
  macro.get(publicAPI, model, ['pointId']);
  macro.setGet(publicAPI, model, ['useCells']);

  vtkPointPicker(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPointPicker');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
