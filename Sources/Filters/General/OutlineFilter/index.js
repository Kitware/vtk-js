import * as macro from '../../../macro';
import vtkPolyData from '../../../Common/DataModel/PolyData';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// vtkOutlineFilter methods
// ----------------------------------------------------------------------------

function vtkOutlineFilter(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOutlineFilter');

  publicAPI.requestData = (inData, outData) => { // implement requestData
    if (!outData[0] || inData[0].getMTime() > outData[0].getMTime() || publicAPI.getMTime() > outData[0].getMTime()) {
      const input = inData[0];

      if (!input) {
        vtkErrorMacro('Invalid or missing input');
        return 1;
      }

      const output = vtkPolyData.newInstance();
      const bounds = input.getBounds();
      const pts = new Float32Array(8 * 3);

      // pt 0
      pts[0] = bounds[0];
      pts[1] = bounds[2];
      pts[2] = bounds[4];

      // pt 1
      pts[3] = bounds[1];
      pts[4] = bounds[2];
      pts[5] = bounds[4];

      // pt 2
      pts[6] = bounds[0];
      pts[7] = bounds[3];
      pts[8] = bounds[4];

      // pt 3
      pts[9] = bounds[1];
      pts[10] = bounds[3];
      pts[11] = bounds[4];

      // pt 4
      pts[12] = bounds[0];
      pts[13] = bounds[2];
      pts[14] = bounds[5];

      // pt 5
      pts[15] = bounds[1];
      pts[16] = bounds[2];
      pts[17] = bounds[5];

      // pt 6
      pts[18] = bounds[0];
      pts[19] = bounds[3];
      pts[20] = bounds[5];

      // pt 7
      pts[21] = bounds[1];
      pts[22] = bounds[3];
      pts[23] = bounds[5];

      output.getPoints().getData().setData(pts, 3);

      const lines = new Uint32Array(12 * 3);

      lines[0] = 2;
      lines[1] = 0;
      lines[2] = 1;

      lines[3] = 2;
      lines[4] = 2;
      lines[5] = 3;

      lines[6] = 2;
      lines[7] = 4;
      lines[8] = 5;

      lines[9] = 2;
      lines[10] = 6;
      lines[11] = 7;

      lines[12] = 2;
      lines[13] = 0;
      lines[14] = 2;

      lines[15] = 2;
      lines[16] = 1;
      lines[17] = 3;

      lines[18] = 2;
      lines[19] = 4;
      lines[20] = 6;

      lines[21] = 2;
      lines[22] = 5;
      lines[23] = 7;

      lines[24] = 2;
      lines[25] = 0;
      lines[26] = 4;

      lines[27] = 2;
      lines[28] = 1;
      lines[29] = 5;

      lines[30] = 2;
      lines[31] = 2;
      lines[32] = 6;

      lines[33] = 2;
      lines[34] = 3;
      lines[35] = 7;

      output.getLines().setData(lines);

      outData[0] = output;
    }

    return 1;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
};

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
