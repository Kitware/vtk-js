import macro from 'vtk.js/Sources/macro';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

import vtkCaseTable from './caseTable';

const { vtkErrorMacro, vtkDebugMacro } = macro;

// ----------------------------------------------------------------------------
// vtkImageMarchingSquares methods
// ----------------------------------------------------------------------------

function vtkImageMarchingSquares(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageMarchingSquares');

  publicAPI.getContourValues = () => model.contourValues;
  publicAPI.setContourValues = (cValues) => {
    model.contourValues = cValues;
    publicAPI.modified();
  };

  const ids = [];
  const pixelScalars = [];
  const pixelPts = [];
  const edgeMap = new Map();

  // Retrieve scalars and pixel coordinates. i-j-k is origin of pixel.
  publicAPI.getPixelScalars = (i, j, k, slice, dims, origin, spacing, s) => {
    // First get the indices for the pixel
    ids[0] = k * slice + j * dims[0] + i; // i, j, k
    ids[1] = ids[0] + 1; // i+1, j, k
    ids[2] = ids[0] + dims[0]; // i, j+1, k
    ids[3] = ids[2] + 1; // i+1, j+1, k

    // Now retrieve the scalars
    for (let ii = 0; ii < 4; ++ii) {
      pixelScalars[ii] = s[ids[ii]];
    }
  };

  // Retrieve pixel coordinates. i-j-k is origin of pixel.
  publicAPI.getPixelPoints = (i, j, k, dims, origin, spacing) => {
    // (i,i+1),(j,j+1),(k,k+1) - i varies fastest; then j; then k
    pixelPts[0] = origin[0] + i * spacing[0]; // 0
    pixelPts[1] = origin[1] + j * spacing[1];

    pixelPts[2] = pixelPts[0] + spacing[0]; // 1
    pixelPts[3] = pixelPts[1];

    pixelPts[4] = pixelPts[0]; // 2
    pixelPts[5] = pixelPts[1] + spacing[1];

    pixelPts[6] = pixelPts[2]; // 3
    pixelPts[7] = pixelPts[5];
  };

  publicAPI.produceLines = (
    cVal,
    i,
    j,
    k,
    slice,
    dims,
    origin,
    spacing,
    scalars,
    points,
    lines
  ) => {
    const CASE_MASK = [1, 2, 8, 4]; // case table is actually for quad
    const xyz = [];
    let pId;
    let tmp;
    const edge = [];

    publicAPI.getPixelScalars(i, j, k, slice, dims, origin, spacing, scalars);

    let index = 0;
    for (let idx = 0; idx < 4; idx++) {
      if (pixelScalars[idx] >= cVal) {
        index |= CASE_MASK[idx]; // eslint-disable-line no-bitwise
      }
    }

    const pixelLines = vtkCaseTable.getCase(index);
    if (pixelLines[0] < 0) {
      return; // don't get the pixel coordinates, nothing to do
    }

    publicAPI.getPixelPoints(i, j, k, dims, origin, spacing);

    const z = origin[2] + k * spacing[2];
    for (let idx = 0; pixelLines[idx] >= 0; idx += 3) {
      lines.push(2);
      for (let eid = 0; eid < 2; eid++) {
        const edgeVerts = vtkCaseTable.getEdge(pixelLines[idx + eid]);
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
            (cVal - pixelScalars[edgeVerts[0]]) /
            (pixelScalars[edgeVerts[1]] - pixelScalars[edgeVerts[0]]);
          const x0 = pixelPts.slice(edgeVerts[0] * 2, (edgeVerts[0] + 1) * 2);
          const x1 = pixelPts.slice(edgeVerts[1] * 2, (edgeVerts[1] + 1) * 2);
          xyz[0] = x0[0] + t * (x1[0] - x0[0]);
          xyz[1] = x0[1] + t * (x1[1] - x0[1]);
          pId = points.length / 3;
          points.push(xyz[0], xyz[1], z);

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
        lines.push(pId);
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

    console.time('msquares');

    // Retrieve output and volume data
    const origin = input.getOrigin();
    const spacing = input.getSpacing();
    const dims = input.getDimensions();
    const s = input
      .getPointData()
      .getScalars()
      .getData();

    // Points - dynamic array
    const pBuffer = [];

    // Cells - dynamic array
    const lBuffer = [];

    // Ensure slice is valid
    const slice = dims[0] * dims[1];
    let k = Math.round(model.slice);
    if (k >= dims[2]) {
      k = 0;
    }

    // Loop over all contour values, and then pixels, determine case and process
    for (let cv = 0; cv < model.contourValues.length; ++cv) {
      for (let j = 0; j < dims[1] - 1; ++j) {
        for (let i = 0; i < dims[0] - 1; ++i) {
          publicAPI.produceLines(
            model.contourValues[cv],
            i,
            j,
            k,
            slice,
            dims,
            origin,
            spacing,
            s,
            pBuffer,
            lBuffer
          );
        }
      }
      edgeMap.clear();
    }

    // Update output
    const polydata = vtkPolyData.newInstance();
    polydata.getPoints().setData(new Float32Array(pBuffer), 3);
    polydata.getLines().setData(new Uint32Array(lBuffer));
    outData[0] = polydata;

    vtkDebugMacro('Produced output');
    console.timeEnd('msquares');
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  contourValues: [],
  slice: 0,
  mergePoints: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 1, 1);

  macro.setGet(publicAPI, model, ['slice', 'mergePoints']);

  // Object specific methods
  macro.algo(publicAPI, model, 1, 1);
  vtkImageMarchingSquares(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImageMarchingSquares');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
