import test from 'tape-catch';

import macro from 'vtk.js/Sources/macros';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkImageStreamline from 'vtk.js/Sources/Filters/General/ImageStreamline';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';

const vecSource = macro.newInstance((publicAPI, model) => {
  macro.obj(publicAPI, model); // make it an object
  macro.algo(publicAPI, model, 0, 1); // mixin algorithm code 1 in, 1 out
  publicAPI.requestData = (inData, outData) => {
    // implement requestData
    if (!outData[0]) {
      const id = vtkImageData.newInstance();
      id.setSpacing(0.1, 0.1, 0.1);
      id.setExtent(0, 9, 0, 9, 0, 9);
      const dims = [10, 10, 10];

      const newArray = new Float32Array(3 * dims[0] * dims[1] * dims[2]);

      let i = 0;
      for (let z = 0; z <= 9; z++) {
        for (let y = 0; y <= 9; y++) {
          for (let x = 0; x <= 9; x++) {
            newArray[i++] = 0.1 * x;
            const v = 0.1 * y;
            newArray[i++] = v * v;
            newArray[i++] = 0;
          }
        }
      }

      const da = vtkDataArray.newInstance({
        numberOfComponents: 3,
        values: newArray,
      });
      da.setName('vectors');

      const cpd = id.getPointData();
      cpd.setVectors(da);

      // Update output
      outData[0] = id;
    }
  };
})();

test('Test vtkImageStreamline instance', (t) => {
  t.ok(vtkImageStreamline, 'Make sure the class definition exist');
  const instance = vtkImageStreamline.newInstance();
  t.ok(instance, 'Make sure the instance exist');

  t.equal(
    instance.getIntegrationStep(),
    1,
    'Default integrationStep should be 1'
  );
  t.equal(
    instance.getMaximumNumberOfSteps(),
    1000,
    'Default MaximumNumberOfSteps should be 1000'
  );

  instance.setIntegrationStep(0.1);
  t.equal(
    instance.getIntegrationStep(),
    0.1,
    'Updated value of integrationStep should be 0.1'
  );

  t.end();
});

test('Test vtkImageStreamline execution', (t) => {
  const planeSource = vtkPlaneSource.newInstance();
  planeSource.setOrigin(0.05, 0.05, 0.05);
  planeSource.setPoint1(0.05, 0.85, 0.05);
  planeSource.setPoint2(0.05, 0.05, 0.85);
  planeSource.setXResolution(3);
  planeSource.setYResolution(3);

  const filter = vtkImageStreamline.newInstance();
  filter.setIntegrationStep(0.01);
  filter.setInputConnection(vecSource.getOutputPort());
  filter.setInputConnection(planeSource.getOutputPort(), 1);

  filter.update();

  const output = filter.getOutputData();

  t.ok(output, 'Output dataset exist');
  t.equal(
    output.isA('vtkPolyData'),
    true,
    'The output dataset should be a vtkPolydata'
  );
  t.equal(
    output.getPoints().getNumberOfPoints(),
    2324,
    'The number of points should be 2324'
  );

  t.end();
});
