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
  // Public API methods
  publicAPI.exposedMethod = () => {
    // This is a publicly exposed method of this object
  };
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

  // macro.setGet(publicAPI, model, [
  //   { name: 'myProp7', enum: MY_ENUM, type: 'enum' },
  // ]);
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

  // set a too-short array.
  myTestClass.setMyProp6(1, 2, 3);
  // t.deepEqual(myTestClass.getMyProp6(), DEFAULT_VALUES.myProp6, 'Keep default value after illegal set');

  t.end();
});
