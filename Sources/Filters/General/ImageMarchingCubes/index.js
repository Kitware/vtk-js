import macro       from 'vtk.js/Sources/macro';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

import vtkCaseTable from './caseTable';

const { vtkErrorMacro, vtkDebugMacro } = macro;

// ----------------------------------------------------------------------------
// vtkImageMarchingCubes methods
// ----------------------------------------------------------------------------

function vtkImageMarchingCubes(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageMarchingCubes');

  const ids = new Int32Array(8);
  const voxelScalars = new Float32Array(8);
  const voxelPts = new Float32Array(24);

  // Retrieve scalars and voxel coordinates
  publicAPI.getVoxelScalars = (i, j, k, slice, dims, origin, spacing, s) => {
    // First get the indices for the voxel
    ids[0] = (k * slice) + (j * dims[0]) + i; // i, j, k
    ids[1] = ids[0] + 1; // i+1, j, k
    ids[2] = ids[0] + dims[0]; // i, j+1, k
    ids[3] = ids[2] + 1; // i+1, j+1, k
    ids[4] = ids[0] + slice; // i, j, k+1
    ids[5] = ids[4] + 1; // i+1, j, k+1
    ids[6] = ids[4] + dims[0]; // i, j+1, k+1
    ids[7] = ids[6] + 1; // i+1, j+1, k+1

    // Now retrieve the scalars
    for (let ii = 0; ii < 8; ++ii) {
      voxelScalars[ii] = s[ids[ii]];
    }
  };

  // Retrieve voxel coordinates
  publicAPI.getVoxelPoints = (i, j, k, dims, origin, spacing, s) => {
    // (i,i+1),(j,j+1),(k,k+1) - i varies fastest; then j; then k
    voxelPts[0] = origin[0] + (i * spacing[0]); // 0
    voxelPts[1] = origin[1] + (j * spacing[1]);
    voxelPts[2] = origin[2] + (k * spacing[2]);
    voxelPts[3] = voxelPts[0] + spacing[0];// 1
    voxelPts[4] = voxelPts[1];
    voxelPts[5] = voxelPts[2];
    voxelPts[6] = voxelPts[0]; // 2
    voxelPts[7] = voxelPts[1] + spacing[1];
    voxelPts[8] = voxelPts[2];
    voxelPts[9] = voxelPts[3]; // 3
    voxelPts[10] = voxelPts[7];
    voxelPts[11] = voxelPts[2];
    voxelPts[12] = voxelPts[0]; // 4
    voxelPts[13] = voxelPts[1];
    voxelPts[14] = voxelPts[2] + spacing[2];
    voxelPts[15] = voxelPts[3]; // 5
    voxelPts[16] = voxelPts[1];
    voxelPts[17] = voxelPts[14];
    voxelPts[18] = voxelPts[0]; // 6
    voxelPts[19] = voxelPts[7];
    voxelPts[20] = voxelPts[14];
    voxelPts[21] = voxelPts[3]; // 7
    voxelPts[22] = voxelPts[7];
    voxelPts[23] = voxelPts[14];
  };

  publicAPI.produceTriangles = (cVal, i, j, k, slice, dims, origin, spacing, scalars, points, tris) => {
    const CASE_MASK = [1, 2, 4, 8, 16, 32, 64, 128];
    const VERT_MAP = [0, 1, 3, 2, 4, 5, 7, 6];
    const xyz = [];
    let pId;

    publicAPI.getVoxelScalars(i, j, k, slice, dims, origin, spacing, scalars);

    let index = 0;
    for (let idx = 0; idx < 8; idx++) {
      if (voxelScalars[VERT_MAP[idx]] >= cVal) {
        index |= CASE_MASK[idx]; // eslint-disable-line no-bitwise
      }
    }

    const voxelTris = vtkCaseTable.getCase(index);
    if (voxelTris[0] < 0) {
      return; // don't get the voxel coordinates, nothing to do
    }
    publicAPI.getVoxelPoints(i, j, k, dims, origin, spacing);

    for (let idx = 0; voxelTris[idx] >= 0; idx += 3) {
      tris.push(3);
      for (let eid = 0; eid < 3; eid++) {
        const edgeVerts = vtkCaseTable.getEdge(voxelTris[idx + eid]);
        const t = (cVal - voxelScalars[edgeVerts[0]]) /
          (voxelScalars[edgeVerts[1]] - voxelScalars[edgeVerts[0]]);
        const x0 = voxelPts.slice(edgeVerts[0] * 3, (edgeVerts[0] + 1) * 3);
        const x1 = voxelPts.slice(edgeVerts[1] * 3, (edgeVerts[1] + 1) * 3);
        xyz[0] = x0[0] + (t * (x1[0] - x0[0]));
        xyz[1] = x0[1] + (t * (x1[1] - x0[1]));
        xyz[2] = x0[2] + (t * (x1[2] - x0[2]));
        pId = points.length / 3;
        points.push(xyz[0], xyz[1], xyz[2]);
        tris.push(pId);
      }
    }
  };

  publicAPI.requestData = (inData, outData) => { // implement requestData
    const input = inData[0];

    if (!input) {
      vtkErrorMacro('Invalid or missing input');
      return;
    }

    console.time('mcubes');

    // Retrieve output and volume data
    const origin = input.getOrigin();
    const spacing = input.getSpacing();
    const dims = input.getDimensions();
    const s = input.getPointData().getScalars().getData();

    // Points - dynamic array
    const pBuffer = [];

    // Cells - dynamic array
    const tBuffer = [];

    // Loop over all voxels, determine case and process
    const slice = dims[0] * dims[1];
    for (let k = 0; k < (dims[2] - 1); ++k) {
      for (let j = 0; j < (dims[1] - 1); ++j) {
        for (let i = 0; i < (dims[0] - 1); ++i) {
          publicAPI.produceTriangles(model.contourValue, i, j, k, slice, dims, origin, spacing, s, pBuffer, tBuffer);
        }
      }
    }

    // Update output
    const polydata = vtkPolyData.newInstance();
    polydata.getPoints().setData(new Float32Array(pBuffer), 3);
    polydata.getPolys().setData(new Uint32Array(tBuffer));
    outData[0] = polydata;

    vtkDebugMacro('Produced output');
    console.timeEnd('mcubes');
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  contourValue: 0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 1, 1);

  macro.setGet(publicAPI, model, [
    'contourValue',
  ]);

  // Object specific methods
  macro.algo(publicAPI, model, 1, 1);
  vtkImageMarchingCubes(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImageMarchingCubes');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
