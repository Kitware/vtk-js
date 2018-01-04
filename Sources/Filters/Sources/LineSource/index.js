import macro from 'vtk.js/Sources/macro';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';

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
      : 'Float32Array';
    const pd = vtkPolyData.newInstance();
    const v21 = new Float32Array(3);
    vtkMath.subtract(model.point2, model.point1, v21);
    if (vtkMath.norm(v21) <= 0.0) {
      vtkWarningMacro('Zero-length line definition');
      return;
    }

    // hand create a line with special scalars
    const xres = model.resolution;
    const numPts = xres + 1;

    // Points
    const points = new window[pointDataType](numPts * 3);
    pd.getPoints().setData(points, 3);

    // Cells
    const lines = new Uint32Array(numPts + 1);
    pd.getLines().setData(lines, 1);

    let idx = 0;
    let t = 0.0;
    for (let i = 0; i < xres + 1; i++) {
      t = i / xres;

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
  pointType: 'Float32Array',
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
