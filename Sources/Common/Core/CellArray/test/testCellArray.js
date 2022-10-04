import test from 'tape-catch';

import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';

test('Test cell array constructor', (t) => {
  // Empty cell arrays are allowed (empty=true in DEFAULT_VALUES)
  const emptyCellArray = vtkCellArray.newInstance();
  t.equal(
    emptyCellArray.getDataType(),
    VtkDataTypes.UNSIGNED_INT,
    'empty init data type'
  );
  t.equal(emptyCellArray.getNumberOfCells(), 0, 'empty init number of cells');

  const uintCellArray = vtkCellArray.newInstance({ values: [3, 0, 1, 2] });
  t.equal(
    uintCellArray.getDataType(),
    VtkDataTypes.UNSIGNED_INT,
    'uint init data type'
  );
  t.equal(uintCellArray.getNumberOfCells(), 1, 'uint init number of cells');

  const charCellArray = vtkCellArray.newInstance({
    dataType: VtkDataTypes.CHAR,
    values: [3, 0, 1, 2],
  });
  t.equal(
    charCellArray.getDataType(),
    VtkDataTypes.CHAR,
    'char init data type'
  );
  t.equal(charCellArray.getNumberOfCells(), 1, 'char init number of cells');

  t.end();
});

test('Test vtkCellArray insertNextCell', (t) => {
  const cellArray = vtkCellArray.newInstance({
    dataType: 'Uint16Array',
    empty: true,
    numberOfComponents: 1,
  });
  cellArray.insertNextCell([0, 1, 2]);
  t.equal(
    cellArray.getNumberOfCells(),
    1,
    'number of cells after first insertNextCell'
  );
  t.deepEqual(
    cellArray.getData(),
    Uint16Array.from([3, 0, 1, 2]),
    'getData after first insertNextCell'
  );
  cellArray.insertNextCell([3, 4, 5, 6]);
  t.equal(
    cellArray.getNumberOfCells(),
    2,
    'number of cells after second insertNextCell'
  );
  t.deepEqual(
    cellArray.getData(),
    Uint16Array.from([3, 0, 1, 2, 4, 3, 4, 5, 6]),
    'getData after second insertNextCell'
  );
  t.end();
});
