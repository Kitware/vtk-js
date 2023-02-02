import test from 'tape-catch';

import vtkImageArrayMapper from 'vtk.js/Sources/Rendering/Core/ImageArrayMapper';

test('Test vtkAbstractImageMapper publicAPI', (t) => {
  const mapper = vtkImageArrayMapper.newInstance();
  t.equal(mapper.getIsOpaque(), true);
  t.equal(mapper.getCurrentImage(), null);
  t.end();
});
