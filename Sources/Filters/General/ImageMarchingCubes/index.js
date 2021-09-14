import macro from 'vtk.js/Sources/macros';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

import vtkCaseTable from './caseTable';

const { vtkErrorMacro, vtkDebugMacro } = macro;

// ----------------------------------------------------------------------------
// vtkImageMarchingCubes methods
// ----------------------------------------------------------------------------

function vtkImageMarchingCubes(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageMarchingCubes');

  const ids = [];
  const voxelScalars = [];
  const voxelGradients = [];
  const voxelPts = [];
  const edgeMap = new Map();

  // Retrieve scalars and voxel coordinates. i-j-k is origin of voxel.
  publicAPI.getVoxelScalars = (i, j, k, slice, dims, origin, spacing, s) => {
    // First get the indices for the voxel
    ids[0] = k * slice + j * dims[0] + i; // i, j, k
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

  // Retrieve voxel coordinates. i-j-k is origin of voxel.
  publicAPI.getVoxelPoints = (i, j, k, origin, spacing) => {
    // (i,i+1),(j,j+1),(k,k+1) - i varies fastest; then j; then k
    voxelPts[0] = origin[0] + i * spacing[0]; // 0
    voxelPts[1] = origin[1] + j * spacing[1];
    voxelPts[2] = origin[2] + k * spacing[2];
    voxelPts[3] = voxelPts[0] + spacing[0]; // 1
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

  // Compute point gradient at i-j-k location
  publicAPI.getPointGradient = (i, j, k, dims, slice, spacing, s, g) => {
    let sp;
    let sm;

    // x-direction
    if (i === 0) {
      sp = s[i + 1 + j * dims[0] + k * slice];
      sm = s[i + j * dims[0] + k * slice];
      g[0] = (sm - sp) / spacing[0];
    } else if (i === dims[0] - 1) {
      sp = s[i + j * dims[0] + k * slice];
      sm = s[i - 1 + j * dims[0] + k * slice];
      g[0] = (sm - sp) / spacing[0];
    } else {
      sp = s[i + 1 + j * dims[0] + k * slice];
      sm = s[i - 1 + j * dims[0] + k * slice];
      g[0] = (0.5 * (sm - sp)) / spacing[0];
    }

    // y-direction
    if (j === 0) {
      sp = s[i + (j + 1) * dims[0] + k * slice];
      sm = s[i + j * dims[0] + k * slice];
      g[1] = (sm - sp) / spacing[1];
    } else if (j === dims[1] - 1) {
      sp = s[i + j * dims[0] + k * slice];
      sm = s[i + (j - 1) * dims[0] + k * slice];
      g[1] = (sm - sp) / spacing[1];
    } else {
      sp = s[i + (j + 1) * dims[0] + k * slice];
      sm = s[i + (j - 1) * dims[0] + k * slice];
      g[1] = (0.5 * (sm - sp)) / spacing[1];
    }

    // z-direction
    if (k === 0) {
      sp = s[i + j * dims[0] + (k + 1) * slice];
      sm = s[i + j * dims[0] + k * slice];
      g[2] = (sm - sp) / spacing[2];
    } else if (k === dims[2] - 1) {
      sp = s[i + j * dims[0] + k * slice];
      sm = s[i + j * dims[0] + (k - 1) * slice];
      g[2] = (sm - sp) / spacing[2];
    } else {
      sp = s[i + j * dims[0] + (k + 1) * slice];
      sm = s[i + j * dims[0] + (k - 1) * slice];
      g[2] = (0.5 * (sm - sp)) / spacing[2];
    }
  };

  // Compute voxel gradient values. I-j-k is origin point of voxel.
  publicAPI.getVoxelGradients = (i, j, k, dims, slice, spacing, scalars) => {
    const g = [];

    publicAPI.getPointGradient(i, j, k, dims, slice, spacing, scalars, g);
    voxelGradients[0] = g[0];
    voxelGradients[1] = g[1];
    voxelGradients[2] = g[2];
    publicAPI.getPointGradient(i + 1, j, k, dims, slice, spacing, scalars, g);
    voxelGradients[3] = g[0];
    voxelGradients[4] = g[1];
    voxelGradients[5] = g[2];
    publicAPI.getPointGradient(i, j + 1, k, dims, slice, spacing, scalars, g);
    voxelGradients[6] = g[0];
    voxelGradients[7] = g[1];
    voxelGradients[8] = g[2];
    publicAPI.getPointGradient(
      i + 1,
      j + 1,
      k,
      dims,
      slice,
      spacing,
      scalars,
      g
    );
    voxelGradients[9] = g[0];
    voxelGradients[10] = g[1];
    voxelGradients[11] = g[2];
    publicAPI.getPointGradient(i, j, k + 1, dims, slice, spacing, scalars, g);
    voxelGradients[12] = g[0];
    voxelGradients[13] = g[1];
    voxelGradients[14] = g[2];
    publicAPI.getPointGradient(
      i + 1,
      j,
      k + 1,
      dims,
      slice,
      spacing,
      scalars,
      g
    );
    voxelGradients[15] = g[0];
    voxelGradients[16] = g[1];
    voxelGradients[17] = g[2];
    publicAPI.getPointGradient(
      i,
      j + 1,
      k + 1,
      dims,
      slice,
      spacing,
      scalars,
      g
    );
    voxelGradients[18] = g[0];
    voxelGradients[19] = g[1];
    voxelGradients[20] = g[2];
    publicAPI.getPointGradient(
      i + 1,
      j + 1,
      k + 1,
      dims,
      slice,
      spacing,
      scalars,
      g
    );
    voxelGradients[21] = g[0];
    voxelGradients[22] = g[1];
    voxelGradients[23] = g[2];
  };

  publicAPI.produceTriangles = (
    cVal,
    i,
    j,
    k,
    extent,
    slice,
    dims,
    origin,
    spacing,
    scalars,
    points,
    tris,
    normals
  ) => {
    const CASE_MASK = [1, 2, 4, 8, 16, 32, 64, 128];
    const VERT_MAP = [0, 1, 3, 2, 4, 5, 7, 6];
    const xyz = [];
    const n = [];
    let pId;
    let tmp;
    const edge = [];

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

    publicAPI.getVoxelPoints(
      i + extent[0],
      j + extent[2],
      k + extent[4],
      origin,
      spacing
    );
    if (model.computeNormals) {
      publicAPI.getVoxelGradients(i, j, k, dims, slice, spacing, scalars);
    }

    for (let idx = 0; voxelTris[idx] >= 0; idx += 3) {
      tris.push(3);
      for (let eid = 0; eid < 3; eid++) {
        const edgeVerts = vtkCaseTable.getEdge(voxelTris[idx + eid]);
        pId = undefined;
        if (model.mergePoints) {
          edge[0] = ids[edgeVerts[0]];
          edge[1] = ids[edgeVerts[1]];
          if (edge[0] > edge[1]) {
            tmp = edge[0];
            edge[0] = edge[1];
            edge[1] = tmp;
          }
          pId = edgeMap.get(edge);
        }
        if (pId === undefined) {
          const t =
            (cVal - voxelScalars[edgeVerts[0]]) /
            (voxelScalars[edgeVerts[1]] - voxelScalars[edgeVerts[0]]);
          const x0 = voxelPts.slice(edgeVerts[0] * 3, (edgeVerts[0] + 1) * 3);
          const x1 = voxelPts.slice(edgeVerts[1] * 3, (edgeVerts[1] + 1) * 3);
          xyz[0] = x0[0] + t * (x1[0] - x0[0]);
          xyz[1] = x0[1] + t * (x1[1] - x0[1]);
          xyz[2] = x0[2] + t * (x1[2] - x0[2]);
          pId = points.length / 3;
          points.push(xyz[0], xyz[1], xyz[2]);

          if (model.computeNormals) {
            const n0 = voxelGradients.slice(
              edgeVerts[0] * 3,
              (edgeVerts[0] + 1) * 3
            );
            const n1 = voxelGradients.slice(
              edgeVerts[1] * 3,
              (edgeVerts[1] + 1) * 3
            );
            n[0] = n0[0] + t * (n1[0] - n0[0]);
            n[1] = n0[1] + t * (n1[1] - n0[1]);
            n[2] = n0[2] + t * (n1[2] - n0[2]);
            vtkMath.normalize(n);
            normals.push(n[0], n[1], n[2]);
          }

          if (model.mergePoints) {
            edge[0] = ids[edgeVerts[0]];
            edge[1] = ids[edgeVerts[1]];
            if (edge[0] > edge[1]) {
              tmp = edge[0];
              edge[0] = edge[1];
              edge[1] = tmp;
            }
            edgeMap[edge] = pId;
          }
        }
        tris.push(pId);
      }
    }
  };

  publicAPI.requestData = (inData, outData) => {
    // implement requestData
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

    // Normals
    const nBuffer = [];

    // Loop over all voxels, determine case and process
    const extent = input.getExtent();
    const slice = dims[0] * dims[1];
    for (let k = 0; k < dims[2] - 1; ++k) {
      for (let j = 0; j < dims[1] - 1; ++j) {
        for (let i = 0; i < dims[0] - 1; ++i) {
          publicAPI.produceTriangles(
            model.contourValue,
            i,
            j,
            k,
            extent,
            slice,
            dims,
            origin,
            spacing,
            s,
            pBuffer,
            tBuffer,
            nBuffer
          );
        }
      }
    }

    // Update output
    const polydata = vtkPolyData.newInstance();
    polydata.getPoints().setData(new Float32Array(pBuffer), 3);
    polydata.getPolys().setData(new Uint32Array(tBuffer));
    if (model.computeNormals) {
      const nData = new Float32Array(nBuffer);
      const normals = vtkDataArray.newInstance({
        numberOfComponents: 3,
        values: nData,
        name: 'Normals',
      });
      polydata.getPointData().setNormals(normals);
    }
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
  computeNormals: false,
  mergePoints: false,
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
    'computeNormals',
    'mergePoints',
  ]);

  // Object specific methods
  macro.algo(publicAPI, model, 1, 1);
  vtkImageMarchingCubes(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImageMarchingCubes');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
