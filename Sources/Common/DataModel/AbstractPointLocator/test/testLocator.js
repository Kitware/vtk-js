import test from 'tape-catch';
import vtkAbstractPointLocator from 'vtk.js/Sources/Common/DataModel/AbstractPointLocator';

test('Test vtkAbstractPointLocator instance', (t) => {
  t.ok(vtkAbstractPointLocator, 'Make sure the class definition exists');
  t.ok(
    vtkAbstractPointLocator.newInstance === undefined,
    'Make sure class is abstract'
  );
  t.end();
});
