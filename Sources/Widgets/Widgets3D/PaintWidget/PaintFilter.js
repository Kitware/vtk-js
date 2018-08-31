import macro from 'vtk.js/Sources/macro';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkPaintFilter methods
// ----------------------------------------------------------------------------

function vtkPaintFilter(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPaintFilter');

  // --------------------------------------------------------------------------

  publicAPI.requestData = (inData, outData) => {
    // implement requestData
    const input = inData[0];

    if (!input) {
      vtkErrorMacro('Invalid or missing points and/or input');
      return;
    }

    const scalars = input.getPointData().getScalars();

    if (!scalars) {
      vtkErrorMacro('No scalars from input');
      return;
    }

    const dims = input.getDimensions();
    const numberOfComponents = scalars.getNumberOfComponents();
    const jStride = numberOfComponents * dims[0];
    const kStride = numberOfComponents * dims[0] * dims[1];
    const scalarsData = scalars.getData();

    const [rx, ry, rz] = model.radius;
    for (let pti = 0; pti < model.points.length; pti++) {
      const [x, y, z] = model.points[pti];
      const xstart = Math.floor(Math.min(dims[0] - 1, Math.max(0, x - rx)));
      const xend = Math.floor(Math.min(dims[0] - 1, Math.max(0, x + rx)));
      const ystart = Math.floor(Math.min(dims[1] - 1, Math.max(0, y - ry)));
      const yend = Math.floor(Math.min(dims[1] - 1, Math.max(0, y + ry)));
      const zstart = Math.floor(Math.min(dims[2] - 1, Math.max(0, z - rz)));
      const zend = Math.floor(Math.min(dims[2] - 1, Math.max(0, z + rz)));

      // naive algo
      for (let i = xstart; i <= xend; i++) {
        for (let j = ystart; j <= yend; j++) {
          for (let k = zstart; k <= zend; k++) {
            const ival = (i - x) / rx;
            const jval = (j - y) / ry;
            const kval = (k - z) / rz;
            if (ival * ival + jval * jval + kval * kval <= 1) {
              scalarsData[i + j * jStride + k * kStride] = 1;
            }
          }
        }
      }
    }

    scalars.setData(scalarsData);
    scalars.modified();
    input.modified();

    // clear points without triggering requestData
    model.points = [];
    outData[0] = input;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  points: [],
  radius: [1, 1, 1],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 1, 1);

  macro.setGet(publicAPI, model, ['points']);
  macro.setGetArray(publicAPI, model, ['radius'], 3);

  // Object specific methods
  vtkPaintFilter(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPaintFilter');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
