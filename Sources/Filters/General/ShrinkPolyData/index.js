import macro from 'vtk.js/Sources/macros';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkPolygon from 'vtk.js/Sources/Common/DataModel/Polygon';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkShrinkPolyData methods
// ----------------------------------------------------------------------------

function vtkShrinkPolyData(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkShrinkPolyData');

  /**
   * Shrink a point towards a given center by a shrink factor.
   * @param {Vector3} point - The [x, y, z] coordinates of the point to shrink
   * @param {Vector3} center - The [x, y, z] coordinates of the center
   * @param {number} shrinkFactor - The shrink factor (0.0 to 1.0)
   * @param {Vector3} [shrunkPoint] - Optional array to store the shrunk point
   * @returns {Vector3} The shrunk point [x, y, z] coordinates
   */
  function shrinkTowardsPoint(point, center, shrinkFactor, shrunkPoint = []) {
    shrunkPoint[0] = center[0] + shrinkFactor * (point[0] - center[0]);
    shrunkPoint[1] = center[1] + shrinkFactor * (point[1] - center[1]);
    shrunkPoint[2] = center[2] + shrinkFactor * (point[2] - center[2]);
    return shrunkPoint;
  }

  /**
   * Shrinks a cell towards its center by a shrink factor.
   * @param {number[]} cellPointIds - Array of point indices that define the cell
   * @param {vtkPoints} inPoints - Input points
   * @param {number} shrinkFactor - The shrink factor (0.0 to 1.0)
   * @param {Float32Array} newPointsData - Output array to store new point coordinates
   * @param {number} outCount - Current index in the output points array
   * @returns {Object} Object containing newPointIds array and updated outCount
   */
  function shrinkCell(
    cellPointIds,
    inPoints,
    shrinkFactor,
    newPointsData,
    outCount
  ) {
    const inPts = inPoints.getData();
    const center = [0, 0, 0];
    const newPointIds = [];
    const shrunkPoint = [0, 0, 0];
    const currentPoint = [0, 0, 0];

    let nextOutCount = outCount;

    const numPoints = cellPointIds.length;

    if (numPoints === 0) {
      return { newPointIds, outCount: nextOutCount };
    }

    if (numPoints === 1) {
      // vertex - no shrinking needed, just copy the point
      const ptId = cellPointIds[0];
      newPointsData[nextOutCount * 3] = inPts[ptId * 3];
      newPointsData[nextOutCount * 3 + 1] = inPts[ptId * 3 + 1];
      newPointsData[nextOutCount * 3 + 2] = inPts[ptId * 3 + 2];
      newPointIds.push(nextOutCount);
      nextOutCount++;
    } else if (numPoints === 2) {
      // line - shrink towards midpoint

      // Calculate midpoint as center
      vtkPolygon.computeCentroid(cellPointIds, inPoints, center);

      // Shrink both points towards center
      for (let i = 0; i < 2; i++) {
        const ptId = cellPointIds[i];
        currentPoint[0] = inPts[ptId * 3];
        currentPoint[1] = inPts[ptId * 3 + 1];
        currentPoint[2] = inPts[ptId * 3 + 2];

        shrinkTowardsPoint(currentPoint, center, shrinkFactor, shrunkPoint);

        newPointsData[nextOutCount * 3] = shrunkPoint[0];
        newPointsData[nextOutCount * 3 + 1] = shrunkPoint[1];
        newPointsData[nextOutCount * 3 + 2] = shrunkPoint[2];
        newPointIds.push(nextOutCount);
        nextOutCount++;
      }
    } else {
      // polygon/triangle - shrink towards centroid
      vtkPolygon.computeCentroid(cellPointIds, inPoints, center);

      // Shrink each point towards centroid
      for (let i = 0; i < numPoints; i++) {
        const ptId = cellPointIds[i];
        currentPoint[0] = inPts[ptId * 3];
        currentPoint[1] = inPts[ptId * 3 + 1];
        currentPoint[2] = inPts[ptId * 3 + 2];

        shrinkTowardsPoint(currentPoint, center, shrinkFactor, shrunkPoint);

        newPointsData[nextOutCount * 3] = shrunkPoint[0];
        newPointsData[nextOutCount * 3 + 1] = shrunkPoint[1];
        newPointsData[nextOutCount * 3 + 2] = shrunkPoint[2];
        newPointIds.push(nextOutCount);
        nextOutCount++;
      }
    }

    return { newPointIds, outCount: nextOutCount };
  }

  // Internal method to process the shrinking
  function shrinkData(input, output) {
    const inPoints = input.getPoints();
    const inVerts = input.getVerts();
    const inLines = input.getLines();
    const inPolys = input.getPolys();
    const inStrips = input.getStrips();

    const shrinkFactor = model.shrinkFactor;

    let numNewPts = 0;

    if (inVerts) {
      const cellSizes = inVerts.getCellSizes();
      for (let i = 0; i < cellSizes.length; i++) {
        numNewPts += cellSizes[i];
      }
    }

    if (inLines) {
      const cellSizes = inLines.getCellSizes();
      for (let i = 0; i < cellSizes.length; i++) {
        numNewPts += (cellSizes[i] - 1) * 2;
      }
    }

    if (inPolys) {
      const cellSizes = inPolys.getCellSizes();
      for (let i = 0; i < cellSizes.length; i++) {
        numNewPts += cellSizes[i];
      }
    }

    if (inStrips) {
      const cellSizes = inStrips.getCellSizes();
      for (let i = 0; i < cellSizes.length; i++) {
        numNewPts += (cellSizes[i] - 2) * 3;
      }
    }

    const newPointsData = new Float32Array(numNewPts * 3);
    const newPoints = vtkPoints.newInstance();
    newPoints.setData(newPointsData, 3);

    const newVerts = vtkCellArray.newInstance();
    const newLines = vtkCellArray.newInstance();
    const newPolys = vtkCellArray.newInstance();

    let outCount = 0;

    // Process vertices
    if (inVerts) {
      const vertData = inVerts.getData();
      const newVertData = [];
      const cellPointIds = [];

      for (let i = 0; i < vertData.length; ) {
        cellPointIds.length = 0; // Clear previous point IDs
        const npts = vertData[i];
        for (let j = 1; j <= npts; j++) {
          cellPointIds.push(vertData[i + j]);
        }

        const result = shrinkCell(
          cellPointIds,
          inPoints,
          shrinkFactor,
          newPointsData,
          outCount
        );
        outCount = result.outCount;

        newVertData.push(npts);
        newVertData.push(...result.newPointIds);

        i += npts + 1;
      }

      newVerts.setData(new Uint32Array(newVertData));
    }

    // Process lines
    if (inLines) {
      const lineData = inLines.getData();
      const newLineData = [];

      for (let i = 0; i < lineData.length; ) {
        const npts = lineData[i];

        // Process each line segment
        for (let j = 0; j < npts - 1; j++) {
          const cellPointIds = [lineData[i + j + 1], lineData[i + j + 2]];

          const result = shrinkCell(
            cellPointIds,
            inPoints,
            shrinkFactor,
            newPointsData,
            outCount
          );
          outCount = result.outCount;

          newLineData.push(2, result.newPointIds[0], result.newPointIds[1]);
        }

        i += npts + 1;
      }

      newLines.setData(new Uint32Array(newLineData));
    }

    // Process polygons
    if (inPolys) {
      const polyData = inPolys.getData();
      const newPolyData = [];
      const cellPointIds = [];

      for (let i = 0; i < polyData.length; ) {
        cellPointIds.length = 0; // Clear previous point IDs
        const npts = polyData[i];

        for (let j = 1; j <= npts; j++) {
          cellPointIds.push(polyData[i + j]);
        }

        const result = shrinkCell(
          cellPointIds,
          inPoints,
          shrinkFactor,
          newPointsData,
          outCount
        );
        outCount = result.outCount;

        newPolyData.push(npts);
        newPolyData.push(...result.newPointIds);

        i += npts + 1;
      }

      newPolys.setData(new Uint32Array(newPolyData));
    }

    // Process triangle strips (convert to triangles and shrink)
    if (inStrips) {
      const stripData = inStrips.getData();
      const newPolyData = [];

      for (let i = 0; i < stripData.length; ) {
        const npts = stripData[i];

        for (let j = 0; j < npts - 2; j++) {
          const cellPointIds = [
            stripData[i + j + 1],
            stripData[i + j + 2],
            stripData[i + j + 3],
          ];

          const result = shrinkCell(
            cellPointIds,
            inPoints,
            shrinkFactor,
            newPointsData,
            outCount
          );
          outCount = result.outCount;

          // Triangle strips alternate the winding order of each triangle as you
          // move along the strip. This means that the orientation
          // (clockwise/counter-clockwise) flips for every new triangle. To
          // ensure consistent face orientation (so normals and rendering are
          // correct), we reverse the vertex order for every odd triangle.
          // Example strip with vertices [0,1,2,3,4,5] produces these triangles:
          //
          //     0───2───4      Triangle 0: (0,1,2) [CCW]
          //     │ ╱ │ ╱ │      Triangle 1: (1,3,2) [CW -> reversed to (2,3,1) for CCW]
          //     │╱  │╱  │      Triangle 2: (2,3,4) [CCW]
          //     1───3───5      Triangle 3: (3,5,4) [CW -> reversed to (4,5,3) for CCW]
          const newIds = [...result.newPointIds];
          if (j % 2) {
            const tmp = newIds[0];
            newIds[0] = newIds[2];
            newIds[2] = tmp;
          }

          newPolyData.push(3, newIds[0], newIds[1], newIds[2]);
        }
        i += npts + 1;
      }

      if (newPolyData.length > 0) {
        const existingPolyData = newPolys.getData();
        const combinedPolyData = new Uint32Array(
          existingPolyData.length + newPolyData.length
        );
        combinedPolyData.set(existingPolyData);
        combinedPolyData.set(newPolyData, existingPolyData.length);
        newPolys.setData(combinedPolyData);
      }
    }

    // Set output
    output.setPoints(newPoints);
    output.setVerts(newVerts);
    output.setLines(newLines);
    output.setPolys(newPolys);

    // Copy cell data
    output.getCellData().passData(input.getCellData());
  }

  publicAPI.requestData = (inData, outData) => {
    const input = inData[0];
    const output = outData[0]?.initialize() || vtkPolyData.newInstance();

    if (!input) {
      vtkErrorMacro('No input!');
      return;
    }

    if (!input.getPoints()) {
      vtkErrorMacro('Input has no points!');
      return;
    }

    shrinkData(input, output);

    outData[0] = output;
  };

  // Set the shrink factor
  publicAPI.setShrinkFactor = (shrinkFactor) => {
    if (shrinkFactor !== model.shrinkFactor) {
      model.shrinkFactor = Math.max(0.0, Math.min(1.0, shrinkFactor));
      publicAPI.modified();
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  shrinkFactor: 0.5,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 1, 1);

  macro.setGet(publicAPI, model, ['shrinkFactor']);

  vtkShrinkPolyData(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkShrinkPolyData');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
