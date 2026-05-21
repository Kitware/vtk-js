import { it, expect } from 'vitest';
import macro from 'vtk.js/Sources/macros';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkImageStreamline from 'vtk.js/Sources/Filters/General/ImageStreamline';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';

const vecSource = macro.newInstance((publicAPI, model) => {
  macro.obj(publicAPI, model); // make it an object
  macro.algo(publicAPI, model, 0, 1); // mixin algorithm code 1 in, 1 out
  publicAPI.requestData = (inData, outData) => {
    const id = outData[0]?.initialize() || vtkImageData.newInstance();
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
  };
})();

it('Test vtkImageStreamline instance', () => {
  expect(
    vtkImageStreamline,
    'Make sure the class definition exist'
  ).toBeTruthy();
  const instance = vtkImageStreamline.newInstance();
  expect(instance, 'Make sure the instance exist').toBeTruthy();

  expect(
    instance.getIntegrationStep(),
    'Default integrationStep should be 1'
  ).toBe(1);
  expect(
    instance.getMaximumNumberOfSteps(),
    'Default MaximumNumberOfSteps should be 1000'
  ).toBe(1000);

  instance.setIntegrationStep(0.1);
  expect(
    instance.getIntegrationStep(),
    'Updated value of integrationStep should be 0.1'
  ).toBe(0.1);
});

it('Test vtkImageStreamline execution', () => {
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

  expect(output, 'Output dataset exist').toBeTruthy();
  expect(
    output.isA('vtkPolyData'),
    'The output dataset should be a vtkPolydata'
  ).toBe(true);
  expect(
    output.getPoints().getNumberOfPoints(),
    'The number of points should be 2324'
  ).toBe(2324);
});
