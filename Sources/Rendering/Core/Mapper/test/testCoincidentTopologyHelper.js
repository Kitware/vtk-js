import test from 'tape';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

test('Test calling CoincidentTopologyHelper static functions', async (t) => {
  const gc = testUtils.createGarbageCollector(t);

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
  t.deepEqual(
    startingParameters,
    endingParameters,
    'Initial PolygonOffset parameters after get and set are matching'
  );

  const startingLineParameters =
    vtkMapper.getResolveCoincidentTopologyLineOffsetParameters();
  vtkMapper.setResolveCoincidentTopologyLineOffsetParameters(-3, -3);
  vtkMapper.setResolveCoincidentTopologyLineOffsetParameters(
    startingLineParameters
  );

  t.ok('rendering', 'CoincidentTopologyHelper functions called without error');

  // Free memory, end the test
  gc.releaseResources();
});
