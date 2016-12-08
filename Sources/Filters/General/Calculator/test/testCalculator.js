import test from 'tape-catch';
import vtkCalculator from '..';
import vtkPlaneSource from '../../../Sources/PlaneSource';
import { AttributeTypes } from '../../../../Common/DataModel/DataSetAttributes/Constants';
import { FieldDataTypes } from '../../../../Common/DataModel/DataSet/Constants';

test('Test vtkCalculator instance', (t) => {
  t.ok(vtkCalculator, 'Make sure the class definition exists.');
  const instance = vtkCalculator.newInstance();
  t.ok(instance, 'Make sure an instance can be created.');

  t.end();
});

test('Test vtkCalculator execution', (t) => {
    const source = vtkPlaneSource.newInstance({ xResolution: 5, yResolution: 10 });
    const filter = vtkCalculator.newInstance();
    filter.setInputConnection(source.getOutputPort());
    filter.setFormula({
      getArrays: (inputDataSets) => ({
        input: [
          { location: FieldDataTypes.COORDINATE }],
        output: [
          { location: FieldDataTypes.POINT, name: 'sine wave', dataType: 'Float64Array', attribute: AttributeTypes.SCALARS },
          { location: FieldDataTypes.UNIFORM, name: 'global', dataType: 'Float32Array', tuples: 1 },
        ]}),
      evaluate: (arraysIn, arraysOut) => {
        const [coords] = arraysIn.map(d => d.getData());
        const [sine, glob] = arraysOut.map(d => d.getData());

        coords.forEach((xyz, i) => { sine[i] = (xyz[0] + xyz[1]) * xyz[2]; });
        glob[0] = sine.reduce((result, value) => result + value, 0);
      }
    });

    source.update();
    filter.update();
    const input = source.getOutputData();
    const output = filter.getOutputData();

    t.ok(output, 'Output dataset exists');
    t.equal(output.isA('vtkPolyData'), true, 'The output dataset should be a vtkPolydata');
    t.equal(
      input.getPoints().getData().getNumberOfTuples(),
      output.getPoints().getData().getNumberOfTuples(),
      `The number of points did not change between input ${
      input.getPoints().getData().getNumberOfTuples()} and output ${
      output.getPoints().getData().getNumberOfTuples()}`);
    console.log('point arrays ', output.getPointData().getArrays().map(x => x.getName()));
    console.log('point scalars ', output.getPointData().getScalars().getName());

    t.end();
});
