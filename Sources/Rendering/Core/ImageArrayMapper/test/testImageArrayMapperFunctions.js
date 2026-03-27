import { it, expect } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkCollection from 'vtk.js/Sources/Common/DataModel/Collection';
import vtkImageArrayMapper from 'vtk.js/Sources/Rendering/Core/ImageArrayMapper';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';

const { SlicingMode } = vtkImageMapper;

it('Test ImageArrayMapper', () => {
  const gc = testUtils.createGarbageCollector();
  const collection = gc.registerResource(vtkCollection.newInstance());
  collection.addItem(testUtils.createImage([4, 4, 1], [0.1, 0.1, 0.1]));
  collection.addItem(testUtils.createImage([8, 4, 5], [0.1, 0.1, 0.1]));
  collection.addItem(testUtils.createImage([9, 3, 1], [0.1, 0.1, 0.1]));
  const mapper = gc.registerResource(vtkImageArrayMapper.newInstance());

  expect(mapper, 'Check mapper instance.').toBeTruthy();

  mapper.setInputData(collection);
  expect(mapper.getInputData(), 'getInputData').toBe(collection);
  expect(mapper.getTotalSlices(), 'getTotalSlices').toBe(7);
  expect(mapper.computeTotalSlices(), 'computeTotalSlices').toBe(7);

  mapper.setSlice(3);
  expect(mapper.getImage() === collection.getItem(1), 'getImage').toBeTruthy();

  let bounds = mapper.getBounds();
  bounds = bounds.map((value) => value.toFixed(2));
  expect(bounds, 'getBounds').toEqual([
    '-0.05',
    '0.75',
    '-0.05',
    '0.35',
    '-0.05',
    '0.45',
  ]);

  bounds = mapper.getBoundsForSlice(1, 0.5);
  bounds = bounds.map((value) => value.toFixed(2));
  expect(bounds, 'getBoundsForSlice').toEqual([
    '-0.05',
    '0.75',
    '-0.05',
    '0.35',
    '-0.05',
    '0.05',
  ]);

  mapper.setUseCustomExtents(true);
  mapper.setCustomDisplayExtentFrom([2, 7, 2, 3, 1, 1]);
  bounds = mapper.getBounds();
  bounds = bounds.map((value) => value.toFixed(2));
  expect(bounds, 'setUseCustomExtents setCustomDisplayExtentFrom').toEqual([
    '0.20',
    '0.70',
    '0.20',
    '0.30',
    '0.20',
    '0.20',
  ]);

  const closestIJK = mapper.getClosestIJKAxis();
  expect(closestIJK, 'getClosestIJKAxis').toEqual({
    ijkMode: SlicingMode.K,
    flip: false,
  });

  const slice = mapper.computeSlice(1, 2);
  mapper.setSlice(slice);
  expect(slice, 'computeSlice(1, 2)').toBe(3);
  expect(mapper.getImageIndex(), 'getImageIndex()').toBe(1);
  expect(mapper.getImageIndex(slice), 'getImageIndex(slice)').toBe(1);
  expect(mapper.getImageIndex(6), 'getImageIndex(6)').toBe(2);
  expect(mapper.getSubSlice(), 'getSubSlice()').toBe(2);
  expect(mapper.getSubSlice(slice), 'getSubSlice(slice)').toBe(2);
  expect(mapper.getSubSlice(4), 'getSubSlice(4)').toBe(3);
  expect(mapper.getSubSlice(6), 'getSubSlice(6)').toBe(0);
  /*
  expect(slice === 3 &&
      mapper.getImageIndex() === 1 &&
      mapper.getImageIndex(slice) === 1 &&
      mapper.getImageIndex(6) === 2 &&
      mapper.getSubSlice() === 2 &&
      mapper.getSubSlice(slice) === 2 &&
      mapper.getSubSlice(4) === 3 &&
      mapper.getSubSlice(6) === 0).toBeTruthy();
  */

  expect(
    mapper.getCurrentImage() === mapper.getImage(slice) &&
      mapper.getCurrentImage() === collection.getItem(1),
    'getCurrentImage'
  ).toBeTruthy();

  collection.removeItem(2);
  mapper.setSlice(0);
  expect(
    mapper.getTotalSlices(),
    'collection.removeItem() and total slices'
  ).toBe(6);
});
