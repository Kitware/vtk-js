import test from 'tape-catch';

import * as macro from '../macro';

const MY_ENUM = {
  ZERO: 0,
  FIRST: 1,
  SECOND: 2,
  THIRD: 3,
};
// ----------------------------------------------------------------------------
// vtkMyClass methods
// ----------------------------------------------------------------------------
function myClass(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkMyClass');
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
const DEFAULT_VALUES = {
  myProp1: [0, 0, 0],
  myProp2: null,          // Do not initialize internal objects here
  myProp3: true,
  myProp4: 6,
  myProp5: [1, 2, 3, 4],
  myProp6: [0.1, 0.2, 0.3, 0.4, 0.5],
  myProp7: MY_ENUM.FIRST,
};

// ----------------------------------------------------------------------------
function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);

  // Create get-only macros
  macro.get(publicAPI, model, ['myProp2', 'myProp4']);
  // Create get-set macros
  macro.setGet(publicAPI, model, ['myProp3']);
  // Create set macros
  macro.set(publicAPI, model, ['myProp4']);
  // Create set macros for array (needs to know size)
  macro.setArray(publicAPI, model, ['myProp5'], 4);
  // Create get macros for array
  macro.getArray(publicAPI, model, ['myProp1', 'myProp5']);
  macro.setGetArray(publicAPI, model, ['myProp6'], 5);

  macro.setGet(publicAPI, model, [
    { name: 'myProp7', enum: MY_ENUM, type: 'enum' },
  ]);
  // Object specific methods
  myClass(publicAPI, model);
}

const newInstance = macro.newInstance(extend, 'vtkMyClass');


test('Macro methods scalar tests', (t) => {
  t.ok('macros', 'macro setget');

  const myTestClass = newInstance();

  t.equal(myTestClass.getMyProp3(), DEFAULT_VALUES.myProp3, 'Initial gets should match defaults');
  myTestClass.setMyProp3(false);
  t.equal(myTestClass.getMyProp3(), false, 'Bool get should match set');

  const mtime1 = myTestClass.getMTime();
  t.equal(myTestClass.getMyProp4(), DEFAULT_VALUES.myProp4, 'Initial gets should match defaults');
  myTestClass.setMyProp4(42);
  const mtime2 = myTestClass.getMTime();
  t.equal(myTestClass.getMyProp4(), 42, 'Int get should match set');
  t.ok(mtime2 > mtime1, 'mtime should increase after set');
  myTestClass.setMyProp4(42);
  const mtime3 = myTestClass.getMTime();
  t.ok(mtime3 === mtime2, 'mtime should not increase after idempotent set');

  t.end();
});

test('Macro methods array tests', (t) => {
  const myTestClass = newInstance();

  t.deepEqual(myTestClass.getMyProp1(), DEFAULT_VALUES.myProp1, 'Initial gets should match defaults');
  // we must wrap the non-existent call inside another function to avoid test program exiting, and tape-catch generating error.
  t.throws(() => myTestClass.setMyProp1(1, 1, 1), /TypeError/, 'Throw if no set method declared');

  const myArray = [10, 20, 30, 40];
  t.ok(myTestClass.setMyProp5(...myArray), 'Array spread set OK');
  t.deepEqual(myTestClass.getMyProp5(), myArray, 'Array spread set should match get');

  const mtime1 = myTestClass.getMTime();
  myArray[0] = 99.9;
  t.ok(myTestClass.setMyProp5(myArray), 'OK to set a single array argument');
  t.deepEqual(myTestClass.getMyProp5(), myArray, 'Array set should match get');

  const mtime2 = myTestClass.getMTime();
  t.ok(mtime2 > mtime1, 'mtime should increase after set');
  // set a too-short array, separate args
  t.throws(() => myTestClass.setMyProp6(1, 2, 3), /RangeError/, 'Invalid number of values should throw');
  t.deepEqual(myTestClass.getMyProp6(), DEFAULT_VALUES.myProp6, 'Keep default value after illegal set');

  const mtime3 = myTestClass.getMTime();
  t.ok(mtime3 === mtime2, 'mtime should not increase after idempotent set');

  // set a too-long array, single array arg
  t.throws(() => myTestClass.setMyProp5([].concat(myArray, 555)), /RangeError/, 'Invalid number of values should throw');
  t.deepEqual(myTestClass.getMyProp5(), myArray, 'Keep value after illegal set');

  // set an string
  t.throws(() => myTestClass.setMyProp5('a string, really'), /RangeError/, 'Invalid set with string should throw');
  t.deepEqual(myTestClass.getMyProp5(), myArray, 'Keep value after illegal set');

  t.end();
});

test('Macro methods enum tests', (t) => {
  const myTestClass = newInstance();

  t.equal(myTestClass.getMyProp7(), DEFAULT_VALUES.myProp7, 'Initial gets should match defaults');
  myTestClass.setMyProp7(MY_ENUM.THIRD);
  t.equal(myTestClass.getMyProp7(), MY_ENUM.THIRD, 'Enum set should match get');

  t.ok(myTestClass.setMyProp7(2));
  t.equal(myTestClass.getMyProp7(), MY_ENUM.SECOND, 'Enum set by index should get matching enum value');

  t.notOk(myTestClass.setMyProp7(2), 'Setting idempotent value should return false');

  t.throws(() => myTestClass.setMyProp7(42), /RangeError/, 'Invalid enum index should throw');
  t.equal(myTestClass.getMyProp7(), MY_ENUM.SECOND, 'Enum set out of range should be rejected');

  t.throws(() => myTestClass.setMyProp7('FORTH'), /RangeError/, 'Invalid enum string should throw');
  t.equal(myTestClass.getMyProp7(), MY_ENUM.SECOND, 'Enum set string out of range should be rejected');

  t.throws(() => myTestClass.setMyProp7([2]), /TypeError/, 'Invalid enum set with array/object should throw');
  t.equal(myTestClass.getMyProp7(), MY_ENUM.SECOND, 'Enum set string out of range should be rejected');

  t.end();
});

test('Macro methods object tests', (t) => {
  const myTestClass = newInstance();

  t.ok(myTestClass.get(), 'Get entire model');
  t.deepEqual(myTestClass.get(...Object.keys(DEFAULT_VALUES)), DEFAULT_VALUES, 'Get defaults back test');

  t.throws(() => { myTestClass.getMyProp1 = () => ('42'); }, /TypeError/, 'Object should be frozen');

  t.ok(myTestClass.set({ changeWhenModified: 'foo' }));
  const off = myTestClass.onModified((publicAPI) => { publicAPI.set({ changeWhenModified: 'bar' }); });
  t.ok(myTestClass.setMyProp3(false));
  t.deepEqual(myTestClass.get('changeWhenModified'), { changeWhenModified: 'bar' }, 'Object modified fires');
  off.unsubscribe();
  myTestClass.set({ changeWhenModified: 'foobaz' });
  myTestClass.setMyProp3(true);
  t.deepEqual(myTestClass.get('changeWhenModified'), { changeWhenModified: 'foobaz' }, 'Object modified does not fire after unsubscribe');

  t.ok(myTestClass.set({ myProp4: 99.9, myProp5: [1, 1, 1, 1] }), 'Test mult-set');
  t.equal(myTestClass.getMyProp4(), 99.9, 'Float get should match multi-set');
  t.deepEqual(myTestClass.getMyProp5(), [1, 1, 1, 1], 'Array multi-set should match get');

  t.ok(myTestClass.isA('vtkMyClass'));
  t.ok(myTestClass.isA('vtkObject'));
  t.notOk(myTestClass.isA('vtkPoint'));
  t.equal(myTestClass.getClassName(), 'vtkMyClass');

  t.doesNotThrow(() => myTestClass.delete());
  t.notOk(myTestClass.getMyProp4(), 'All calls should do nothing after delete');

  t.end();
});
