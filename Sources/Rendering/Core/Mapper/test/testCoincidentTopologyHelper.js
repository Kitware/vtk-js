import { it, expect } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

it('Test calling CoincidentTopologyHelper static functions', async () => {
  const gc = testUtils.createGarbageCollector();

  // set back to starting/default values to avoid side effects for other tests
  const startingParameters =
    vtkMapper.getResolveCoincidentTopologyPolygonOffsetParameters();
  vtkMapper.setResolveCoincidentTopologyPolygonOffsetParameters({
    factor: -3,
    offset: -3,
  });
  vtkMapper.setResolveCoincidentTopologyPolygonOffsetParameters(
    startingParameters
  );
  const endingParameters =
    vtkMapper.getResolveCoincidentTopologyPolygonOffsetParameters();
  expect(
    startingParameters,
    'Initial PolygonOffset parameters after get and set are matching'
  ).toEqual(endingParameters);

  const startingLineParameters =
    vtkMapper.getResolveCoincidentTopologyLineOffsetParameters();
  vtkMapper.setResolveCoincidentTopologyLineOffsetParameters(-3, -3);
  vtkMapper.setResolveCoincidentTopologyLineOffsetParameters(
    startingLineParameters
  );

  expect(
    'rendering',
    'CoincidentTopologyHelper functions called without error'
  ).toBeTruthy();

  // Free memory, end the test
  gc.releaseResources();
});
