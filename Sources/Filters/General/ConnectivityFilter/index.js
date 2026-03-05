import macro from 'vtk.js/Sources/macros';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

function runBFS(polyData) {
  const polys = polyData.getPolys().getData();
  const numCells = polyData.getNumberOfCells();
  const numPoints = polyData.getNumberOfPoints();

  // CellToPoints mapping
  const cellToPoints = new Array(numCells);
  const cellOffsets = new Uint32Array(numCells);
  let offset = 0;
  for (let i = 0; i < numCells; i++) {
    cellOffsets[i] = offset;
    const n = polys[offset];
    cellToPoints[i] = polys.subarray(offset + 1, offset + 1 + n);
    offset += n + 1;
  }

  // PointToCells mapping
  const pointToCells = Array.from({ length: numPoints }, () => []);
  for (let i = 0; i < numCells; i++) {
    const pts = cellToPoints[i];
    for (let j = 0; j < pts.length; j++) {
      pointToCells[pts[j]].push(i);
    }
  }

  const visited = new Uint8Array(numCells);
  const regions = [];

  for (let i = 0; i < numCells; i++) {
    if (!visited[i]) {
      const component = [];
      const queue = [i];
      visited[i] = 1;
      let head = 0;
      while (head < queue.length) {
        const cellId = queue[head++];
        component.push(cellId);
        const pts = cellToPoints[cellId];
        for (let j = 0; j < pts.length; j++) {
          const neighborCells = pointToCells[pts[j]];
          for (let k = 0; k < neighborCells.length; k++) {
            const neighborId = neighborCells[k];
            if (!visited[neighborId]) {
              visited[neighborId] = 1;
              queue.push(neighborId);
            }
          }
        }
      }
      regions.push(new Uint32Array(component));
    }
  }
  return { regions, cellOffsets };
}

const ExtractionMode = {
  All: 0,
  Largest: 1,
  Smallest: 2,
  Custom: 3,
};

function vtkConnectivityFilter(publicAPI, model) {
  model.classHierarchy.push('vtkConnectivityFilter');

  publicAPI.requestData = (inData, outData) => {
    const input = inData[0];

    if (!input) {
      return;
    }

    console.time(`ConnectivityFilter`);

    const output = outData[0] || vtkPolyData.newInstance();

    // 1.  BFS
    const { regions, cellOffsets } = runBFS(input);
    if (regions.length === 0) return;

    // 2. sort regions
    const sortRegions = regions.sort((a, b) => b.length - a.length);
    model.regionsCount = sortRegions.length;

    // 3. select region
    let cells = null;
    if (model.extractionMode === ExtractionMode.All) {
      cells = sortRegions.flatMap((arr) => Array.from(arr));
    } else if (model.extractionMode === ExtractionMode.Smallest) {
      cells = sortRegions[sortRegions.length - 1];
    } else if (model.extractionMode === ExtractionMode.Custom) {
      if (
        model.extractionIndex >= 0 &&
        model.extractionIndex < model.regionsCount
      ) {
        cells = sortRegions[model.extractionIndex];
      }
    } else {
      // Largest
      cells = sortRegions[0];
    }

    // 4. build ouput
    const oldPolys = input.getPolys().getData();
    const polyType = input.getPolys().getDataType();

    const oldPoints = input.getPoints().getData();
    const pointType = input.getPoints().getDataType();
    const newPointsData = [];
    const newPolysData = [];
    const pointMap = new Map();
    let pointCounter = 0;

    for (let i = 0; i < cells.length; i++) {
      const cellId = cells[i];
      const offset = cellOffsets[cellId];
      const n = oldPolys[offset];
      newPolysData.push(n);
      for (let j = 0; j < n; j++) {
        const oldPtId = oldPolys[offset + 1 + j];
        if (!pointMap.has(oldPtId)) {
          pointMap.set(oldPtId, pointCounter);
          const pIdx = oldPtId * 3;
          newPointsData.push(
            oldPoints[pIdx],
            oldPoints[pIdx + 1],
            oldPoints[pIdx + 2]
          );
          pointCounter++;
        }
        newPolysData.push(pointMap.get(oldPtId));
      }
    }

    output.setPoints(
      vtkPoints.newInstance({
        values: newPointsData,
        numberOfComponents: 3,
        dataType: pointType,
      })
    );

    const polys = vtkCellArray.newInstance({
      values: newPolysData,
      dataType: polyType,
    });
    output.setPolys(polys);

    outData[0] = output;

    console.timeEnd(`ConnectivityFilter`);
  };

  publicAPI.setExtractionModeToAll = () => {
    publicAPI.setExtractionMode(ExtractionMode.All);
  };

  publicAPI.setExtractionModeToLargest = () => {
    publicAPI.setExtractionMode(ExtractionMode.Largest);
  };

  publicAPI.setExtractionModeToSmallest = () => {
    publicAPI.setExtractionMode(ExtractionMode.Smallest);
  };

  publicAPI.setExtractionModeToCustom = () => {
    publicAPI.setExtractionMode(ExtractionMode.Custom);
  };

  publicAPI.getRegionsCount = () => model.regionsCount;
}

const DEFAULT_VALUES = {
  extractionMode: ExtractionMode.All,
  extractionIndex: 0,
  regionsCount: 0,
};

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);
  macro.algo(publicAPI, model, 1, 1);

  macro.setGet(publicAPI, model, [
    'extractionMode',
    'extractionIndex',
    'regionsCount',
  ]);

  vtkConnectivityFilter(publicAPI, model);
}

export const newInstance = macro.newInstance(extend, 'vtkConnectivityFilter');

export default { newInstance, extend };
