import test from 'tape-catch';

import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import { SlicingMode } from 'vtk.js/Sources/Rendering/Core/ImageMapper/Constants';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkRTAnalyticSource from 'vtk.js/Sources/Filters/Sources/RTAnalyticSource';

test('Test slice position differences between XYZ and IJK modes', (t) => {
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

  t.equal(3, mapper.getSliceAtPosition(30));
  t.equal(3.5, mapper.getSliceAtPosition(35));

  t.equal(5, mapper.getSliceAtPosition([0, 0, 50]));
  t.equal(5.5, mapper.getSliceAtPosition([0, 0, 55]));

  t.equal(0, mapper.getSliceAtPosition(-1));
  t.equal(10, mapper.getSliceAtPosition(110));

  t.end();
});
