import macro from 'vtk.js/Sources/macros';

import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

const { vtkErrorMacro } = macro;

function reverseCellArray(inputCells) {
  if (!inputCells) {
    return null;
  }

  const inputData = inputCells.getData();
  const outputData = inputData.slice();

  for (let offset = 0, len = inputData.length; offset < len; ) {
    const cellSize = inputData[offset];
    let left = offset + 1;
    let right = offset + cellSize;
    // reverse segment
    while (left < right) {
      const l = inputData[left];
      const r = inputData[right];

      outputData[left++] = r;
      outputData[right--] = l;
    }
    offset += cellSize + 1;
  }

  return vtkCellArray.newInstance({
    values: outputData,
    numberOfComponents: 1,
  });
}

function reverseNormals(inputNormals) {
  if (!inputNormals) {
    return null;
  }

  const values = inputNormals.getData().slice();
  for (let i = 0; i < values.length; i++) {
    const v = -values[i];
    values[i] = v === 0 ? 0 : v; // avoids -0
  }

  return vtkDataArray.newInstance({
    name: inputNormals.getName(),
    values,
    numberOfComponents: inputNormals.getNumberOfComponents(),
  });
}

// ----------------------------------------------------------------------------
// vtkReverseSense methods
// ----------------------------------------------------------------------------

function vtkReverseSense(publicAPI, model) {
  model.classHierarchy.push('vtkReverseSense');

  publicAPI.requestData = (inData, outData) => {
    const input = inData[0];

    if (!input) {
      vtkErrorMacro('No input!');
      return;
    }

    const output = outData[0]?.initialize() || vtkPolyData.newInstance();

    output.setPoints(input.getPoints());

    output.setVerts(
      model.reverseCells ? reverseCellArray(input.getVerts()) : input.getVerts()
    );
    output.setLines(
      model.reverseCells ? reverseCellArray(input.getLines()) : input.getLines()
    );
    output.setPolys(
      model.reverseCells ? reverseCellArray(input.getPolys()) : input.getPolys()
    );
    output.setStrips(
      model.reverseCells
        ? reverseCellArray(input.getStrips())
        : input.getStrips()
    );

    const outPointData = output.getPointData();
    const outCellData = output.getCellData();

    outPointData.passData(input.getPointData());
    outCellData.passData(input.getCellData());
    output.getFieldData().passData(input.getFieldData());

    if (model.reverseNormals) {
      const pointNormals = reverseNormals(input.getPointData().getNormals());
      const cellNormals = reverseNormals(input.getCellData().getNormals());

      if (pointNormals) {
        outPointData.setNormals(pointNormals);
      }

      if (cellNormals) {
        outCellData.setNormals(cellNormals);
      }
    }

    outData[0] = output;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  reverseCells: true,
  reverseNormals: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);
  macro.algo(publicAPI, model, 1, 1);

  macro.setGet(publicAPI, model, ['reverseCells', 'reverseNormals']);

  vtkReverseSense(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkReverseSense');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
