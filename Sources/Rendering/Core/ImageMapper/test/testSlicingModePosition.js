import { it, expect } from 'vitest';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import { SlicingMode } from 'vtk.js/Sources/Rendering/Core/ImageMapper/Constants';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkRTAnalyticSource from 'vtk.js/Sources/Filters/Sources/RTAnalyticSource';

it('Test slice position differences between XYZ and IJK modes', () => {
  const source = vtkRTAnalyticSource.newInstance({
    wholeExtent: [0, 10, 0, 10, 0, 10],
  });
  source.update();
  const image = source.getOutputData();
  image.setSpacing([10, 10, 10]);
  global.image = image;
  const mapper = vtkImageMapper.newInstance();
  const slice = vtkImageSlice.newInstance();
  mapper.setInputData(image);

  slice.setMapper(mapper);

  mapper.setSlicingMode(SlicingMode.Z);

  expect(3).toBe(mapper.getSliceAtPosition(30));
  expect(3.5).toBe(mapper.getSliceAtPosition(35));

  expect(5).toBe(mapper.getSliceAtPosition([0, 0, 50]));
  expect(5.5).toBe(mapper.getSliceAtPosition([0, 0, 55]));

  expect(0).toBe(mapper.getSliceAtPosition(-1));
  expect(10).toBe(mapper.getSliceAtPosition(110));
});
