import macro from 'vtk.js/Sources/macros';
import Constants from 'vtk.js/Sources/Rendering/WebGPU/BufferManager/Constants';
import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';
import vtkWebGPUBuffer from 'vtk.js/Sources/Rendering/WebGPU/Buffer';

const { Representation } = vtkProperty;
const { PrimitiveTypes } = Constants;

// Simulate a small map of pointId to flatId for a cell. The original code
// used a map and was 2.6x slower (4.7 to 1.9 seconds). Using two fixed
// length arrays with a count is so much faster even with the required for
// loops and if statements. This only works as we know the usage is
// restricted to clear(), set() get() and has() so the count is always
// incrmenting except for clear where it goes back to 0. Performance
// improvement is probably due to this appoach not hitting the heap but wow
// it is so much faster. Code that adds to these vectors checks against 9 to
// make sure there is room. Switching to test against vec.length -1 results
// in a small performance hit, so if you change 10, search for 9 in this
// small class and change those as well.
class _LimitedMap {
  constructor() {
    this.keys = new Uint32Array(10);
    this.values = new Uint32Array(10);
    this.count = 0;
  }

  clear() {
    this.count = 0;
  }

  has(key) {
    for (let i = 0; i < this.count; i++) {
      if (this.keys[i] === key) {
        return true;
      }
    }
    return undefined;
  }

  get(key) {
    for (let i = 0; i < this.count; i++) {
      if (this.keys[i] === key) {
        return this.values[i];
      }
    }
    return undefined;
  }

  set(key, value) {
    if (this.count < 9) {
      this.keys[this.count] = key;
      this.values[this.count++] = value;
    }
  }
}

function getPrimitiveName(primType) {
  switch (primType) {
    case PrimitiveTypes.Points:
      return 'points';
    case PrimitiveTypes.Lines:
      return 'lines';
    case PrimitiveTypes.Triangles:
    case PrimitiveTypes.TriangleEdges:
      return 'polys';
    case PrimitiveTypes.TriangleStripEdges:
    case PrimitiveTypes.TriangleStrips:
      return 'strips';
    default:
      return '';
  }
}

function _getOrAddFlatId(state, ptId, cellId) {
  let flatId = state.pointIdToFlatId[ptId];
  if (flatId < 0) {
    flatId = state.flatId;
    state.pointIdToFlatId[ptId] = flatId;
    state.flatIdToPointId[state.flatId] = ptId;
    state.flatIdToCellId[state.flatId] = cellId;
    state.flatId++;
  }
  return flatId;
}

function fillCell(ptIds, cellId, state) {
  const numPtIds = ptIds.length;
  // are any points already marked for this cell? If so use that as the provoking point
  for (let ptIdx = 0; ptIdx < numPtIds; ptIdx++) {
    let ptId = ptIds[ptIdx];
    if (state.cellProvokedMap.has(ptId)) {
      state.ibo[state.iboId++] = state.cellProvokedMap.get(ptId);

      // insert remaining ptIds (they do not need to provoke)
      for (let ptIdx2 = ptIdx + 1; ptIdx2 < ptIdx + numPtIds; ptIdx2++) {
        ptId = ptIds[ptIdx2 % numPtIds];
        const flatId = _getOrAddFlatId(state, ptId, cellId);
        // add to ibo
        state.ibo[state.iboId++] = flatId;
      }
      // all done now
      return;
    }
  }

  // else have any of the points not been used yet? (not in provokedPointIds)
  for (let ptIdx = 0; ptIdx < numPtIds; ptIdx++) {
    let ptId = ptIds[ptIdx];
    if (!state.provokedPointIds[ptId]) {
      let flatId = _getOrAddFlatId(state, ptId, cellId);
      // mark provoking and add to ibo
      state.provokedPointIds[ptId] = 1;
      state.cellProvokedMap.set(ptId, flatId);
      // when provoking always set the cellId as an original non-provoking value
      // will have been stored and we need to overwrite that
      state.flatIdToCellId[flatId] = cellId;
      state.ibo[state.iboId++] = flatId;

      // insert remaining ptIds (they do not need to provoke)
      for (let ptIdx2 = ptIdx + 1; ptIdx2 < ptIdx + numPtIds; ptIdx2++) {
        ptId = ptIds[ptIdx2 % numPtIds];
        flatId = _getOrAddFlatId(state, ptId, cellId);
        // add to ibo
        state.ibo[state.iboId++] = flatId;
      }
      // all done now
      return;
    }
  }

  // if we got here then none of the ptIds could be used to provoke
  // so just duplicate the first one
  let ptId = ptIds[0];
  let flatId = state.flatId;
  state.cellProvokedMap.set(ptId, flatId);
  state.flatIdToPointId[state.flatId] = ptId;
  state.flatIdToCellId[state.flatId] = cellId;
  state.flatId++;

  // add to ibo
  state.ibo[state.iboId++] = flatId;

  // insert remaining ptIds (they do not need to provoke)
  for (let ptIdx2 = 1; ptIdx2 < numPtIds; ptIdx2++) {
    ptId = ptIds[ptIdx2];
    flatId = _getOrAddFlatId(state, ptId, cellId);
    // add to ibo
    state.ibo[state.iboId++] = flatId;
  }
}

function countCell(ptIds, cellId, state) {
  const numPtIds = ptIds.length;
  state.iboSize += numPtIds;

  // are any points already marked for this cell? If so use that as the provoking point
  for (let ptIdx = 0; ptIdx < numPtIds; ptIdx++) {
    const ptId = ptIds[ptIdx];
    if (state.cellProvokedMap.has(ptId)) {
      return;
    }
  }

  // else have any of the points not been used yet? (not in provokedPointIds)
  for (let ptIdx = 0; ptIdx < numPtIds; ptIdx++) {
    const ptId = ptIds[ptIdx];
    if (!state.provokedPointIds[ptId]) {
      state.provokedPointIds[ptId] = 1;
      state.cellProvokedMap.set(ptId, 1);
      return;
    }
  }
  // if we got here then none of the ptIds could be used to provoke
  state.cellProvokedMap.set(ptIds[0], 1);
  state.extraPoints++;
}

let processCell;

const _single = new Uint32Array(1);
const _double = new Uint32Array(2);
const _triple = new Uint32Array(3);
const _indexCellBuilders = {
  // easy, every input point becomes an output point
  anythingToPoints(numPoints, cellPts, offset, cellId, state) {
    for (let i = 0; i < numPoints; ++i) {
      _single[0] = cellPts[offset + i];
      processCell(_single, cellId, state);
    }
  },
  linesToWireframe(numPoints, cellPts, offset, cellId, state) {
    // for lines we add a bunch of segments
    for (let i = 0; i < numPoints - 1; ++i) {
      _double[0] = cellPts[offset + i];
      _double[1] = cellPts[offset + i + 1];
      processCell(_double, cellId, state);
    }
  },
  polysToWireframe(numPoints, cellPts, offset, cellId, state) {
    // for polys we add a bunch of segments and close it
    if (numPoints > 2) {
      for (let i = 0; i < numPoints; ++i) {
        _double[0] = cellPts[offset + i];
        _double[1] = cellPts[offset + ((i + 1) % numPoints)];
        processCell(_double, cellId, state);
      }
    }
  },
  stripsToWireframe(numPoints, cellPts, offset, cellId, state) {
    if (numPoints > 2) {
      // for strips we add a bunch of segments and close it
      for (let i = 0; i < numPoints - 1; ++i) {
        _double[0] = cellPts[offset + i];
        _double[1] = cellPts[offset + i + 1];
        processCell(_double, cellId, state);
      }
      for (let i = 0; i < numPoints - 2; i++) {
        _double[0] = cellPts[offset + i];
        _double[1] = cellPts[offset + i + 2];
        processCell(_double, cellId, state);
      }
    }
  },
  polysToSurface(npts, cellPts, offset, cellId, state) {
    for (let i = 0; i < npts - 2; i++) {
      _triple[0] = cellPts[offset];
      _triple[1] = cellPts[offset + i + 1];
      _triple[2] = cellPts[offset + i + 2];
      processCell(_triple, cellId, state);
    }
  },
  stripsToSurface(npts, cellPts, offset, cellId, state) {
    for (let i = 0; i < npts - 2; i++) {
      _triple[0] = cellPts[offset + i];
      _triple[1] = cellPts[offset + i + 1 + (i % 2)];
      _triple[2] = cellPts[offset + i + 1 + ((i + 1) % 2)];
      processCell(_triple, cellId, state);
    }
  },
};

// ----------------------------------------------------------------------------
// vtkWebGPUIndexBufferManager methods
// ----------------------------------------------------------------------------

function vtkWebGPUIndexBuffer(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUIndexBuffer');

  publicAPI.buildIndexBuffer = (req) => {
    const cellArray = req.cells;
    const primitiveType = req.primitiveType;
    const representation = req.representation;
    const cellOffset = req.cellOffset;

    const array = cellArray.getData();
    const cellArraySize = array.length;

    const inRepName = getPrimitiveName(primitiveType);

    const numPts = req.numberOfPoints;
    const state = {
      provokedPointIds: new Uint8Array(numPts), // size is good
      extraPoints: 0,
      iboSize: 0,
      flatId: 0,
      iboId: 0,
      cellProvokedMap: new _LimitedMap(),
    };

    let func = null;
    if (
      representation === Representation.POINTS ||
      primitiveType === PrimitiveTypes.Points
    ) {
      func = _indexCellBuilders.anythingToPoints;
    } else if (
      representation === Representation.WIREFRAME ||
      primitiveType === PrimitiveTypes.Lines
    ) {
      func = _indexCellBuilders[`${inRepName}ToWireframe`];
    } else {
      func = _indexCellBuilders[`${inRepName}ToSurface`];
    }

    // first we count how many extra provoking points we need
    processCell = countCell;
    let cellId = cellOffset || 0;
    for (let cellArrayIndex = 0; cellArrayIndex < cellArraySize; ) {
      state.cellProvokedMap.clear();
      func(array[cellArrayIndex], array, cellArrayIndex + 1, cellId, state);
      cellArrayIndex += array[cellArrayIndex] + 1;
      cellId++;
    }

    // then we allocate the remaining structures
    // (we pick the best size to save space and transfer costs)
    if (numPts <= 0xffff) {
      state.flatIdToPointId = new Uint16Array(numPts + state.extraPoints);
    } else {
      state.flatIdToPointId = new Uint32Array(numPts + state.extraPoints);
    }
    if (numPts + state.extraPoints < 0x8fff) {
      state.pointIdToFlatId = new Int16Array(numPts);
    } else {
      state.pointIdToFlatId = new Int32Array(numPts);
    }
    if (numPts + state.extraPoints <= 0xffff) {
      state.ibo = new Uint16Array(state.iboSize);
      req.format = 'uint16';
    } else {
      state.ibo = new Uint32Array(state.iboSize);
      req.format = 'uint32';
    }
    if (cellId <= 0xffff) {
      state.flatIdToCellId = new Uint16Array(numPts + state.extraPoints);
    } else {
      state.flatIdToCellId = new Uint32Array(numPts + state.extraPoints);
    }
    state.pointIdToFlatId.fill(-1);
    state.provokedPointIds.fill(0);

    // and fill them in
    processCell = fillCell;
    cellId = cellOffset || 0;
    for (let cellArrayIndex = 0; cellArrayIndex < cellArraySize; ) {
      state.cellProvokedMap.clear();
      func(array[cellArrayIndex], array, cellArrayIndex + 1, cellId, state);
      cellArrayIndex += array[cellArrayIndex] + 1;
      cellId++;
    }

    delete state.provokedPointIds;
    delete state.pointIdToFlatId;

    // store the results we need
    req.nativeArray = state.ibo;
    model.flatIdToPointId = state.flatIdToPointId;
    model.flatIdToCellId = state.flatIdToCellId;
    model.flatSize = state.flatId;
    model.indexCount = state.iboId;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  flatIdToPointId: null,
  flatIdToCellId: null,
  flatSize: 0,
  indexCount: 0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkWebGPUBuffer.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, [
    'flatIdToPointId',
    'flatIdToCellId',
    'flatSize',
    'indexCount',
  ]);

  vtkWebGPUIndexBuffer(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...Constants };
