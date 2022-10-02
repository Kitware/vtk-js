import test from 'tape-catch';
import vtkLocator from 'vtk.js/Sources/Common/DataModel/Locator';

test('Test vtkLocator instance', (t) => {
  t.ok(vtkLocator, 'Make sure the class definition exists');
  t.ok(vtkLocator.newInstance === undefined, 'Make sure class is abstract');
  t.end();
});
