import vtk from 'vtk.js/Sources/vtk';
import macro from 'vtk.js/Sources/macro';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';

const { vtkDebugMacro, vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkWarpScalar methods
// ----------------------------------------------------------------------------

function vtkWarpScalar(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWarpScalar');

  publicAPI.requestData = (inData, outData) => {
    // implement requestData
    const input = inData[0];

    if (!input) {
      vtkErrorMacro('Invalid or missing input');
      return 1;
    }

    // First, copy the input to the output as a starting point
    // output->CopyStructure( input );

    const inPts = input.getPoints();
    const pd = input.getPointData();
    const inNormals = pd.getNormals();
    const inScalars = publicAPI.getInputArrayToProcess(0);

    if (!inPts || !inScalars) {
      vtkDebugMacro('No data to warp', !!inPts, !!inScalars);
      outData[0] = inData[0];
      return 1;
    }

    const numPts = inPts.getNumberOfPoints();

    let pointNormal = null;

    const normal = [0, 0, 1];
    if (inNormals && !model.useNormal) {
      pointNormal = (id, array) => [
        array.getData()[id * 3],
        array.getData()[id * 3 + 1],
        array.getData()[id * 3 + 2],
      ];
      vtkDebugMacro('Using data normals');
    } else if (publicAPI.getXyPlane()) {
      pointNormal = (id, array) => normal;
      vtkDebugMacro('Using x-y plane normal');
    } else {
      pointNormal = (id, array) => model.normal;
      vtkDebugMacro('Using Normal instance variable');
    }

    const newPtsData = new Float32Array(numPts * 3);
    const inPoints = inPts.getData();
    let ptOffset = 0;
    let n = [0, 0, 1];
    let s = 1;

    // Loop over all points, adjusting locations
    const scalarDataArray = inScalars.getData();
    const nc = inScalars.getNumberOfComponents();
    for (let ptId = 0; ptId < numPts; ++ptId) {
      ptOffset = ptId * 3;
      n = pointNormal(ptId, inNormals);

      if (model.xyPlane) {
        s = inPoints[ptOffset + 2];
      } else {
        // Use component 0 of array if there are multiple components
        s = scalarDataArray[ptId * nc];
      }

      newPtsData[ptOffset] = inPoints[ptOffset] + model.scaleFactor * s * n[0];
      newPtsData[ptOffset + 1] =
        inPoints[ptOffset + 1] + model.scaleFactor * s * n[1];
      newPtsData[ptOffset + 2] =
        inPoints[ptOffset + 2] + model.scaleFactor * s * n[2];
    }

    const newDataSet = vtk({ vtkClass: input.getClassName() });
    newDataSet.shallowCopy(input);
    const points = vtkPoints.newInstance();
    points.setData(newPtsData, 3);
    newDataSet.setPoints(points);
    outData[0] = newDataSet;

    return 1;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  scaleFactor: 1,
  useNormal: false,
  normal: [0, 0, 1],
  xyPlane: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 1, 1);

  // Generate macros for properties
  macro.setGet(publicAPI, model, ['scaleFactor', 'useNormal', 'xyPlane']);

  macro.setGetArray(publicAPI, model, ['normal'], 3);

  // Object specific methods
  vtkWarpScalar(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWarpScalar');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
