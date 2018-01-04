import macro from 'vtk.js/Sources/macro';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

const { vtkErrorMacro } = macro;

// prettier-ignore
const BOUNDS_MAP = [
  0, 2, 4, // pt 0
  1, 2, 4, // pt 1
  0, 3, 4, // pt 2
  1, 3, 4, // pt 3
  0, 2, 5, // pt 4
  1, 2, 5, // pt 5
  0, 3, 5, // pt 6
  1, 3, 5, // pt 7
];

// prettier-ignore
const LINE_ARRAY = [
  2, 0, 1,
  2, 2, 3,
  2, 4, 5,
  2, 6, 7,
  2, 0, 2,
  2, 1, 3,
  2, 4, 6,
  2, 5, 7,
  2, 0, 4,
  2, 1, 5,
  2, 2, 6,
  2, 3, 7,
];

// ----------------------------------------------------------------------------
// vtkOutlineFilter methods
// ----------------------------------------------------------------------------

function vtkOutlineFilter(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOutlineFilter');

  publicAPI.requestData = (inData, outData) => {
    // implement requestData
    const input = inData[0];

    if (!input) {
      vtkErrorMacro('Invalid or missing input');
      return;
    }

    const bounds = input.getBounds();
    const output = vtkPolyData.newInstance();

    output
      .getPoints()
      .setData(Float32Array.from(BOUNDS_MAP.map((idx) => bounds[idx])), 3);
    output.getLines().setData(Uint16Array.from(LINE_ARRAY));

    outData[0] = output;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 1, 1);

  // Object specific methods
  vtkOutlineFilter(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOutlineFilter');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
