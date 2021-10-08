import macro from 'vtk.js/Sources/macros';

import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkMath from 'vtk.js/Sources/Common/Core/Math/index';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkTriangle from 'vtk.js/Sources/Common/DataModel/Triangle';

// ----------------------------------------------------------------------------
// vtkPolyDataNormals methods
// ----------------------------------------------------------------------------

function vtkPolyDataNormals(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPolyDataNormals');

  publicAPI.vtkPolyDataNormalsExecute = (pointsData, polysData) => {
    if (!pointsData) {
      return null;
    }

    const normalsData = new Float32Array(pointsData.length);

    let numberOfPoints = 0;
    const polysDataLength = polysData.length;

    const cellPointIds = [0, 0, 0];

    for (let c = 0; c < polysDataLength; c += numberOfPoints + 1) {
      numberOfPoints = polysData[c];

      if (numberOfPoints < 3) {
        continue; // eslint-disable-line
      }

      for (let i = 1; i <= 3; ++i) {
        cellPointIds[i - 1] = 3 * polysData[c + i];
      }

      const cellNormal = [];

      vtkTriangle.computeNormal(
        pointsData.slice(cellPointIds[0], cellPointIds[0] + 3),
        pointsData.slice(cellPointIds[1], cellPointIds[1] + 3),
        pointsData.slice(cellPointIds[2], cellPointIds[2] + 3),
        cellNormal
      );

      for (let i = 1; i <= numberOfPoints; ++i) {
        let pointId = 3 * polysData[c + i];

        normalsData[pointId] += cellNormal[0];
        normalsData[++pointId] += cellNormal[1];
        normalsData[++pointId] += cellNormal[2];
      }
    }

    /* Normalize normals */

    for (let i = 0; i < pointsData.length; ) {
      const pointNormal = normalsData.slice(i, i + 3);

      vtkMath.normalize(pointNormal);

      normalsData[i++] = pointNormal[0];
      normalsData[i++] = pointNormal[1];
      normalsData[i++] = pointNormal[2];
    }

    return normalsData;
  };

  publicAPI.requestData = (inData, outData) => {
    const numberOfInputs = publicAPI.getNumberOfInputPorts();

    if (!numberOfInputs) {
      return;
    }

    const input = inData[0];

    if (!input) {
      return;
    }

    const outputNormalsData = publicAPI.vtkPolyDataNormalsExecute(
      input.getPoints().getData(),
      input.getPolys().getData()
    );

    const output = vtkPolyData.newInstance();

    const outputNormals = vtkDataArray.newInstance({
      numberOfComponents: 3,
      values: outputNormalsData,
    });

    output.setPointData(input.getPointData());
    output.setCellData(input.getCellData());
    output.setFieldData(input.getFieldData());
    output.setPoints(input.getPoints());
    output.setVerts(input.getVerts());
    output.setLines(input.getLines());
    output.setPolys(input.getPolys());
    output.setStrips(input.getStrips());

    output.getPointData().setNormals(outputNormals);

    outData[0] = output;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
function defaultValues(initialValues) {
  return {
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------
export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, defaultValues(initialValues));

  /* Make this a VTK object */

  macro.obj(publicAPI, model);

  /* Also make it an algorithm with one input and one output */

  macro.algo(publicAPI, model, 1, 1);

  /* Object specific methods */

  vtkPolyDataNormals(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPolyDataNormals');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
