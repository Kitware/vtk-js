import { it, expect } from 'vitest';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkImageAppendComponents from 'vtk.js/Sources/Filters/Imaging/ImageAppendComponents';

it('Test vtkImageAppendComponents', () => {
  const image1 = vtkImageData.newInstance();
  image1.setDimensions(2, 2, 2);
  image1.getPointData().setScalars(
    vtkDataArray.newInstance({
      numberOfComponents: 1,
      values: new Uint8Array(2 * 2 * 2).fill(1),
    })
  );

  const image2 = vtkImageData.newInstance();
  image2.setDimensions(2, 2, 2);
  image2.getPointData().setScalars(
    vtkDataArray.newInstance({
      numberOfComponents: 2,
      values: new Uint8Array(2 * 2 * 2 * 2).fill(2),
    })
  );

  const append = vtkImageAppendComponents.newInstance();
  append.addInputData(image1);
  append.addInputData(image2);
  append.update();

  const output = append.getOutputData();
  expect(output.getDimensions()).toEqual([2, 2, 2]);

  expect(output.getPointData().getScalars().getData()[0]).toEqual(1);
  expect(output.getPointData().getScalars().getData()[1]).toEqual(2);
  expect(output.getPointData().getScalars().getData()[2]).toEqual(2);
  expect(output.getPointData().getScalars().getData()[3]).toEqual(1);
});
