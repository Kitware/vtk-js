import macro from 'vtk.js/Sources/macros';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

const { vtkWarningMacro } = macro;

// ----------------------------------------------------------------------------
// vtkLineSource methods
// ----------------------------------------------------------------------------

function vtkLineSource(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkLineSource');

  publicAPI.requestData = (inData, outData) => {
    if (model.deleted) {
      return;
    }

    const dataset = outData[0];

    // Check input
    const pointDataType = dataset
      ? dataset.getPoints().getDataType()
      : model.pointType;
    const pd = vtkPolyData.newInstance();
    const v21 = [];
    vtkMath.subtract(model.point2, model.point1, v21);
    if (vtkMath.norm(v21) <= 0.0) {
      vtkWarningMacro('Zero-length line definition');
      return;
    }

    // hand create a line with special scalars
    const res = model.resolution;
    const numPts = res + 1;

    // Points
    const points = macro.newTypedArray(pointDataType, numPts * 3);
    pd.getPoints().setData(points, 3);

    // Cells
    const lines = new Uint32Array(numPts + 1);
    pd.getLines().setData(lines, 1);

    let idx = 0;
    let t = 0.0;
    for (let i = 0; i < res + 1; i++) {
      t = i / res;

      points[idx * 3] = model.point1[0] + t * v21[0];
      points[idx * 3 + 1] = model.point1[1] + t * v21[1];
      points[idx * 3 + 2] = model.point1[2] + t * v21[2];

      idx++;
    }

    // Generate line connectivity
    //
    idx = 0;
    lines[0] = numPts;
    for (let i = 0; i < numPts; i++) {
      lines[i + 1] = i;
    }

    // Update output
    outData[0] = pd;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  resolution: 10,
  point1: [-1, 0, 0],
  point2: [1, 0, 0],
  pointType: 'Float64Array',
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['resolution']);
  macro.setGetArray(publicAPI, model, ['point1', 'point2'], 3);
  macro.algo(publicAPI, model, 0, 1);
  vtkLineSource(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkLineSource');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
