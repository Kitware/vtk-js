import macro from 'vtk.js/Sources/macros';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkMergePoints from 'vtk.js/Sources/Common/DataModel/MergePoints';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkTriangle from 'vtk.js/Sources/Common/DataModel/Triangle';
import { DesiredOutputPrecision } from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';

const { vtkErrorMacro, vtkDebugMacro } = macro;

/**
 * Iterate packed vtkCellArray connectivity without allocating per-cell metadata.
 *
 * @param {vtkCellArray} cellArray
 * @param {(values: ArrayLike<number>, offset: number, npts: number, cellId: number) => void} callback
 */
function iterateCellArray(cellArray, callback) {
  if (!cellArray || cellArray.getNumberOfCells() === 0) {
    return;
  }

  const values = cellArray.getData();
  let offset = 0;
  let cellId = 0;
  while (offset < values.length) {
    const npts = values[offset++];
    callback(values, offset, npts, cellId++);
    offset += npts;
  }
}

// ----------------------------------------------------------------------------
// vtkClipPolyData methods
// ----------------------------------------------------------------------------

function vtkClipPolyData(publicAPI, model) {
  model.classHierarchy.push('vtkClipPolyData');

  const superClass = { ...publicAPI };

  function isInside(scalar, insideOut, value) {
    return insideOut ? scalar <= value : scalar > value;
  }

  /**
   * Evaluate the clip implicit function once per input point.
   *
   * @param {vtkPoints} points
   * @param {*} clipFunction
   * @returns {Float32Array}
   */
  function evaluateImplicitFunction(points, clipFunction) {
    const numPts = points.getNumberOfPoints();

    const scalars = new Float32Array(numPts);

    const pt = [0, 0, 0];
    for (let i = 0; i < numPts; i++) {
      points.getPoint(i, pt);
      scalars[i] = clipFunction.evaluateFunction(pt);
    }
    return scalars;
  }

  /**
   * Ensure both filter output ports have vtkPolyData instances.
   *
   * @param {any[]} outData
   * @returns {{ output: vtkPolyData, clippedOutput: vtkPolyData }}
   */
  function buildOutputs(outData) {
    const output = outData[0]?.initialize() || vtkPolyData.newInstance();
    const clippedOutput = outData[1]?.initialize() || vtkPolyData.newInstance();
    outData[0] = output;
    outData[1] = clippedOutput;
    return { output, clippedOutput };
  }

  /**
   * Create reusable state shared across all clipping passes.
   *
   * @param {vtkPolyData} input
   * @param {vtkPolyData} output
   * @param {vtkPolyData} clippedOutput
   * @returns {object}
   */
  function createClipState(input, output, clippedOutput) {
    let pointsDataType = input.getPoints().getDataType();
    if (model.outputPointsPrecision === DesiredOutputPrecision.SINGLE) {
      pointsDataType = VtkDataTypes.FLOAT;
    } else if (model.outputPointsPrecision === DesiredOutputPrecision.DOUBLE) {
      pointsDataType = VtkDataTypes.DOUBLE;
    }

    const newPoints = vtkPoints.newInstance({
      dataType: pointsDataType,
    });

    publicAPI.createDefaultLocator();
    model.locator.initPointInsertion(newPoints, input.getBounds());

    output.getPointData().initialize();
    output.getCellData().initialize();
    output.getFieldData().passData(input.getFieldData());
    clippedOutput.getPointData().initialize();
    clippedOutput.getCellData().initialize();
    clippedOutput.getFieldData().passData(input.getFieldData());

    const triangleScalarsValues = new Float32Array(3);

    return {
      inputPoints: input.getPoints(),
      inputPointsData: input.getPoints().getData(),
      inputPointData: input.getPointData(),
      inputCellData: input.getCellData(),
      outputPointData: output.getPointData(),
      outputCellData: output.getCellData(),
      newPoints,
      clipScalarValues: [],
      triangleCell: vtkTriangle.newInstance(),
      triangleScalarsValues,
      triangleScalars: vtkDataArray.newInstance({
        numberOfComponents: 1,
        values: triangleScalarsValues,
      }),
      trianglePointIds: [0, 0, 0],
    };
  }

  /**
   * Insert or reuse a point in the output locator and propagate point data.
   *
   * @param {object} pointRef
   * @param {object} clipState
   * @returns {number}
   */
  function addPoint(pointRef, clipState) {
    const insertResult = model.locator.insertUniquePoint(pointRef.point);
    const { inserted, id } = insertResult;

    if (inserted) {
      if (pointRef.type === 'original') {
        clipState.outputPointData.passData(
          clipState.inputPointData,
          pointRef.pointId,
          id
        );
      } else {
        clipState.outputPointData.interpolateData(
          clipState.inputPointData,
          pointRef.pointId1,
          pointRef.pointId2,
          id,
          pointRef.t
        );
      }

      if (model.generateClipScalars) {
        clipState.clipScalarValues[id] = pointRef.scalar;
      }
    }

    return id;
  }

  /**
   * Build a lightweight point reference for an existing input point.
   *
   * @param {number} pointId
   * @param {number} scalar
   * @param {object} clipState
   * @returns {object}
   */
  function makeOriginalRef(pointId, scalar, clipState) {
    const offset = pointId * 3;
    return {
      type: 'original',
      pointId,
      point: [
        clipState.inputPointsData[offset],
        clipState.inputPointsData[offset + 1],
        clipState.inputPointsData[offset + 2],
      ],
      scalar,
    };
  }

  /**
   * Build an interpolated point reference on an edge crossing the clip value.
   *
   * @param {object} ref1
   * @param {object} ref2
   * @returns {object}
   */
  function makeEdgeRef(ref1, ref2) {
    const delta = ref2.scalar - ref1.scalar;
    const t = delta === 0 ? 0 : (model.value - ref1.scalar) / delta;
    return {
      type: 'interpolated',
      pointId1: ref1.type === 'original' ? ref1.pointId : ref1.pointId1,
      pointId2: ref2.type === 'original' ? ref2.pointId : ref2.pointId2,
      t: ref1.type === 'original' && ref2.type === 'original' ? t : t,
      point: [
        ref1.point[0] + t * (ref2.point[0] - ref1.point[0]),
        ref1.point[1] + t * (ref2.point[1] - ref1.point[1]),
        ref1.point[2] + t * (ref2.point[2] - ref1.point[2]),
      ],
      scalar: model.value,
    };
  }

  /**
   * Clip a polyline into one or more kept segments.
   *
   * @param {ArrayLike<number>} values
   * @param {number} offset
   * @param {number} npts
   * @param {boolean} insideOut
   * @param {object} clipState
   * @returns {number[][]}
   */
  function clipPolyline(values, offset, npts, insideOut, clipState) {
    const segments = [];
    let current = [];

    const pushCurrent = () => {
      if (current.length >= 2) {
        segments.push(current);
      }
      current = [];
    };

    for (let i = 0; i < npts - 1; i++) {
      const id0 = values[offset + i];
      const id1 = values[offset + i + 1];
      const s0 = clipState.inputScalars[id0];
      const s1 = clipState.inputScalars[id1];
      const in0 = isInside(s0, insideOut, model.value);
      const in1 = isInside(s1, insideOut, model.value);

      const ref0 = makeOriginalRef(id0, s0, clipState);
      const ref1 = makeOriginalRef(id1, s1, clipState);

      if (in0 && current.length === 0) {
        current.push(addPoint(ref0, clipState));
      }

      if (in0 && in1) {
        const id = addPoint(ref1, clipState);
        if (current[current.length - 1] !== id) {
          current.push(id);
        }
      } else if (in0 !== in1) {
        const edgeRef = makeEdgeRef(ref0, ref1);
        const edgeId = addPoint(edgeRef, clipState);

        if (current.length === 0 || current[current.length - 1] !== edgeId) {
          current.push(edgeId);
        }

        if (in0) {
          pushCurrent();
        } else {
          current.push(addPoint(ref1, clipState));
        }
      } else {
        pushCurrent();
      }
    }

    pushCurrent();
    return segments;
  }

  /**
   * Clip an ordered polygon loop against the clip half-space.
   *
   * @param {ArrayLike<number>} values
   * @param {number} offset
   * @param {number} npts
   * @param {boolean} insideOut
   * @param {object} clipState
   * @returns {number[]}
   */
  function clipPolygon(values, offset, npts, insideOut, clipState) {
    let polygon = [];
    for (let i = 0; i < npts; i++) {
      const pointId = values[offset + i];
      polygon.push(
        makeOriginalRef(pointId, clipState.inputScalars[pointId], clipState)
      );
    }

    const result = [];
    const count = polygon.length;
    for (let i = 0; i < count; i++) {
      const current = polygon[i];
      const next = polygon[(i + 1) % count];
      const currentInside = isInside(current.scalar, insideOut, model.value);
      const nextInside = isInside(next.scalar, insideOut, model.value);

      if (currentInside && nextInside) {
        result.push(next);
      } else if (currentInside && !nextInside) {
        result.push(makeEdgeRef(current, next));
      } else if (!currentInside && nextInside) {
        result.push(makeEdgeRef(current, next));
        result.push(next);
      }
    }

    polygon = result;
    const polygonPointIds = polygon.map((pointRef) =>
      addPoint(pointRef, clipState)
    );

    const cleanedIds = [];
    for (let i = 0; i < polygonPointIds.length; i++) {
      if (
        cleanedIds.length === 0 ||
        cleanedIds[cleanedIds.length - 1] !== polygonPointIds[i]
      ) {
        cleanedIds.push(polygonPointIds[i]);
      }
    }

    if (
      cleanedIds.length > 1 &&
      cleanedIds[0] === cleanedIds[cleanedIds.length - 1]
    ) {
      cleanedIds.pop();
    }

    return cleanedIds;
  }

  /**
   * Triangulate an ordered clipped polygon with a simple fan.
   *
   * @param {number[]} pointIds
   * @param {vtkCellArray} polys
   * @param {number} inputCellId
   * @param {*} outputCellData
   * @param {object} clipState
   */
  function addTriangulatedPolygon(
    pointIds,
    polys,
    inputCellId,
    outputCellData,
    clipState
  ) {
    if (pointIds.length < 3) {
      return;
    }

    if (pointIds.length === 3) {
      const newCellId = polys.insertNextCell(pointIds);
      outputCellData.passData(clipState.inputCellData, inputCellId, newCellId);
      return;
    }

    for (let i = 1; i < pointIds.length - 1; i++) {
      const newCellId = polys.insertNextCell([
        pointIds[0],
        pointIds[i],
        pointIds[i + 1],
      ]);
      outputCellData.passData(clipState.inputCellData, inputCellId, newCellId);
    }
  }

  /**
   * Process vertex cells. 0D clipping only keeps or discards existing points.
   *
   * @param {vtkCellArray} cellArray
   * @param {vtkCellArray} verts
   * @param {boolean} insideOut
   * @param {*} outputCellData
   * @param {object} clipState
   * @param {number} cellOffset
   */
  function processVerts(
    cellArray,
    verts,
    insideOut,
    outputCellData,
    clipState,
    cellOffset
  ) {
    iterateCellArray(cellArray, (values, offset, npts, localCellId) => {
      for (let i = 0; i < npts; i++) {
        const pointId = values[offset + i];
        const scalar = clipState.inputScalars[pointId];
        if (isInside(scalar, insideOut, model.value)) {
          const newPointId = addPoint(
            makeOriginalRef(pointId, scalar, clipState),
            clipState
          );
          const newCellId = verts.insertNextCell([newPointId]);
          outputCellData.passData(
            clipState.inputCellData,
            cellOffset + localCellId,
            newCellId
          );
        }
      }
    });
  }

  /**
   * Process line or polyline cells, emitting one output line per kept segment.
   *
   * @param {vtkCellArray} cellArray
   * @param {vtkCellArray} lines
   * @param {boolean} insideOut
   * @param {*} outputCellData
   * @param {object} clipState
   * @param {number} cellOffset
   */
  function processLines(
    cellArray,
    lines,
    insideOut,
    outputCellData,
    clipState,
    cellOffset
  ) {
    iterateCellArray(cellArray, (values, offset, npts, localCellId) => {
      const segments = clipPolyline(values, offset, npts, insideOut, clipState);
      segments.forEach((segment) => {
        const newCellId = lines.insertNextCell(segment);
        outputCellData.passData(
          clipState.inputCellData,
          cellOffset + localCellId,
          newCellId
        );
      });
    });
  }

  /**
   * Process polygon cells, using vtkTriangle.clip() for triangles and the
   * polygon fallback path for larger cells.
   *
   * @param {vtkCellArray} cellArray
   * @param {vtkCellArray} polys
   * @param {boolean} insideOut
   * @param {*} outputCellData
   * @param {object} clipState
   * @param {number} cellOffset
   */
  function processPolys(
    cellArray,
    polys,
    insideOut,
    outputCellData,
    clipState,
    cellOffset
  ) {
    const clipTriangle = (id0, id1, id2, inputCellId) => {
      const pointIds = clipState.trianglePointIds;
      pointIds[0] = id0;
      pointIds[1] = id1;
      pointIds[2] = id2;

      const cellScalarsValues = clipState.triangleScalarsValues;
      cellScalarsValues[0] = clipState.inputScalars[id0];
      cellScalarsValues[1] = clipState.inputScalars[id1];
      cellScalarsValues[2] = clipState.inputScalars[id2];

      // clipState.triangleScalars.modified();
      clipState.triangleCell.initialize(clipState.inputPoints, pointIds);
      clipState.triangleCell.clip(
        model.value,
        clipState.triangleScalars,
        model.locator,
        polys,
        clipState.inputPointData,
        clipState.outputPointData,
        clipState.inputCellData,
        inputCellId,
        outputCellData,
        insideOut
      );
    };

    iterateCellArray(cellArray, (values, offset, npts, localCellId) => {
      if (npts === 3) {
        clipTriangle(
          values[offset],
          values[offset + 1],
          values[offset + 2],
          cellOffset + localCellId
        );
        return;
      }

      const polygonIds = clipPolygon(
        values,
        offset,
        npts,
        insideOut,
        clipState
      );
      addTriangulatedPolygon(
        polygonIds,
        polys,
        cellOffset + localCellId,
        outputCellData,
        clipState
      );
    });
  }

  /**
   * Process triangle strips by expanding them into triangles on the fly.
   *
   * @param {vtkCellArray} cellArray
   * @param {vtkCellArray} polys
   * @param {boolean} insideOut
   * @param {*} outputCellData
   * @param {object} clipState
   * @param {number} cellOffset
   */
  function processStrips(
    cellArray,
    polys,
    insideOut,
    outputCellData,
    clipState,
    cellOffset
  ) {
    const clipTriangle = (id0, id1, id2, inputCellId) => {
      const pointIds = clipState.trianglePointIds;
      pointIds[0] = id0;
      pointIds[1] = id1;
      pointIds[2] = id2;

      const cellScalarsValues = clipState.triangleScalarsValues;
      cellScalarsValues[0] = clipState.inputScalars[id0];
      cellScalarsValues[1] = clipState.inputScalars[id1];
      cellScalarsValues[2] = clipState.inputScalars[id2];

      // clipState.triangleScalars.modified();
      clipState.triangleCell.initialize(clipState.inputPoints, pointIds);
      clipState.triangleCell.clip(
        model.value,
        clipState.triangleScalars,
        model.locator,
        polys,
        clipState.inputPointData,
        clipState.outputPointData,
        clipState.inputCellData,
        inputCellId,
        outputCellData,
        insideOut
      );
    };

    iterateCellArray(cellArray, (values, offset, npts, localCellId) => {
      for (let i = 0; i < npts - 2; i++) {
        if (i % 2 === 0) {
          clipTriangle(
            values[offset + i],
            values[offset + i + 1],
            values[offset + i + 2],
            cellOffset + localCellId
          );
        } else {
          clipTriangle(
            values[offset + i + 1],
            values[offset + i],
            values[offset + i + 2],
            cellOffset + localCellId
          );
        }
      }
    });
  }

  function countCells(cellArray) {
    return cellArray?.getNumberOfCells?.() || 0;
  }

  publicAPI.getMTime = () => {
    let mTime = superClass.getMTime();
    if (model.clipFunction) {
      mTime = Math.max(mTime, model.clipFunction.getMTime());
    }
    if (model.locator) {
      mTime = Math.max(mTime, model.locator.getMTime());
    }
    return mTime;
  };

  publicAPI.createDefaultLocator = () => {
    if (!model.locator) {
      model.locator = vtkMergePoints.newInstance();
    }
  };

  publicAPI.getClippedOutput = () => publicAPI.getOutputData(1);

  publicAPI.requestData = (inData, outData) => {
    const input = inData[0];
    const { output, clippedOutput } = buildOutputs(outData);

    if (!input) {
      vtkErrorMacro('No input data');
      return;
    }

    if (!input.getPoints() || input.getNumberOfPoints() < 1) {
      vtkDebugMacro('No data to clip');
      return;
    }

    if (!model.clipFunction && model.generateClipScalars) {
      vtkErrorMacro('Cannot generate clip scalars if no clip function defined');
      return;
    }

    const inputScalars = evaluateImplicitFunction(
      input.getPoints(),
      model.clipFunction
    );
    if (!inputScalars) {
      vtkErrorMacro('Cannot clip without clip function or input scalars');
      return;
    }

    const clipState = createClipState(input, output, clippedOutput);
    clipState.inputScalars = inputScalars;

    const mainVerts = vtkCellArray.newInstance();
    const mainLines = vtkCellArray.newInstance();
    const mainPolys = vtkCellArray.newInstance();

    const clippedVerts = vtkCellArray.newInstance();
    const clippedLines = vtkCellArray.newInstance();
    const clippedPolys = vtkCellArray.newInstance();

    let cellOffset = 0;
    processVerts(
      input.getVerts(),
      mainVerts,
      model.insideOut,
      output.getCellData(),
      clipState,
      cellOffset
    );
    if (model.generateClippedOutput) {
      processVerts(
        input.getVerts(),
        clippedVerts,
        !model.insideOut,
        clippedOutput.getCellData(),
        clipState,
        cellOffset
      );
    }
    cellOffset += countCells(input.getVerts());

    processLines(
      input.getLines(),
      mainLines,
      model.insideOut,
      output.getCellData(),
      clipState,
      cellOffset
    );
    if (model.generateClippedOutput) {
      processLines(
        input.getLines(),
        clippedLines,
        !model.insideOut,
        clippedOutput.getCellData(),
        clipState,
        cellOffset
      );
    }
    cellOffset += countCells(input.getLines());

    processPolys(
      input.getPolys(),
      mainPolys,
      model.insideOut,
      output.getCellData(),
      clipState,
      cellOffset
    );
    if (model.generateClippedOutput) {
      processPolys(
        input.getPolys(),
        clippedPolys,
        !model.insideOut,
        clippedOutput.getCellData(),
        clipState,
        cellOffset
      );
    }
    cellOffset += countCells(input.getPolys());

    processStrips(
      input.getStrips(),
      mainPolys,
      model.insideOut,
      output.getCellData(),
      clipState,
      cellOffset
    );
    if (model.generateClippedOutput) {
      processStrips(
        input.getStrips(),
        clippedPolys,
        !model.insideOut,
        clippedOutput.getCellData(),
        clipState,
        cellOffset
      );
    }

    output.setPoints(clipState.newPoints);
    if (mainVerts.getNumberOfCells() > 0) {
      output.setVerts(mainVerts);
    }
    if (mainLines.getNumberOfCells() > 0) {
      output.setLines(mainLines);
    }
    if (mainPolys.getNumberOfCells() > 0) {
      output.setPolys(mainPolys);
    }

    if (model.generateClipScalars) {
      const clipScalarValues = new Float32Array(
        clipState.newPoints.getNumberOfPoints()
      );
      for (let i = 0; i < clipScalarValues.length; i++) {
        clipScalarValues[i] = Number.isFinite(clipState.clipScalarValues[i])
          ? clipState.clipScalarValues[i]
          : 0;
      }

      output.getPointData().setScalars(
        vtkDataArray.newInstance({
          name: 'ClipScalars',
          values: clipScalarValues,
          numberOfComponents: 1,
        })
      );
    }

    if (model.generateClippedOutput) {
      clippedOutput.setPoints(clipState.newPoints);
      clippedOutput.getPointData().passData(output.getPointData());
      clippedOutput.getFieldData().passData(input.getFieldData());

      if (clippedVerts.getNumberOfCells() > 0) {
        clippedOutput.setVerts(clippedVerts);
      }
      if (clippedLines.getNumberOfCells() > 0) {
        clippedOutput.setLines(clippedLines);
      }
      if (clippedPolys.getNumberOfCells() > 0) {
        clippedOutput.setPolys(clippedPolys);
      }
    }

    vtkDebugMacro(
      `Created: ${clipState.newPoints.getNumberOfPoints()} points, ` +
        `${mainVerts.getNumberOfCells()} verts, ` +
        `${mainLines.getNumberOfCells()} lines, ` +
        `${mainPolys.getNumberOfCells()} polys`
    );
  };
}

const DEFAULT_VALUES = {
  clipFunction: null,
  insideOut: false,
  value: 0,
  generateClipScalars: false,
  generateClippedOutput: false,
  outputPointsPrecision: DesiredOutputPrecision.DEFAULT,
  locator: null,
};

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);
  macro.algo(publicAPI, model, 1, 2);
  macro.setGet(publicAPI, model, [
    'clipFunction',
    'insideOut',
    'value',
    'generateClipScalars',
    'generateClippedOutput',
    'outputPointsPrecision',
    'locator',
  ]);

  vtkClipPolyData(publicAPI, model);
}

export const newInstance = macro.newInstance(extend, 'vtkClipPolyData');

export default { newInstance, extend };
