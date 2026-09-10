import { it, expect } from 'vitest';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkImageAppend from 'vtk.js/Sources/Filters/Core/ImageAppend';

it('Test vtkImageAppend', () => {
  const image1 = vtkImageData.newInstance();
  image1.setDimensions(2, 2, 2);
  image1.setSpacing(3, 3, 3);
  image1.setOrigin(5, 5, 5);
  image1
    .getPointData()
    .setScalars(
      vtkDataArray.newInstance({ values: new Uint8Array(2 * 2 * 2).fill(1) })
    );

  const image2 = vtkImageData.newInstance();
  image2.setDimensions(2, 2, 2);
  image2.setExtent(4, 5, 0, 1, 0, 1);
  image2.setSpacing(3, 3, 3);
  image2.setOrigin(5, 5, 5);
  image2
    .getPointData()
    .setScalars(
      vtkDataArray.newInstance({ values: new Uint8Array(2 * 2 * 2).fill(2) })
    );

  const append = vtkImageAppend.newInstance();
  append.setAppendAxis(0);
  append.addInputData(image1);
  append.addInputData(image2);
  append.update();

  const output = append.getOutputData();
  expect(output.getDimensions()).toEqual([4, 2, 2]);
  expect(output.getExtent()).toEqual([0, 3, 0, 1, 0, 1]);
  expect(output.getOrigin()).toEqual([5, 5, 5]);
  expect(output.getSpacing()).toEqual([3, 3, 3]);

  expect(output.getPointData().getScalars().getData()[0]).toEqual(1);
  expect(output.getPointData().getScalars().getData()[2]).toEqual(2);

  append.setPreserveExtents(true);
  append.update();

  expect(output.getDimensions()).toEqual([6, 2, 2]);
  expect(output.getExtent()).toEqual([0, 5, 0, 1, 0, 1]);
  expect(output.getOrigin()).toEqual([5, 5, 5]);
  expect(output.getSpacing()).toEqual([3, 3, 3]);

  expect(output.getPointData().getScalars().getData()[0]).toEqual(1);
  expect(output.getPointData().getScalars().getData()[2]).toEqual(0);
  expect(output.getPointData().getScalars().getData()[4]).toEqual(2);
});
