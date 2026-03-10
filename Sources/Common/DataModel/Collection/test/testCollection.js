import { it, expect } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';
import vtkCollection from 'vtk.js/Sources/Common/DataModel/Collection';

it('Test vtkCollection instance', () => {
  expect(vtkCollection, 'Make sure the class definition exists').toBeTruthy();
  const instance = vtkCollection.newInstance();
  expect(instance).toBeTruthy();
});

it('Test vtkCollection functions', () => {
  // const spacing = 0.7;
  const spacing = [0.7, 0.7, 0.7];
  const size = 4;

  const collection = vtkCollection.newInstance();

  const inArray = [];
  for (let i = 0; i < 5; ++i) {
    const image = testUtils.createImage(
      [size * (i + 1), size * (i + 1), 1],
      spacing
    );
    collection.addItem(image);
    inArray.push(image);
  }

  expect(
    collection.getItem(0) === inArray[0] &&
      collection.getItem(1) === inArray[1] &&
      collection.getItem(2) === inArray[2] &&
      collection.getItem(3) === inArray[3] &&
      collection.getItem(4) === inArray[4],
    'Check for addItem.'
  ).toBeTruthy();

  const insertItems = [];
  insertItems[0] = testUtils.createImage([8, 8, 1], spacing);
  insertItems[1] = testUtils.createImage([13, 13, 1], spacing);
  insertItems[2] = testUtils.createImage([16, 16, 1], spacing);
  collection.insertItem(2, insertItems[0]);
  collection.replaceItem(3, insertItems[1]);
  collection.insertItem(4, insertItems[2]);

  collection.removeItem(5);
  collection.removeItem(inArray[4]);

  expect(
    collection.getNumberOfItems() === 5 &&
      collection.getItem(0) === inArray[0] &&
      collection.getItem(1) === inArray[1] &&
      collection.getItem(2) === insertItems[0] &&
      collection.getItem(3) === insertItems[1] &&
      collection.isItemPresent(insertItems[1]) &&
      collection.getItem(4) === insertItems[2],
    'Check inserted items and number of inserted items.'
  ).toBeTruthy();

  expect(
    !collection.isItemPresent(inArray[4]),
    'Check if deleted item is still present.'
  ).toBeTruthy();

  collection.forEach((img) => img.setSpacing(0.1, 0.2, 0.3));

  expect(
    collection.getItem(0).getSpacing()[0] === 0.1 &&
      collection.getItem(0).getSpacing()[1] === 0.2 &&
      collection.getItem(0).getSpacing()[2] === 0.3,
    'Check if spacing was set thru forEach() call.'
  ).toBeTruthy();

  expect(
    collection.reduce((acc, img) => acc + img.getSpacing()[0], 0) === 0.5,
    'Check reduce call.'
  ).toBeTruthy();

  insertItems[0].modified();
  expect(
    collection.getMTime() < insertItems[0].getMTime(),
    'MTime before update call.'
  ).toBeTruthy();

  collection.updateMTimeWithElements();
  expect(
    collection.getMTime() > insertItems[0].getMTime(),
    'MTime after update call.'
  ).toBeTruthy();

  collection.removeAllItems();
  expect(
    collection.getNumberOfItems() === 0 && collection.empty(),
    'Check if all items were removed.'
  ).toBeTruthy();
});
