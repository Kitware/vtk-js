import macro from 'vtk.js/Sources/macros';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

const Dir = {
  Forward: 1,
  Backward: -1,
};

const visited = new Set();

function vtkContourLoopExtraction(publicAPI, model) {
  publicAPI.requestData = (inData, outData) => {
    const [input] = inData;

    if (!outData[0]) {
      outData[0] = vtkPolyData.newInstance();
    }
    const [output] = outData;
    publicAPI.extractContours(input, output);
    output.modified();
  };

  publicAPI.traverseLoop = (pd, dir, startLineId, startPtId, loopPoints) => {
    let lineId = startLineId;
    let lastPtId = startPtId;
    let terminated = false;
    let numInserted = 0;

    while (!terminated) {
      const { cellPointIds } = pd.getCellPoints(lineId);
      if (!cellPointIds) {
        // eslint-disable-next-line no-continue
        continue;
      }

      lastPtId =
        cellPointIds[0] !== lastPtId ? cellPointIds[0] : cellPointIds[1];
      numInserted++;

      // parametric point value
      const t = dir * numInserted;
      loopPoints.push({ t, ptId: lastPtId });

      const lineCell = pd.getPointCells(lastPtId);

      if (lineCell.length !== 2 || lastPtId === startPtId) {
        // looped
        return lastPtId;
      }

      if (lineCell.length === 2) {
        // continue along loop
        lineId = lineCell[0] !== lineId ? lineCell[0] : lineCell[1];
        visited.add(lineId);
      } else {
        // empty or invalid cell
        terminated = true;
      }
    }

    return lastPtId;
  };

  publicAPI.extractContours = (input, output) => {
    const loops = [];
    visited.clear();

    const inLines = input.getLines();
    output.getPoints().setData(Float32Array.from(input.getPoints().getData()));

    // TODO skip if cached input mtime hasn't changed.
    // iterate over input lines
    for (let li = 0; li < inLines.getNumberOfCells(); li++) {
      if (visited.has(li)) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const { cellPointIds } = input.getCellPoints(li);
      if (!cellPointIds) {
        // eslint-disable-next-line no-continue
        continue;
      }

      visited.add(li);
      const startPtId = cellPointIds[0];

      const loopPoints = [];
      loopPoints.push({ t: 0, ptId: startPtId });

      const endPtId = publicAPI.traverseLoop(
        input,
        Dir.Forward,
        li,
        startPtId,
        loopPoints
      );

      if (startPtId !== endPtId) {
        // didn't find a loop. Go other direction to see where we end up
        publicAPI.traverseLoop(input, Dir.Backward, li, startPtId, loopPoints);
        loopPoints.sort((a, b) => (a.t < b.t ? -1 : 1));
        // make closed contour
        if (
          loopPoints.length &&
          loopPoints[0].ptId !== loopPoints[loopPoints.length - 1]?.ptId
        ) {
          loopPoints.push({ ...loopPoints[loopPoints.length - 1] });
        }
      }

      if (loopPoints.length) {
        loops.push(loopPoints);
      }
    }

    // clear output lines
    const outLines = output.getLines();
    outLines.resize(0);

    loops.forEach((loop) => {
      outLines.insertNextCell(loop.map((pt) => pt.ptId));
    });
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);
  macro.algo(publicAPI, model, 1, 1);

  vtkContourLoopExtraction(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkContourLoopExtraction'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
