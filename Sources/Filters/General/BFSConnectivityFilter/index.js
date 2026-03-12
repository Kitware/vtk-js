import macro from 'vtk.js/Sources/macros';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import Constants from './Constants';

const { ExtractionMode } = Constants;

function runBFS(polyData) {
  if (!polyData.getLinks()) {
    polyData.buildLinks();
  }
  const polys = polyData.getPolys().getData();
  const numCells = polyData.getNumberOfCells();

  const cellOffsets = new Uint32Array(numCells);
  let offset = 0;
  for (let i = 0; i < numCells; i++) {
    cellOffsets[i] = offset;
    const n = polys[offset];
    offset += n + 1;
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
        const pts = polyData.getCellPoints(cellId).cellPointIds;
        for (let j = 0; j < pts.length; j++) {
          const neighborCells = polyData.getPointCells(pts[j]);
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

function vtkBFSConnectivityFilter(publicAPI, model) {
  model.classHierarchy.push('vtkBFSConnectivityFilter');

  publicAPI.requestData = (inData, outData) => {
    const input = inData[0];

    if (!input) {
      return;
    }

    console.time(`BFSConnectivityFilter`);

    const output = outData[0] || vtkPolyData.newInstance();

    // 1.  BFS
    const { regions, cellOffsets } = runBFS(input);
    if (regions.length === 0) return;

    // 2. sort regions
    const sortRegions = regions.sort((a, b) => b.length - a.length);
    model.regionsCount = sortRegions.length;

    // 3. select region
    let cells = null;
    if (model.extractionMode === ExtractionMode.ExtractionMode_ALL) {
      cells = sortRegions.flatMap((arr) => Array.from(arr));
    } else if (
      model.extractionMode === ExtractionMode.ExtractionMode_SMALLEST
    ) {
      cells = sortRegions[sortRegions.length - 1];
    } else if (model.extractionMode === ExtractionMode.ExtractionMode_CUSTOM) {
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

    console.timeEnd(`BFSConnectivityFilter`);
  };

  publicAPI.setExtractionModeToAll = () => {
    publicAPI.setExtractionMode(ExtractionMode.ExtractionMode_ALL);
  };

  publicAPI.setExtractionModeToLargest = () => {
    publicAPI.setExtractionMode(ExtractionMode.ExtractionMode_LARGEST);
  };

  publicAPI.setExtractionModeToSmallest = () => {
    publicAPI.setExtractionMode(ExtractionMode.ExtractionMode_SMALLEST);
  };

  publicAPI.setExtractionModeToCustom = () => {
    publicAPI.setExtractionMode(ExtractionMode.ExtractionMode_CUSTOM);
  };

  publicAPI.getRegionsCount = () => model.regionsCount;

  publicAPI.setRegionsCount = () => {
    console.log('can not set RegionsCount');
  };
}

const DEFAULT_VALUES = {
  extractionMode: ExtractionMode.ExtractionMode_ALL,
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

  vtkBFSConnectivityFilter(publicAPI, model);
}

export const newInstance = macro.newInstance(
  extend,
  'vtkBFSConnectivityFilter'
);

export default { newInstance, extend };
