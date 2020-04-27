import test from 'tape-catch';

import vtkCalculator from 'vtk.js/Sources/Filters/General/Calculator';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import { AttributeTypes } from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';
import { FieldDataTypes } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';

test('Test vtkCalculator instance', (t) => {
  t.ok(vtkCalculator, 'Make sure the class definition exists.');
  const instance = vtkCalculator.newInstance();
  t.ok(instance, 'Make sure an instance can be created.');

  t.end();
});

test('Test vtkCalculator execution', (t) => {
  const source = vtkPlaneSource.newInstance({
    xResolution: 5,
    yResolution: 10,
  });
  const filter = vtkCalculator.newInstance();
  filter.setInputConnection(source.getOutputPort());
  filter.setFormula({
    getArrays: (inputDataSets) => ({
      input: [{ location: FieldDataTypes.COORDINATE }],
      output: [
        {
          location: FieldDataTypes.POINT,
          name: 'sine wave',
          dataType: 'Float64Array',
          attribute: AttributeTypes.SCALARS,
        },
        {
          location: FieldDataTypes.UNIFORM,
          name: 'global',
          dataType: 'Float32Array',
          tuples: 1,
        },
      ],
    }),
    evaluate: (arraysIn, arraysOut) => {
      const [coords] = arraysIn.map((d) => d.getData());
      const [sine, glob] = arraysOut.map((d) => d.getData());

      for (let i = 0, sz = coords.length / 3; i < sz; ++i) {
        const dx = coords[3 * i] - 0.5;
        const dy = coords[3 * i + 1] - 0.5;
        sine[i] = dx * dx + dy * dy + 0.125;
      }
      glob[0] = sine.reduce((result, value) => result + value, 0);
      arraysOut.forEach((arr) => arr.modified());
    },
  });

  source.update();
  filter.update();
  const input = source.getOutputData();
  const output = filter.getOutputData();

  t.ok(output, 'Output dataset exists');
  t.equal(
    output.isA('vtkPolyData'),
    true,
    'The output dataset should be a vtkPolydata'
  );
  t.equal(
    input.getPoints().getNumberOfPoints(),
    output.getPoints().getNumberOfPoints(),
    `The number of points did not change between input ${input
      .getPoints()
      .getNumberOfPoints()} and output ${output
      .getPoints()
      .getNumberOfPoints()}`
  );
  t.ok(
    output.getPointData().getScalars(),
    'Output point-scalars array exists.'
  );
  t.equal(
    output.getPointData().getScalars().getName(),
    'sine wave',
    'Output point-scalars is "sine wave".'
  );
  t.ok(
    output.getFieldData().getArray('global'),
    'Output field-data array exists.'
  );
  const uniform = output.getFieldData().getArray('global').getData();
  t.ok(
    Math.abs(uniform[0] - 22.55) < 1e-6,
    `The uniform result variable should be 22.55; got ${uniform[0]}.`
  );

  t.end();
});
