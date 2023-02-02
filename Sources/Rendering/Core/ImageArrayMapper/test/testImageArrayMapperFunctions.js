import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkCollection from 'vtk.js/Sources/Common/DataModel/Collection';
import vtkImageArrayMapper from 'vtk.js/Sources/Rendering/Core/ImageArrayMapper';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';

const { SlicingMode } = vtkImageMapper;

test('Test ImageArrayMapper', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  const collection = gc.registerResource(vtkCollection.newInstance());
  collection.addItem(testUtils.createImage([4, 4, 1], [0.1, 0.1, 0.1]));
  collection.addItem(testUtils.createImage([8, 4, 5], [0.1, 0.1, 0.1]));
  collection.addItem(testUtils.createImage([9, 3, 1], [0.1, 0.1, 0.1]));
  const mapper = gc.registerResource(vtkImageArrayMapper.newInstance());

  t.ok(mapper, 'Check mapper instance.');

  mapper.setInputData(collection);
  t.equal(mapper.getInputData(), collection, 'getInputData');
  t.equal(mapper.getTotalSlices(), 7, 'getTotalSlices');
  t.equal(mapper.computeTotalSlices(), 7, 'computeTotalSlices');

  mapper.setSlice(3);
  t.ok(
    mapper.getImage() === collection.getItem(1),
    mapper.getImage(0) === collection.getItem(0) &&
      mapper.getImage(1) === collection.getItem(1) &&
      mapper.getImage(2) === collection.getItem(2) &&
      mapper.getImage(3) === collection.getItem(2) &&
      mapper.getImage(4) === collection.getItem(2) &&
      mapper.getImage(5) === collection.getItem(2) &&
      mapper.getImage(6) === collection.getItem(2) &&
      mapper.getImage(7) === null,
    'getImage'
  );

  let bounds = mapper.getBounds();
  bounds = bounds.map((value) => value.toFixed(2));
  t.deepEqual(
    bounds,
    ['-0.05', '0.75', '-0.05', '0.35', '-0.05', '0.45'],
    'getBounds'
  );

  bounds = mapper.getBoundsForSlice(1, 0.5);
  bounds = bounds.map((value) => value.toFixed(2));
  t.deepEqual(
    bounds,
    ['-0.05', '0.75', '-0.05', '0.35', '-0.05', '0.05'],
    'getBoundsForSlice'
  );

  mapper.setUseCustomExtents(true);
  mapper.setCustomDisplayExtentFrom([2, 7, 2, 3, 1, 1]);
  bounds = mapper.getBounds();
  bounds = bounds.map((value) => value.toFixed(2));
  t.deepEqual(
    bounds,
    ['0.20', '0.70', '0.20', '0.30', '0.20', '0.20'],
    'setUseCustomExtents setCustomDisplayExtentFrom'
  );

  const closestIJK = mapper.getClosestIJKAxis();
  t.deepEqual(
    closestIJK,
    { ijkMode: SlicingMode.K, flip: false },
    'getClosestIJKAxis'
  );

  const slice = mapper.computeSlice(1, 2);
  mapper.setSlice(slice);
  t.equal(slice, 3, 'computeSlice(1, 2)');
  t.equal(mapper.getImageIndex(), 1, 'getImageIndex()');
  t.equal(mapper.getImageIndex(slice), 1, 'getImageIndex(slice)');
  t.equal(mapper.getImageIndex(6), 2, 'getImageIndex(6)');
  t.equal(mapper.getSubSlice(), 2, 'getSubSlice()');
  t.equal(mapper.getSubSlice(slice), 2, 'getSubSlice(slice)');
  t.equal(mapper.getSubSlice(4), 3, 'getSubSlice(4)');
  t.equal(mapper.getSubSlice(6), 0, 'getSubSlice(6)');
  /*
  t.ok(
    slice === 3 &&
      mapper.getImageIndex() === 1 &&
      mapper.getImageIndex(slice) === 1 &&
      mapper.getImageIndex(6) === 2 &&
      mapper.getSubSlice() === 2 &&
      mapper.getSubSlice(slice) === 2 &&
      mapper.getSubSlice(4) === 3 &&
      mapper.getSubSlice(6) === 0,
    'computeSlice -> setSlice -> getImageIndex, getSubSlice'
  );
  */

  t.ok(
    mapper.getCurrentImage() === mapper.getImage(slice) &&
      mapper.getCurrentImage() === collection.getItem(1),
    'getCurrentImage'
  );

  collection.removeItem(2);
  mapper.setSlice(0);
  t.equal(
    mapper.getTotalSlices(),
    6,
    'collection.removeItem() and total slices'
  );

  t.end();
});
