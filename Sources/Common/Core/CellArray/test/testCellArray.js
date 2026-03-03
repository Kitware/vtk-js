import { it, expect } from 'vitest';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';

it('Test cell array constructor', () => {
  // Empty cell arrays are allowed (empty=true in DEFAULT_VALUES)
  const emptyCellArray = vtkCellArray.newInstance();
  expect(emptyCellArray.getDataType()).toBe(VtkDataTypes.UNSIGNED_INT);
  expect(emptyCellArray.getNumberOfCells()).toBe(0);

  const uintCellArray = vtkCellArray.newInstance({ values: [3, 0, 1, 2] });
  expect(uintCellArray.getDataType()).toBe(VtkDataTypes.UNSIGNED_INT);
  expect(uintCellArray.getNumberOfCells()).toBe(1);

  const charCellArray = vtkCellArray.newInstance({
    dataType: VtkDataTypes.CHAR,
    values: [3, 0, 1, 2],
  });
  expect(charCellArray.getDataType()).toBe(VtkDataTypes.CHAR);
  expect(charCellArray.getNumberOfCells()).toBe(1);
});

it('Test vtkCellArray insertNextCell', () => {
  const cellArray = vtkCellArray.newInstance({
    dataType: 'Uint16Array',
    empty: true,
    numberOfComponents: 1,
  });
  cellArray.insertNextCell([0, 1, 2]);
  expect(cellArray.getNumberOfCells()).toBe(1);
  expect(cellArray.getData()).toEqual(Uint16Array.from([3, 0, 1, 2]));
  cellArray.insertNextCell([3, 4, 5, 6]);
  expect(cellArray.getNumberOfCells()).toBe(2);
  expect(cellArray.getData()).toEqual(
    Uint16Array.from([3, 0, 1, 2, 4, 3, 4, 5, 6])
  );
});
