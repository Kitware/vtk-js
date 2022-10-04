import test from 'tape-catch';
import macro from 'vtk.js/Sources/macros';

const MY_ENUM = {
  ZERO: 0,
  FIRST: 1,
  SECOND: 2,
  THIRD: 3,
};

const EVENTS = ['TestAbort', 'TestPriority'];

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
  myProp2: null, // Do not initialize internal objects here
  myProp3: true,
  myProp4: 6,
  myProp5: [1, 2, 3, 4],
  myProp6: [0.1, 0.2, 0.3, 0.4, 0.5],
  myProp7: MY_ENUM.FIRST,
  myProp8: [1, 2, 3],
  myProp9: null,
  // myProp10: null,
  myProp11: 11,
  _myProp12: [12],
  _myProp13: 13,
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

  // setArray macros with default value
  macro.setGetArray(publicAPI, model, ['myProp8'], 3, 0);

  // setArray macros with no initial value
  macro.setGetArray(publicAPI, model, ['myProp9'], 3);

  // setArray macros with no size
  macro.setGetArray(publicAPI, model, ['myProp10']);

  // Protected variables
  macro.setGet(publicAPI, model, ['_myProp11']);
  macro.setGetArray(publicAPI, model, ['_myProp12'], 1);
  macro.moveToProtected(publicAPI, model, ['myProp11', 'myProp12', 'myProp13']);

  // Object specific methods
  myClass(publicAPI, model);

  // event methods
  EVENTS.forEach((name) => macro.event(publicAPI, model, name));

  // keystore methods
  macro.keystore(publicAPI, model, { key1: 'value1', key2: 'value2' });
}

const newInstance = macro.newInstance(extend, 'vtkMyClass');

test('Macro methods scalar tests', (t) => {
  t.ok('macros', 'macro setget');

  const myTestClass = newInstance();

  t.equal(
    myTestClass.getMyProp3(),
    DEFAULT_VALUES.myProp3,
    'Initial gets should match defaults'
  );
  myTestClass.setMyProp3(false);
  t.equal(myTestClass.getMyProp3(), false, 'Bool get should match set');

  const mtime1 = myTestClass.getMTime();
  t.equal(
    myTestClass.getMyProp4(),
    DEFAULT_VALUES.myProp4,
    'Initial gets should match defaults'
  );
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

  t.deepEqual(
    myTestClass.getMyProp1(),
    DEFAULT_VALUES.myProp1,
    'Initial gets should match defaults'
  );
  // we must wrap the non-existent call inside another function to avoid test program exiting, and tape-catch generating error.
  t.throws(
    () => myTestClass.setMyProp1(1, 1, 1),
    /TypeError/,
    'Throw if no set method declared'
  );

  const myArray = [10, 20, 30, 40];
  t.ok(myTestClass.setMyProp5(...myArray), 'Array spread set OK');
  t.deepEqual(
    myTestClass.getMyProp5(),
    myArray,
    'Array spread set should match get'
  );

  const mtime1 = myTestClass.getMTime();
  myArray[0] = 99.9;
  t.ok(myTestClass.setMyProp5(myArray), 'OK to set a single array argument');
  const mtime2 = myTestClass.getMTime();
  t.deepEqual(myTestClass.getMyProp5(), myArray, 'Array set should match get');

  t.ok(mtime2 > mtime1, 'mtime should increase after set');

  // set a too-short array, separate args
  t.throws(
    () => myTestClass.setMyProp6(1, 2, 3),
    /RangeError/,
    'Invalid number of values should throw'
  );
  t.deepEqual(
    myTestClass.getMyProp6(),
    DEFAULT_VALUES.myProp6,
    'Keep default value after illegal set'
  );

  const mtime3 = myTestClass.getMTime();
  t.ok(mtime3 === mtime2, 'mtime should not increase after idempotent set');
  t.ok(!myTestClass.setMyProp5(myArray), 'False if set same array');
  t.ok(!myTestClass.setMyProp5(...myArray), 'False if set same array');
  t.ok(!myTestClass.setMyProp5([...myArray]), 'False if set same array');
  t.ok(
    !myTestClass.setMyProp5(new Float64Array(myArray)),
    'False if set same array'
  );
  const mtime4 = myTestClass.getMTime();
  t.ok(mtime4 === mtime3, 'mtime should not increase after same set');

  // set a too-long array, single array arg
  t.throws(
    () => myTestClass.setMyProp5([].concat(myArray, 555)),
    /RangeError/,
    'Invalid number of values should throw'
  );
  t.deepEqual(
    myTestClass.getMyProp5(),
    myArray,
    'Keep value after illegal set'
  );

  // set an string
  t.throws(
    () => myTestClass.setMyProp5('a string, really'),
    /RangeError/,
    'Invalid set with string should throw'
  );
  t.deepEqual(
    myTestClass.getMyProp5(),
    myArray,
    'Keep value after illegal set'
  );

  const typedArray = new Float64Array(5);
  t.ok(myTestClass.setMyProp6(typedArray), 'OK to set a typed array argument');
  typedArray[0] = 1;
  t.equal(
    myTestClass.getMyProp6()[0],
    0,
    'setArray should copy input argument'
  );

  // Test default values
  t.ok(myTestClass.setMyProp8(), 'OK to set no argument');
  t.equal(
    myTestClass.setMyProp8([]),
    false,
    'OK to set same empty array as argument'
  );
  t.equal(
    myTestClass.setMyProp8(new Uint8Array()),
    false,
    'OK to set same empty typedarray as argument'
  );
  t.ok(myTestClass.setMyProp8(10), 'OK to set not enough argument');
  t.equal(
    myTestClass.setMyProp8(new Float64Array([10])),
    false,
    'OK to set too short typed array argument'
  );
  t.ok(myTestClass.setMyProp8([2, 3]), 'OK to set too-short array argument');

  t.throws(
    () => myTestClass.setMyProp8(1, 2, 3, 4),
    /RangeError/,
    'Invalid number of values should throw'
  );
  t.throws(
    () => myTestClass.setMyProp8([1, 2, 3, 4]),
    /RangeError/,
    'Too large array should throw'
  );
  t.throws(
    () => myTestClass.setMyProp8(new Float32Array(4)),
    /RangeError/,
    'Too large array should throw'
  );

  t.throws(
    () => newInstance({ myProp9: [] }),
    /RangeError/,
    'Empty array should throw'
  );

  t.equal(myTestClass.setMyProp9(null), false);
  t.equal(myTestClass.setMyProp9([0, 1, 2]), true);
  t.throws(
    () => myTestClass.setMyProp9(),
    /RangeError/,
    'Empty array should throw'
  );
  t.throws(
    () => myTestClass.setMyProp9([]),
    /RangeError/,
    'Empty array should throw'
  );

  t.ok(
    myTestClass.setMyProp10([0, 1, 2]),
    'Test setting array from undefined to unlimited size'
  );
  t.ok(
    myTestClass.setMyProp10([0, 1, 2, 3]),
    'Test setting larger array for unlimited size array'
  );
  t.ok(
    myTestClass.setMyProp10([0, 1, 2]),
    'Test setting smaller array for unlimited size array'
  );

  const a = [2, 3, 4];
  myTestClass.setMyProp10(a);
  t.ok(
    myTestClass.getReferenceByName('myProp10') !== a,
    'Test setting array make a copy'
  );
  a[0] = 3;
  t.ok(
    myTestClass.getMyProp10()[0] === 2,
    'Test setting array do not hold reference'
  );

  t.end();
});

test('Macro protected variables tests', (t) => {
  const defaultInstance = newInstance();
  t.deepEqual(defaultInstance.get('_myProp11', '_myProp12', '_myProp13'), {
    _myProp11: DEFAULT_VALUES.myProp11,
    _myProp12: DEFAULT_VALUES._myProp12,
    _myProp13: DEFAULT_VALUES._myProp13,
  });
  // getter must have been renamed
  t.notOk(defaultInstance.get_myProp11);
  t.notOk(defaultInstance.get_myProp12);
  t.notOk(defaultInstance.get_myProp13);

  // setter must have been renamed
  t.notOk(defaultInstance.set_myProp11);
  t.notOk(defaultInstance.set_myProp12);
  t.notOk(defaultInstance.set_myProp13);

  t.equal(defaultInstance.getMyProp11(), DEFAULT_VALUES.myProp11);
  t.deepEqual(defaultInstance.getMyProp12(), DEFAULT_VALUES._myProp12);
  t.notOk(defaultInstance.getMyProp13);

  t.notOk(defaultInstance.getMyProp11ByReference);
  t.ok(defaultInstance.getMyProp12ByReference);
  t.notOk(defaultInstance.getMyProp11ByReference);

  t.ok(defaultInstance.setMyProp11(111));
  t.ok(defaultInstance.setMyProp12([112]));
  t.notOk(defaultInstance.setMyProp13);

  t.notOk(defaultInstance.setMyProp11From);
  t.ok(defaultInstance.setMyProp12From);
  t.notOk(defaultInstance.setMyProp13From);

  t.equal(defaultInstance.getMyProp11(), 111);
  t.deepEqual(defaultInstance.getMyProp12(), [112]);

  const overridenInstance = newInstance({
    myProp11: 111,
    myProp12: [112],
    myProp13: 113,
  });
  t.deepEqual(overridenInstance.get('_myProp11', '_myProp12', '_myProp13'), {
    _myProp11: 111,
    _myProp12: [112],
    _myProp13: 113,
  });
  const overridenInstance2 = newInstance({
    _myProp11: 111,
    _myProp12: [112],
    _myProp13: 113,
  });
  t.deepEqual(overridenInstance2.get('_myProp11', '_myProp12', '_myProp13'), {
    _myProp11: DEFAULT_VALUES.myProp11, // TBD
    _myProp12: [112],
    _myProp13: 113,
  });
  t.end();
});

test('Macro methods enum tests', (t) => {
  const myTestClass = newInstance();

  t.equal(
    myTestClass.getMyProp7(),
    DEFAULT_VALUES.myProp7,
    'Initial gets should match defaults'
  );
  myTestClass.setMyProp7(MY_ENUM.THIRD);
  t.equal(myTestClass.getMyProp7(), MY_ENUM.THIRD, 'Enum set should match get');

  t.ok(myTestClass.setMyProp7(2));
  t.equal(
    myTestClass.getMyProp7(),
    MY_ENUM.SECOND,
    'Enum set by index should get matching enum value'
  );

  t.notOk(
    myTestClass.setMyProp7(2),
    'Setting idempotent value should return false'
  );

  t.throws(
    () => myTestClass.setMyProp7(42),
    /RangeError/,
    'Invalid enum index should throw'
  );
  t.equal(
    myTestClass.getMyProp7(),
    MY_ENUM.SECOND,
    'Enum set out of range should be rejected'
  );

  t.throws(
    () => myTestClass.setMyProp7('FORTH'),
    /RangeError/,
    'Invalid enum string should throw'
  );
  t.equal(
    myTestClass.getMyProp7(),
    MY_ENUM.SECOND,
    'Enum set string out of range should be rejected'
  );

  t.throws(
    () => myTestClass.setMyProp7([2]),
    /TypeError/,
    'Invalid enum set with array/object should throw'
  );
  t.equal(
    myTestClass.getMyProp7(),
    MY_ENUM.SECOND,
    'Enum set string out of range should be rejected'
  );

  t.end();
});

test('Macro methods object tests', (t) => {
  const myTestClass = newInstance();

  const defaultValues = { ...DEFAULT_VALUES };
  defaultValues._myProp11 = defaultValues.myProp11;
  delete defaultValues.myProp11;

  t.ok(myTestClass.get(), 'Get entire model');
  t.deepEqual(
    myTestClass.get(...Object.keys(defaultValues)),
    defaultValues,
    'Get defaults back test'
  );

  t.throws(
    () => {
      myTestClass.getMyProp1 = () => '42';
    },
    /TypeError/,
    'Object should be frozen'
  );

  t.ok(myTestClass.set({ changeWhenModified: 'foo' }));
  const off = myTestClass.onModified((publicAPI) => {
    publicAPI.set({ changeWhenModified: 'bar' });
  });
  t.ok(myTestClass.setMyProp3(false));
  t.deepEqual(
    myTestClass.get('changeWhenModified'),
    { changeWhenModified: 'bar' },
    'Object modified fires'
  );
  off.unsubscribe();
  myTestClass.set({ changeWhenModified: 'foobaz' });
  myTestClass.setMyProp3(true);
  t.deepEqual(
    myTestClass.get('changeWhenModified'),
    { changeWhenModified: 'foobaz' },
    'Object modified does not fire after unsubscribe'
  );

  t.ok(
    myTestClass.set({ myProp4: 99.9, myProp5: [1, 1, 1, 1] }),
    'Test mult-set'
  );
  t.equal(myTestClass.getMyProp4(), 99.9, 'Float get should match multi-set');
  t.deepEqual(
    myTestClass.getMyProp5(),
    [1, 1, 1, 1],
    'Array multi-set should match get'
  );

  t.ok(myTestClass.isA('vtkMyClass'));
  t.ok(myTestClass.isA('vtkObject'));
  t.notOk(myTestClass.isA('vtkPoint'));
  t.equal(myTestClass.getClassName(), 'vtkMyClass');

  t.doesNotThrow(() => myTestClass.delete());
  t.notOk(myTestClass.getMyProp4(), 'All calls should do nothing after delete');

  t.end();
});

test('Macro methods event tests', (t) => {
  const myTestClass = newInstance();

  //
  // Test event abortion
  //
  const { VOID, EVENT_ABORT } = macro;
  let callCount = 0;

  const cbAbort1 = () => {
    ++callCount;
    t.equal(callCount, 1, 'cbAbort1 should be called first');
  };

  const cbAbort2 = () => {
    ++callCount;
    t.equal(callCount, 2, 'cbAbort2 should be called second');

    // this is a demonstration of the VOID and EVENT_ABORT return symbols.
    if (callCount !== 2) {
      return VOID;
    }

    return EVENT_ABORT;
  };

  const cbAbort3 = () => {
    ++callCount;
    t.fail('cbAbort3 should not be called');
  };

  myTestClass.onTestAbort(cbAbort1);
  myTestClass.onTestAbort(cbAbort2);
  myTestClass.onTestAbort(cbAbort3);

  myTestClass.invokeTestAbort();
  t.equal(callCount, 2, 'Only 2 callbacks should be invoked, not 3');

  //
  // Test callback priority and subscription
  //
  const called = Array(3).fill(0);

  const cbPriorityLast = () => {
    t.ok(
      called[0] && called[1] && called[2],
      'cbPriorityLast should be called last after 101ms'
    );

    // ensure callback2 was only invoked twice
    t.equal(called[2], 2, 'cbPriority2 should be called exactly twice');

    t.end();
  };

  const cbPriority0 = () => {
    called[0]++;
    t.ok(called[1] && called[2], 'cbPriority0 should be called third');
  };

  const cbPriority1 = () => {
    called[1]++;
    t.ok(!called[0] && called[2], 'cbPriority1 should be called second');
  };

  const cbPriority2 = () => {
    called[2]++;
    t.ok(!called[0] && !called[1], 'cbPriority2 should be called first');
  };

  myTestClass.onTestPriority(cbPriorityLast, -100);
  myTestClass.onTestPriority(cbPriority0);
  myTestClass.onTestPriority(cbPriority1, 1.0);
  myTestClass.onTestPriority(cbPriority2, 2.0);
  // test duplicate listeners and unsubscribe
  const { unsubscribe } = myTestClass.onTestPriority(cbPriority2, 2.0);
  myTestClass.onTestPriority(cbPriority2, 2.0);

  // test unsubscribe for the secon cbPriority2 callback
  unsubscribe();

  myTestClass.invokeTestPriority();
});

test('Macro methods keystore tests', (t) => {
  const testClass = newInstance();

  testClass.setKey('key3', 'value3');

  t.equal(testClass.getKey('key1'), 'value1', 'key1 should exist in keystore');
  t.equal(testClass.getKey('key2'), 'value2', 'key2 should exist in keystore');
  t.equal(testClass.getKey('key3'), 'value3', 'key3 should exist in keystore');

  t.ok(testClass.deleteKey('key2'), 'Delete key2 should succeed');

  testClass.clearKeystore();

  t.equal(
    testClass.getAllKeys().length,
    0,
    'There should be no keys after clearing'
  );

  t.end();
});

test('Macro debounce can be cancelled', (t) => {
  const func = () => {
    t.fail('Should not call cancelled debounce function');
  };

  const debFunc = macro.debounce(func, 5);
  debFunc();
  debFunc.cancel();

  // end the test after the debounce phase
  setTimeout(() => t.end(), 10);
});
