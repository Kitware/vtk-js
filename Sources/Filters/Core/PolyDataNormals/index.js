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

  publicAPI.vtkPolyDataNormalsExecute = (
    numberOfPolys,
    polysData,
    pointsData
  ) => {
    if (!pointsData) {
      return null;
    }

    const pointNormals = new Float32Array(pointsData.length);
    const cellNormals = new Float32Array(3 * numberOfPolys);
    let cellNormalComponent = 0;

    let numberOfPoints = 0;
    const polysDataLength = polysData.length;

    const cellPointIds = [0, 0, 0];
    const cellNormal = [0, 0, 0];

    for (let c = 0; c < polysDataLength; c += numberOfPoints + 1) {
      numberOfPoints = polysData[c];

      if (numberOfPoints < 3) {
        continue; // eslint-disable-line
      }

      for (let i = 1; i <= 3; ++i) {
        cellPointIds[i - 1] = 3 * polysData[c + i];
      }

      vtkTriangle.computeNormal(
        pointsData.slice(cellPointIds[0], cellPointIds[0] + 3),
        pointsData.slice(cellPointIds[1], cellPointIds[1] + 3),
        pointsData.slice(cellPointIds[2], cellPointIds[2] + 3),
        cellNormal
      );

      cellNormals[cellNormalComponent++] = cellNormal[0];
      cellNormals[cellNormalComponent++] = cellNormal[1];
      cellNormals[cellNormalComponent++] = cellNormal[2];

      if (model.computePointNormals) {
        for (let i = 1; i <= numberOfPoints; ++i) {
          let pointId = 3 * polysData[c + i];

          pointNormals[pointId] += cellNormal[0];
          pointNormals[++pointId] += cellNormal[1];
          pointNormals[++pointId] += cellNormal[2];
        }
      }
    }

    // Normalize point normals.
    // A point normal is the sum of all the cell normals the point belongs to
    if (model.computePointNormals) {
      const pointNormal = [0, 0, 0];
      for (let i = 0; i < pointsData.length; ) {
        pointNormal[0] = pointNormals[i];
        pointNormal[1] = pointNormals[i + 1];
        pointNormal[2] = pointNormals[i + 2];

        vtkMath.normalize(pointNormal);

        pointNormals[i++] = pointNormal[0];
        pointNormals[i++] = pointNormal[1];
        pointNormals[i++] = pointNormal[2];
      }
    }

    return [cellNormals, pointNormals];
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

    const output = vtkPolyData.newInstance();

    output.setPoints(input.getPoints());
    output.setVerts(input.getVerts());
    output.setLines(input.getLines());
    output.setPolys(input.getPolys());
    output.setStrips(input.getStrips());

    output.getPointData().passData(input.getPointData());
    output.getCellData().passData(input.getCellData());
    output.getFieldData().passData(input.getFieldData());

    const [cellNormals, pointNormals] = publicAPI.vtkPolyDataNormalsExecute(
      input.getNumberOfPolys(),
      input.getPolys().getData(),
      input.getPoints().getData()
    );

    if (model.computePointNormals) {
      const outputPointNormals = vtkDataArray.newInstance({
        numberOfComponents: 3,
        name: 'Normals',
        values: pointNormals,
      });
      output.getPointData().setNormals(outputPointNormals);
    }

    if (model.computeCellNormals) {
      const outputCellNormals = vtkDataArray.newInstance({
        numberOfComponents: 3,
        name: 'Normals',
        values: cellNormals,
      });
      output.getCellData().setNormals(outputCellNormals);
    }

    outData[0] = output;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
function defaultValues(initialValues) {
  return {
    computeCellNormals: false,
    computePointNormals: true,
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

  macro.setGet(publicAPI, model, ['computeCellNormals', 'computePointNormals']);

  /* Object specific methods */

  vtkPolyDataNormals(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPolyDataNormals');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
