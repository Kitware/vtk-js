import macro       from 'vtk.js/Sources/macro';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

var vtkCaseTable = require('vtk.js/Sources/Filters/General/ImageMarchingCubes/caseTable');

const { vtkErrorMacro, vtkDebugMacro } = macro;

// import mappingFunctions from './mappingFunctions';

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
  publicAPI.getVoxelScalars = (i, j, k, dims, origin, spacing, s) => {
    // First get the indices for the voxel
    ids[0] = (k * dims[0] * dims[1]) + (j * dims[0]) + i; // i, j, k
    ids[1] = ids[0] + 1; // i+1, j, k
    ids[2] = ids[0] + dims[0]; // i, j+1, k
    ids[3] = ids[2] + 1; // i+1, j+1, k
    ids[4] = ids[0] + (dims[0] * dims[1]); // i, j, k+1
    ids[5] = ids[4] + 1; // i+1, j, k+1
    ids[6] = ids[4] + dims[0]; // i, j+1, k+1
    ids[7] = ids[6] + 1; // i+1, j+1, k+1

    // Now retrieve the scalars
    for (let ii = 0; ii < 8; ++ii) {
      voxelScalars[ii] = s.getTuple(ids[ii]);
    }
  };

  // Retrieve voxel coordinates
  publicAPI.getVoxelPoints = (i, j, k, dims, origin, spacing, s) => {
    // (i,i+1),(j,j+1),(k,k+1) - i varies fastest; then j; then k
    voxelPts[0] = origin[0] + (i * spacing[0]); // 0
    voxelPts[1] = origin[1] + (j * spacing[1]);
    voxelPts[2] = origin[2] + (k * spacing[2]);
    voxelPts[3] = origin[0] + ((i + 1) * spacing[0]);// 1
    voxelPts[4] = origin[1] + (j * spacing[1]);
    voxelPts[5] = origin[2] + (k * spacing[2]);
    voxelPts[6] = origin[0] + (i * spacing[0]); // 2
    voxelPts[7] = origin[1] + ((j + 1) * spacing[1]);
    voxelPts[8] = origin[2] + (k * spacing[2]);
    voxelPts[9] = origin[0] + ((i + 1) * spacing[0]); // 3
    voxelPts[10] = origin[1] + ((j + 1) * spacing[1]);
    voxelPts[11] = origin[2] + (k * spacing[2]);
    voxelPts[12] = origin[0] + (i * spacing[0]); // 4
    voxelPts[13] = origin[1] + (j * spacing[1]);
    voxelPts[14] = origin[2] + ((k + 1) * spacing[2]);
    voxelPts[15] = origin[0] + ((i + 1) * spacing[0]); // 5
    voxelPts[16] = origin[1] + (j * spacing[1]);
    voxelPts[17] = origin[2] + ((k + 1) * spacing[2]);
    voxelPts[18] = origin[0] + (i * spacing[0]); // 6
    voxelPts[19] = origin[1] + ((j + 1) * spacing[1]);
    voxelPts[20] = origin[2] + ((k + 1) * spacing[2]);
    voxelPts[21] = origin[0] + ((i + 1) * spacing[0]); // 7
    voxelPts[22] = origin[1] + ((j + 1) * spacing[1]);
    voxelPts[23] = origin[2] + ((k + 1) * spacing[2]);
  };

  publicAPI.produceTriangles = (cVal, i, j, k, dims, origin, spacing, scalars, points, tris) => {
    const CASE_MASK = [1, 2, 4, 8, 16, 32, 64, 128];
    const VERT_MAP = [0, 1, 3, 2, 4, 5, 7, 6];
    const xyz = new Float32Array(3);
    let pId;
    publicAPI.getVoxelScalars(i, j, k, dims, origin, spacing, scalars);

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
        points.push(...xyz);
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

    // Retrieve output and volume data
    const origin = input.getOrigin();
    const spacing = input.getSpacing();
    const dims = input.getDimensions();
    const s = input.getPointData().getScalars();

    // Prepare the output
    const pd = vtkPolyData.newInstance();
    outData[0] = pd;

    // Points - dynamic array
    const pBuffer = [];

    // Cells - dynamic array
    const tBuffer = [];

    // Loop over all voxels, determine case and process
    for (let k = 0; k < (dims[2] - 1); ++k) {
      for (let j = 0; j < (dims[1] - 1); ++j) {
        for (let i = 0; i < (dims[0] - 2); ++i) {
          publicAPI.produceTriangles(model.contourValue, i, j, k, dims, origin, spacing, s, pBuffer, tBuffer);
        }
      }
    }

    // Update output
    const points = new window.Float32Array(pBuffer);
    pd.getPoints().setData(points, 3);
    const tris = new Uint32Array(tBuffer);
    pd.getPolys().setData(tris, 1);

    vtkDebugMacro('Produced output');
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
