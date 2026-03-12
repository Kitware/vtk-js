import { it, expect } from 'vitest';
import vtkCalculator from 'vtk.js/Sources/Filters/General/Calculator';
import vtkImageGridSource from 'vtk.js/Sources/Filters/Sources/ImageGridSource';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import { AttributeTypes } from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';
import { FieldDataTypes } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';

it('Test vtkCalculator instance', () => {
  expect(vtkCalculator, 'Make sure the class definition exists.').toBeTruthy();
  const instance = vtkCalculator.newInstance();
  expect(instance, 'Make sure an instance can be created.').toBeTruthy();
});

it('Test vtkCalculator execution', () => {
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

  expect(output, 'Output dataset exists').toBeTruthy();
  expect(
    output.isA('vtkPolyData'),
    'The output dataset should be a vtkPolydata'
  ).toBe(true);
  expect(
    input.getPoints().getNumberOfPoints(),
    `The number of points did not change between input ${input
      .getPoints()
      .getNumberOfPoints()} and output ${output
      .getPoints()
      .getNumberOfPoints()}`
  ).toBe(output.getPoints().getNumberOfPoints());
  expect(
    output.getPointData().getScalars(),
    'Output point-scalars array exists.'
  ).toBeTruthy();
  expect(
    output.getPointData().getScalars().getName(),
    'Output point-scalars is "sine wave".'
  ).toBe('sine wave');
  expect(
    output.getFieldData().getArray('global'),
    'Output field-data array exists.'
  ).toBeTruthy();
  const uniform = output.getFieldData().getArray('global').getData();
  expect(
    Math.abs(uniform[0] - 22.55) < 1e-6,
    `The uniform result variable should be 22.55; got ${uniform[0]}.`
  ).toBeTruthy();
});

it('make sure vtkCalculator does not crash with a vtkImageData input', () => {
  const source = vtkImageGridSource.newInstance();
  const filter = vtkCalculator.newInstance();

  filter.setInputConnection(source.getOutputPort());
  filter.setFormulaSimple(FieldDataTypes.POINT, ['scalars'], 'mask', (value) =>
    value > 10 ? 1 : 0
  );

  source.update();
  filter.update();

  const input = source.getOutputData();
  const output = filter.getOutputData();

  expect(output, 'Output dataset exists').toBeTruthy();
  expect(
    output.isA('vtkImageData'),
    'The output dataset should be a vtkImagedata'
  ).toBe(true);
  expect(
    input.getNumberOfPoints(),
    `The number of points did not change between input ${input.getNumberOfPoints()} and output ${output.getNumberOfPoints()}`
  ).toBe(output.getNumberOfPoints());
  expect(
    output.getPointData().getScalars(),
    'Output point-scalars array exists.'
  ).toBeTruthy();
  expect(
    output.getPointData().getScalars().getName(),
    'Output point-scalars is "mask".'
  ).toBe('mask');
});
