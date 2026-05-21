import { it, expect } from 'vitest';
import vtkImageArrayMapper from 'vtk.js/Sources/Rendering/Core/ImageArrayMapper';

it('Test vtkAbstractImageMapper publicAPI', () => {
  const mapper = vtkImageArrayMapper.newInstance();
  expect(mapper.getIsOpaque()).toBe(true);
  expect(mapper.getCurrentImage()).toBe(null);
});
