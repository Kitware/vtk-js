import macro from 'vtk.js/Sources/macros';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkEdgeLocator from 'vtk.js/Sources/Common/DataModel/EdgeLocator';

import vtkCaseTable from './caseTable';

const { vtkErrorMacro, vtkDebugMacro } = macro;

// ----------------------------------------------------------------------------
// vtkImageMarchingSquares methods
// ----------------------------------------------------------------------------

function vtkImageMarchingSquares(publicAPI, model) {
  /**
   * Get the X,Y kernels based on the set slicing mode.
   * @returns {[number, number]}
   */
  function getKernels() {
    let kernelX = 0; // default K slicing mode
    let kernelY = 1;
    if (model.slicingMode === 1) {
      kernelX = 0;
      kernelY = 2;
    } else if (model.slicingMode === 0) {
      kernelX = 1;
      kernelY = 2;
    }

    return [kernelX, kernelY];
  }

  // Set our className
  model.classHierarchy.push('vtkImageMarchingSquares');

  /**
   * Get the list of contour values.
   * @returns {number[]}
   */
  publicAPI.getContourValues = () => model.contourValues;

  /**
   * Set the list contour values.
   * @param {number[]} cValues
   */
  publicAPI.setContourValues = (cValues) => {
    model.contourValues = cValues;
    publicAPI.modified();
  };

  const ids = [];
  const pixelScalars = [];
  const pixelPts = [];
  const edgeLocator = vtkEdgeLocator.newInstance();

  /**
   * Retrieve scalars and pixel coordinates.
   * @param {Vector3} ijk origin of the pixel
   * @param {Vector3} dims dimensions of the image
   * @param {TypedArray} scalars list of scalar values
   * @param {Vector3} increments IJK slice increments
   * @param {number} kernelX index of the X element
   * @param {number} kernelY index of the Y element
   */
  publicAPI.getPixelScalars = (
    ijk,
    dims,
    scalars,
    increments,
    kernelX,
    kernelY
  ) => {
    const [i, j, k] = ijk;

    // First get the indices for the pixel
    ids[0] = k * dims[1] * dims[0] + j * dims[0] + i; // i, j, k
    ids[1] = ids[0] + increments[kernelX]; // i+1, j, k
    ids[2] = ids[0] + increments[kernelY]; // i, j+1, k
    ids[3] = ids[2] + increments[kernelX]; // i+1, j+1, k

    // Now retrieve the scalars
    for (let ii = 0; ii < 4; ++ii) {
      pixelScalars[ii] = scalars[ids[ii]];
    }
  };

  /**
   * Retrieve pixel coordinates.
   * @param {Vector3} ijk origin of the pixel
   * @param {Vector3} origin origin of the image
   * @param {Vector3} spacing spacing of the image
   * @param {number} kernelX index of the X element
   * @param {number} kernelY index of the Y element
   */
  publicAPI.getPixelPoints = (ijk, origin, spacing, kernelX, kernelY) => {
    const i = ijk[kernelX];
    const j = ijk[kernelY];

    // (i,i+1),(j,j+1),(k,k+1) - i varies fastest; then j; then k
    pixelPts[0] = origin[kernelX] + i * spacing[kernelX]; // 0
    pixelPts[1] = origin[kernelY] + j * spacing[kernelY];

    pixelPts[2] = pixelPts[0] + spacing[kernelX]; // 1
    pixelPts[3] = pixelPts[1];

    pixelPts[4] = pixelPts[0]; // 2
    pixelPts[5] = pixelPts[1] + spacing[kernelY];

    pixelPts[6] = pixelPts[2]; // 3
    pixelPts[7] = pixelPts[5];
  };

  /**
   * Produce points and lines for the polydata.
   * @param {number[]} cVal list of contour values
   * @param {Vector3} ijk origin of the pixel
   * @param {Vector3} dims dimensions of the image
   * @param {Vector3} origin origin of the image
   * @param {Vector3} spacing sapcing of the image
   * @param {TypedArray} scalars list of scalar values
   * @param {number[]} points list of points
   * @param {number[]} lines list of lines
   * @param {Vector3} increments IJK slice increments
   * @param {number} kernelX index of the X element
   * @param {number} kernelY index of the Y element
   */
  publicAPI.produceLines = (
    cVal,
    ijk,
    dims,
    origin,
    spacing,
    scalars,
    points,
    lines,
    increments,
    kernelX,
    kernelY
  ) => {
    const k = ijk[model.slicingMode];
    const CASE_MASK = [1, 2, 8, 4]; // case table is actually for quad
    const xyz = [];
    let pId;

    publicAPI.getPixelScalars(ijk, dims, scalars, increments, kernelX, kernelY);

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

    publicAPI.getPixelPoints(ijk, origin, spacing, kernelX, kernelY);

    const z = origin[model.slicingMode] + k * spacing[model.slicingMode];
    for (let idx = 0; pixelLines[idx] >= 0; idx += 2) {
      lines.push(2);
      for (let eid = 0; eid < 2; eid++) {
        const edgeVerts = vtkCaseTable.getEdge(pixelLines[idx + eid]);
        pId = undefined;
        if (model.mergePoints) {
          pId = edgeLocator.isInsertedEdge(
            ids[edgeVerts[0]],
            ids[edgeVerts[1]]
          )?.value;
        }
        if (pId === undefined) {
          const t =
            (cVal - pixelScalars[edgeVerts[0]]) /
            (pixelScalars[edgeVerts[1]] - pixelScalars[edgeVerts[0]]);
          const x0 = pixelPts.slice(edgeVerts[0] * 2, (edgeVerts[0] + 1) * 2);
          const x1 = pixelPts.slice(edgeVerts[1] * 2, (edgeVerts[1] + 1) * 2);
          xyz[kernelX] = x0[0] + t * (x1[0] - x0[0]);
          xyz[kernelY] = x0[1] + t * (x1[1] - x0[1]);
          xyz[model.slicingMode] = z;
          pId = points.length / 3;
          points.push(xyz[0], xyz[1], xyz[2]);

          if (model.mergePoints) {
            edgeLocator.insertEdge(ids[edgeVerts[0]], ids[edgeVerts[1]], pId);
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

    if (
      model.slicingMode == null ||
      model.slicingMode < 0 ||
      model.slicingMode > 2
    ) {
      vtkErrorMacro('Invalid or missing slicing mode');
      return;
    }

    console.time('msquares');

    // Retrieve output and volume data
    const origin = input.getOrigin();
    const spacing = input.getSpacing();
    const dims = input.getDimensions();
    const extent = input.getExtent();
    const increments = input.computeIncrements(extent);
    const scalars = input.getPointData().getScalars().getData();
    const [kernelX, kernelY] = getKernels();

    // Points - dynamic array
    const points = [];

    // Cells - dynamic array
    const lines = [];

    // Ensure slice is valid
    let k = Math.round(model.slice);
    if (k >= dims[model.slicingMode]) {
      k = 0;
    }

    // Loop over all contour values, and then pixels, determine case and process
    const ijk = [0, 0, 0];
    ijk[model.slicingMode] = k;
    for (let cv = 0; cv < model.contourValues.length; ++cv) {
      for (let j = 0; j < dims[kernelY] - 1; ++j) {
        ijk[kernelY] = j;
        for (let i = 0; i < dims[kernelX] - 1; ++i) {
          ijk[kernelX] = i;

          publicAPI.produceLines(
            model.contourValues[cv],
            ijk,
            dims,
            origin,
            spacing,
            scalars,
            points,
            lines,
            increments,
            kernelX,
            kernelY
          );
        }
      }

      edgeLocator.initialize();
    }

    // Update output
    const polydata = vtkPolyData.newInstance();
    polydata.getPoints().setData(new Float32Array(points), 3);
    polydata.getLines().setData(new Uint32Array(lines));
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
  slicingMode: 2,
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

  macro.setGet(publicAPI, model, ['slicingMode', 'slice', 'mergePoints']);

  // Object specific methods
  macro.algo(publicAPI, model, 1, 1);
  vtkImageMarchingSquares(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImageMarchingSquares');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
