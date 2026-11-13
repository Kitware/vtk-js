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

it('vtkMTLReader sends busy true and busy false for image loads', async () => {
  const reader = vtkMTLReader.newInstance();
  const events = [];
  const done = new Promise((resolve) => {
    reader.onBusy((busy) => {
      events.push(busy);
      if (!busy) {
        resolve();
      }
    });
  });
  // The map_Kd lines start the load of two texture images. The images do not
  // exist, thus the loads fail.
  reader.parseAsText(
    [
      'newmtl tex1',
      'map_Kd missing1.png',
      'newmtl tex2',
      'map_Kd missing2.png',
    ].join('\n')
  );

  expect(reader.isBusy()).toBe(true);
  expect(events).toEqual([true]);

  await done;
  expect(reader.isBusy()).toBe(false);
  expect(events).toEqual([true, false]);
});
