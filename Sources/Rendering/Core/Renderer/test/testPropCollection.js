import { expect, it } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';

it.each([
  ['getActors', vtkActor, vtkImageSlice],
  ['getVolumes', vtkVolume, vtkVolume],
])('%s collects props into fresh snapshots', (method, type, singleType) => {
  const gc = testUtils.createGarbageCollector();
  const renderer = gc.registerResource(vtkRenderer.newInstance());
  const first = gc.registerResource(type.newInstance());
  const second = gc.registerResource(type.newInstance());
  const single = gc.registerResource(singleType.newInstance());
  const composite = { [method]: () => [first, second] };

  renderer.addViewProp(composite);
  renderer.addViewProp({ [method]: () => [] });
  renderer.addViewProp({ [method]: () => single });
  const snapshot = renderer[method]();
  expect(snapshot).toEqual([first, second, single]);
  expect(renderer[method]()).not.toBe(snapshot);

  renderer.removeViewProp(composite);
  renderer.addViewProp(first);
  const current = renderer[method]();
  expect(current).toEqual([single, first]);
  expect(renderer[`${method}ByReference`]()).toBe(current);
  expect(snapshot).toEqual([first, second, single]);

  gc.releaseResources();
});
