import { it, expect } from 'vitest';
import vtkMTLReader from 'vtk.js/Sources/IO/Misc/MTLReader';

it('vtkMTLReader reads a material named __proto__', () => {
  const reader = vtkMTLReader.newInstance();
  reader.parseAsText(
    ['newmtl __proto__', 'Kd 1 0 0', '__proto__ 1 2'].join('\n')
  );

  expect(reader.getMaterialNames()).toEqual(['__proto__']);
  expect(reader.getMaterial('__proto__').Kd).toEqual(['1', '0', '0']);
  expect({}.Kd).toBeUndefined();
  expect(Object.prototype).not.toHaveProperty('Kd');
});
