import test               from 'tape-catch';

import vtkAppendPolyData  from 'vtk.js/Sources/Filters/General/AppendPolyData';
import vtkConeSource      from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkCylinderSource  from 'vtk.js/Sources/Filters/Sources/CylinderSource';

import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';

const PointPrecision = vtkAppendPolyData;

test('Test vtkAppendPolyData instance', (t) => {
  t.ok(vtkAppendPolyData, 'Make sure the class definition exists.');
  const instance = vtkAppendPolyData.newInstance();
  t.ok(instance, 'Make sure an instance can be created.');

  t.end();
});

test('Test vtkAppendPolyData execution', (t) => {
  const cone = vtkConeSource.newInstance({ resolution: 6, capping: true });
  const cylinder = vtkCylinderSource.newInstance({ resolution: 6, capping: true });
  const filter = vtkAppendPolyData.newInstance();
  filter.setInputConnection(cone.getOutputPort(), 0);
  filter.setInputConnection(cylinder.getOutputPort(), 1);
  filter.setOutputPointsPrecision(PointPrecision.DEFAULT);

  const outPD = filter.getOutputData();

  t.ok((outPD.getPoints().getNumberOfPoints() === 31),
      'Make sure the number of points is correct.');
  t.ok((outPD.getPoints().getDataType() === VtkDataTypes.FLOAT),
       'Make sure the output data type is correct.');
  const expNumPolys = [cone, cylinder].reduce(
    (count, c) => count + c.getOutputData().getPolys().getNumberOfCells(), 0,
  );
  const outNumPolys = outPD.getPolys().getNumberOfCells();
  t.ok((outNumPolys === expNumPolys),
       'Make sure the number of polys is correct.');

  t.end();
});
