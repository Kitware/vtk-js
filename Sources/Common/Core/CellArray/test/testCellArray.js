import { it, expect } from 'vitest';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';

it('Test cell array constructor', () => {
  // Empty cell arrays are allowed (empty=true in DEFAULT_VALUES)
  const emptyCellArray = vtkCellArray.newInstance();
  expect(emptyCellArray.getDataType(), 'empty init data type').toBe(
    VtkDataTypes.UNSIGNED_INT
  );
  expect(emptyCellArray.getNumberOfCells(), 'empty init number of cells').toBe(
    0
  );

  const uintCellArray = vtkCellArray.newInstance({ values: [3, 0, 1, 2] });
  expect(uintCellArray.getDataType(), 'uint init data type').toBe(
    VtkDataTypes.UNSIGNED_INT
  );
  expect(uintCellArray.getNumberOfCells(), 'uint init number of cells').toBe(1);

  const charCellArray = vtkCellArray.newInstance({
    dataType: VtkDataTypes.CHAR,
    values: [3, 0, 1, 2],
  });
  expect(charCellArray.getDataType(), 'char init data type').toBe(
    VtkDataTypes.CHAR
  );
  expect(charCellArray.getNumberOfCells(), 'char init number of cells').toBe(1);
});

it('Test vtkCellArray insertNextCell', () => {
  const cellArray = vtkCellArray.newInstance({
    dataType: 'Uint16Array',
    empty: true,
    numberOfComponents: 1,
  });
  cellArray.insertNextCell([0, 1, 2]);
  expect(
    cellArray.getNumberOfCells(),
    'number of cells after first insertNextCell'
  ).toBe(1);
  expect(cellArray.getData(), 'getData after first insertNextCell').toEqual(
    Uint16Array.from([3, 0, 1, 2])
  );
  cellArray.insertNextCell([3, 4, 5, 6]);
  expect(
    cellArray.getNumberOfCells(),
    'number of cells after second insertNextCell'
  ).toBe(2);
  expect(cellArray.getData(), 'getData after second insertNextCell').toEqual(
    Uint16Array.from([3, 0, 1, 2, 4, 3, 4, 5, 6])
  );
});
