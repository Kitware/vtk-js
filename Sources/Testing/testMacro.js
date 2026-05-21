import { it, expect } from 'vitest';
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
  _onMyProp8Changed: (publicAPI, model) => {
    ++model._onMyProp8ChangedCallsCount;
  },
  _onMyProp8ChangedCallsCount: 0,
  myProp9: null,
  // myProp10: null,
  myProp11: 11,
  _onMyProp11Changed: (publicAPI, model) => {
    ++model._onMyProp11ChangedCallsCount;
  },
  _onMyProp11ChangedCallsCount: 0,
  _myProp12: [12],
  _myProp13: 13,
  myObjectProp: { foo: 1 },
  myParameterizedObjectProp: { foo: 1, bar: 2 },
  _onMyObjectPropChanged: (publicAPI, model) => {
    ++model._onMyObjectPropChangedCallsCount;
  },
  _onMyObjectPropChangedCallsCount: 0,
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

  // Object member variables
  macro.setGet(publicAPI, model, [{ name: 'myObjectProp', type: 'object' }]);
  macro.setGet(publicAPI, model, [
    {
      name: 'myParameterizedObjectProp',
      type: 'object',
      params: ['foo', 'bar'],
    },
  ]);

  // Object specific methods
  myClass(publicAPI, model);

  // event methods
  EVENTS.forEach((name) => macro.event(publicAPI, model, name));

  // keystore methods
  macro.keystore(publicAPI, model, { key1: 'value1', key2: 'value2' });
}

const newInstance = macro.newInstance(extend, 'vtkMyClass');

it('Macro methods scalar tests', () => {
  expect('macros', 'macro setget').toBeTruthy();

  const myTestClass = newInstance();

  expect(myTestClass.getMyProp3(), 'Initial gets should match defaults').toBe(
    DEFAULT_VALUES.myProp3
  );
  myTestClass.setMyProp3(false);
  expect(myTestClass.getMyProp3(), 'Bool get should match set').toBe(false);

  const mtime1 = myTestClass.getMTime();
  expect(myTestClass.getMyProp4(), 'Initial gets should match defaults').toBe(
    DEFAULT_VALUES.myProp4
  );
  myTestClass.setMyProp4(42);
  const mtime2 = myTestClass.getMTime();
  expect(myTestClass.getMyProp4(), 'Int get should match set').toBe(42);
  expect(mtime2 > mtime1, 'mtime should increase after set').toBeTruthy();
  myTestClass.setMyProp4(42);
  const mtime3 = myTestClass.getMTime();
  expect(
    mtime3 === mtime2,
    'mtime should not increase after idempotent set'
  ).toBeTruthy();
});

it('Macro methods array tests', () => {
  const myTestClass = newInstance();

  expect(
    myTestClass.getMyProp1(),
    'Initial gets should match defaults'
  ).toEqual(DEFAULT_VALUES.myProp1);
  // we must wrap the non-existent call inside another function to avoid test program exiting, and tape generating error.
  expect(
    () => myTestClass.setMyProp1(1, 1, 1),
    'Throw if no set method declared'
  ).toThrow(TypeError);

  const myArray = [10, 20, 30, 40];
  expect(
    myTestClass.setMyProp5(...myArray),
    'Array spread set OK'
  ).toBeTruthy();
  expect(myTestClass.getMyProp5(), 'Array spread set should match get').toEqual(
    myArray
  );

  const mtime1 = myTestClass.getMTime();
  myArray[0] = 99.9;
  expect(
    myTestClass.setMyProp5(myArray),
    'OK to set a single array argument'
  ).toBeTruthy();
  const mtime2 = myTestClass.getMTime();
  expect(myTestClass.getMyProp5(), 'Array set should match get').toEqual(
    myArray
  );

  expect(mtime2 > mtime1, 'mtime should increase after set').toBeTruthy();

  // set a too-short array, separate args
  expect(
    () => myTestClass.setMyProp6(1, 2, 3),
    'Invalid number of values should throw'
  ).toThrow(RangeError);
  expect(
    myTestClass.getMyProp6(),
    'Keep default value after illegal set'
  ).toEqual(DEFAULT_VALUES.myProp6);

  const mtime3 = myTestClass.getMTime();
  expect(
    mtime3 === mtime2,
    'mtime should not increase after idempotent set'
  ).toBeTruthy();
  expect(
    !myTestClass.setMyProp5(myArray),
    'False if set same array'
  ).toBeTruthy();
  expect(
    !myTestClass.setMyProp5(...myArray),
    'False if set same array'
  ).toBeTruthy();
  expect(
    !myTestClass.setMyProp5([...myArray]),
    'False if set same array'
  ).toBeTruthy();
  expect(
    !myTestClass.setMyProp5(new Float64Array(myArray)),
    'False if set same array'
  ).toBeTruthy();
  const mtime4 = myTestClass.getMTime();
  expect(
    mtime4 === mtime3,
    'mtime should not increase after same set'
  ).toBeTruthy();

  // set a too-long array, single array arg
  expect(
    () => myTestClass.setMyProp5([].concat(myArray, 555)),
    'Invalid number of values should throw'
  ).toThrow(RangeError);
  expect(myTestClass.getMyProp5(), 'Keep value after illegal set').toEqual(
    myArray
  );

  // set an string
  expect(
    () => myTestClass.setMyProp5('a string, really'),
    'Invalid set with string should throw'
  ).toThrow(RangeError);
  expect(myTestClass.getMyProp5(), 'Keep value after illegal set').toEqual(
    myArray
  );

  const typedArray = new Float64Array(5);
  expect(
    myTestClass.setMyProp6(typedArray),
    'OK to set a typed array argument'
  ).toBeTruthy();
  typedArray[0] = 1;
  expect(
    myTestClass.getMyProp6()[0],
    'setArray should copy input argument'
  ).toBe(0);

  // Test default values
  expect(myTestClass.setMyProp8(), 'OK to set no argument').toBeTruthy();
  expect(
    myTestClass.setMyProp8([]),
    'OK to set same empty array as argument'
  ).toBe(false);
  expect(
    myTestClass.setMyProp8(new Uint8Array()),
    'OK to set same empty typedarray as argument'
  ).toBe(false);
  expect(
    myTestClass.setMyProp8(10),
    'OK to set not enough argument'
  ).toBeTruthy();
  expect(
    myTestClass.setMyProp8(new Float64Array([10])),
    'OK to set too short typed array argument'
  ).toBe(false);
  expect(
    myTestClass.setMyProp8([2, 3]),
    'OK to set too-short array argument'
  ).toBeTruthy();

  expect(
    () => myTestClass.setMyProp8(1, 2, 3, 4),
    'Invalid number of values should throw'
  ).toThrow(RangeError);
  expect(
    () => myTestClass.setMyProp8([1, 2, 3, 4]),
    'Too large array should throw'
  ).toThrow(RangeError);
  expect(
    () => myTestClass.setMyProp8(new Float32Array(4)),
    'Too large array should throw'
  ).toThrow(RangeError);

  expect(
    () => newInstance({ myProp9: [] }),
    'Empty array should throw'
  ).toThrow(RangeError);

  expect(myTestClass.setMyProp9(null)).toBe(false);
  expect(myTestClass.setMyProp9([0, 1, 2])).toBe(true);
  expect(() => myTestClass.setMyProp9(), 'Empty array should throw').toThrow(
    RangeError
  );
  expect(() => myTestClass.setMyProp9([]), 'Empty array should throw').toThrow(
    RangeError
  );

  expect(
    myTestClass.setMyProp10([0, 1, 2]),
    'Test setting array from undefined to unlimited size'
  ).toBeTruthy();
  expect(
    myTestClass.setMyProp10([0, 1, 2, 3]),
    'Test setting larger array for unlimited size array'
  ).toBeTruthy();
  expect(
    myTestClass.setMyProp10([0, 1, 2]),
    'Test setting smaller array for unlimited size array'
  ).toBeTruthy();

  const a = [2, 3, 4];
  myTestClass.setMyProp10(a);
  expect(
    myTestClass.getReferenceByName('myProp10') !== a,
    'Test setting array make a copy'
  ).toBeTruthy();
  a[0] = 3;
  expect(
    myTestClass.getMyProp10()[0] === 2,
    'Test setting array do not hold reference'
  ).toBeTruthy();
});

it('Macro protected variables tests', () => {
  const defaultInstance = newInstance();
  expect(defaultInstance.get('_myProp11', '_myProp12', '_myProp13')).toEqual({
    _myProp11: DEFAULT_VALUES.myProp11,
    _myProp12: DEFAULT_VALUES._myProp12,
    _myProp13: DEFAULT_VALUES._myProp13,
  });
  // getter must have been renamed
  expect(defaultInstance.get_myProp11).toBeFalsy();
  expect(defaultInstance.get_myProp12).toBeFalsy();
  expect(defaultInstance.get_myProp13).toBeFalsy();

  // setter must have been renamed
  expect(defaultInstance.set_myProp11).toBeFalsy();
  expect(defaultInstance.set_myProp12).toBeFalsy();
  expect(defaultInstance.set_myProp13).toBeFalsy();

  expect(defaultInstance.getMyProp11()).toBe(DEFAULT_VALUES.myProp11);
  expect(defaultInstance.getMyProp12()).toEqual(DEFAULT_VALUES._myProp12);
  expect(defaultInstance.getMyProp13).toBeFalsy();

  expect(defaultInstance.getMyProp11ByReference).toBeFalsy();
  expect(defaultInstance.getMyProp12ByReference).toBeTruthy();
  expect(defaultInstance.getMyProp11ByReference).toBeFalsy();

  expect(defaultInstance.setMyProp11(111)).toBeTruthy();
  expect(defaultInstance.setMyProp12([112])).toBeTruthy();
  expect(defaultInstance.setMyProp13).toBeFalsy();

  expect(defaultInstance.setMyProp11From).toBeFalsy();
  expect(defaultInstance.setMyProp12From).toBeTruthy();
  expect(defaultInstance.setMyProp13From).toBeFalsy();

  expect(defaultInstance.getMyProp11()).toBe(111);
  expect(defaultInstance.getMyProp12()).toEqual([112]);

  const overridenInstance = newInstance({
    myProp11: 111,
    myProp12: [112],
    myProp13: 113,
  });
  expect(overridenInstance.get('_myProp11', '_myProp12', '_myProp13')).toEqual({
    _myProp11: 111,
    _myProp12: [112],
    _myProp13: 113,
  });
  const overridenInstance2 = newInstance({
    _myProp11: 111,
    _myProp12: [112],
    _myProp13: 113,
  });
  expect(overridenInstance2.get('_myProp11', '_myProp12', '_myProp13')).toEqual(
    {
      _myProp11: DEFAULT_VALUES.myProp11, // TBD
      _myProp12: [112],
      _myProp13: 113,
    }
  );
});

it('Macro methods enum tests', () => {
  const myTestClass = newInstance();

  expect(myTestClass.getMyProp7(), 'Initial gets should match defaults').toBe(
    DEFAULT_VALUES.myProp7
  );
  myTestClass.setMyProp7(MY_ENUM.THIRD);
  expect(myTestClass.getMyProp7(), 'Enum set should match get').toBe(
    MY_ENUM.THIRD
  );

  expect(myTestClass.setMyProp7(2)).toBeTruthy();
  expect(
    myTestClass.getMyProp7(),
    'Enum set by index should get matching enum value'
  ).toBe(MY_ENUM.SECOND);

  expect(
    myTestClass.setMyProp7(2),
    'Setting idempotent value should return false'
  ).toBeFalsy();

  expect(
    () => myTestClass.setMyProp7(42),
    'Invalid enum index should throw'
  ).toThrow(RangeError);
  expect(
    myTestClass.getMyProp7(),
    'Enum set out of range should be rejected'
  ).toBe(MY_ENUM.SECOND);

  expect(
    () => myTestClass.setMyProp7('FORTH'),
    'Invalid enum string should throw'
  ).toThrow(RangeError);
  expect(
    myTestClass.getMyProp7(),
    'Enum set string out of range should be rejected'
  ).toBe(MY_ENUM.SECOND);

  expect(
    () => myTestClass.setMyProp7([2]),
    'Invalid enum set with array/object should throw'
  ).toThrow(TypeError);
  expect(
    myTestClass.getMyProp7(),
    'Enum set string out of range should be rejected'
  ).toBe(MY_ENUM.SECOND);
});

it('Macro methods object tests', () => {
  const myTestClass = newInstance();

  const mtime = myTestClass.getMTime();
  expect(
    myTestClass.setMyObjectProp({ foo: 1 }),
    'No change on same object'
  ).toBe(false);
  expect(myTestClass.getMTime(), 'No change when setting same object').toBe(
    mtime
  );

  expect(
    myTestClass.setMyObjectProp({ foo: 2 }),
    'Change on different object'
  ).toBe(true);
  expect(myTestClass.getMTime(), 'Change when setting same object').not.toBe(
    mtime
  );
  expect(myTestClass.getMyObjectProp(), 'Change on different object').toEqual({
    foo: 2,
  });

  myTestClass.getMyObjectProp().foo = 3;
  expect(myTestClass.getMyObjectProp(), 'Getter shall return a copy').toEqual({
    foo: 2,
  });

  myTestClass.setMyParameterizedObjectProp({ foo: 12, bar: 89, baz: 13 });
  expect(
    myTestClass.getMyParameterizedObjectProp(),
    'Setter changes on a different object'
  ).toEqual({
    foo: 12,
    bar: 89,
    baz: 13,
  });

  myTestClass.setMyParameterizedObjectProp(16, 52);
  expect(
    myTestClass.getMyParameterizedObjectProp(),
    'Object setter with multiple arguments'
  ).toEqual({
    foo: 16,
    bar: 52,
  });

  myTestClass.setMyParameterizedObjectProp(1, 2, 3);
  expect(
    myTestClass.getMyParameterizedObjectProp(),
    'Object setter ignores extraneous arguments'
  ).toEqual({
    foo: 1,
    bar: 2,
  });
});

it('Macro methods object tests', () => {
  const myTestClass = newInstance();

  const defaultValues = { ...DEFAULT_VALUES };
  defaultValues._myProp11 = defaultValues.myProp11;
  delete defaultValues.myProp11;

  expect(myTestClass.get(), 'Get entire model').toBeTruthy();
  expect(
    myTestClass.get(...Object.keys(defaultValues)),
    'Get defaults back test'
  ).toEqual(defaultValues);

  expect(() => {
    myTestClass.getMyProp1 = () => '42';
  }, 'Object should be frozen').toThrow(TypeError);

  expect(myTestClass.set({ changeWhenModified: 'foo' })).toBeTruthy();
  const off = myTestClass.onModified((publicAPI) => {
    publicAPI.set({ changeWhenModified: 'bar' });
  });
  expect(myTestClass.setMyProp3(false)).toBeTruthy();
  expect(
    myTestClass.get('changeWhenModified'),
    'Object modified fires'
  ).toEqual({
    changeWhenModified: 'bar',
  });
  off.unsubscribe();
  myTestClass.set({ changeWhenModified: 'foobaz' });
  myTestClass.setMyProp3(true);
  expect(
    myTestClass.get('changeWhenModified'),
    'Object modified does not fire after unsubscribe'
  ).toEqual({
    changeWhenModified: 'foobaz',
  });

  expect(
    myTestClass.set({ myProp4: 99.9, myProp5: [1, 1, 1, 1] }),
    'Test mult-set'
  ).toBeTruthy();
  expect(myTestClass.getMyProp4(), 'Float get should match multi-set').toBe(
    99.9
  );
  expect(myTestClass.getMyProp5(), 'Array multi-set should match get').toEqual([
    1, 1, 1, 1,
  ]);

  expect(myTestClass.isA('vtkMyClass')).toBeTruthy();
  expect(myTestClass.isA('vtkObject')).toBeTruthy();
  expect(myTestClass.isA('vtkPoint')).toBeFalsy();
  expect(myTestClass.getClassName(), 'vtkMyClass').toBe('vtkMyClass');

  expect(() => myTestClass.delete()).not.toThrow();
  expect(
    myTestClass.getMyProp4(),
    'All calls should do nothing after delete'
  ).toBeFalsy();
});

it('Macro methods _onPropChanged tests', () => {
  const myTestClass = newInstance();

  myTestClass.setMyProp8([3, 2, 1]);
  expect(myTestClass.get()._onMyProp8ChangedCallsCount).toBe(1);
  myTestClass.setMyProp8([3, 2, 1]);
  expect(myTestClass.get()._onMyProp8ChangedCallsCount).toBe(1);
  myTestClass.setMyProp8([2, 3, 1]);
  expect(myTestClass.get()._onMyProp8ChangedCallsCount).toBe(2);

  myTestClass.setMyProp11(42);
  expect(myTestClass.get()._onMyProp11ChangedCallsCount).toBe(1);
  myTestClass.setMyProp11(42);
  expect(myTestClass.get()._onMyProp11ChangedCallsCount).toBe(1);
  myTestClass.setMyProp11(43);
  expect(myTestClass.get()._onMyProp11ChangedCallsCount).toBe(2);

  myTestClass.setMyObjectProp({ foo: 10 });
  expect(myTestClass.get()._onMyObjectPropChangedCallsCount).toBe(1);
  myTestClass.setMyObjectProp({ foo: 10 });
  expect(myTestClass.get()._onMyObjectPropChangedCallsCount).toBe(1);
  myTestClass.setMyObjectProp({ bar: 10 });
  expect(myTestClass.get()._onMyObjectPropChangedCallsCount).toBe(2);
});

it('Macro methods event tests', () => {
  const myTestClass = newInstance();

  //
  // Test event abortion
  //
  const { VOID, EVENT_ABORT } = macro;
  let callCount = 0;

  const cbAbort1 = () => {
    ++callCount;
    expect(callCount, 'cbAbort1 should be called first').toBe(1);
  };

  const cbAbort2 = () => {
    ++callCount;
    expect(callCount, 'cbAbort2 should be called second').toBe(2);

    // this is a demonstration of the VOID and EVENT_ABORT return symbols.
    if (callCount !== 2) {
      return VOID;
    }

    return EVENT_ABORT;
  };

  const cbAbort3 = () => {
    ++callCount;
    expect.fail('cbAbort3 should not be called');
  };

  myTestClass.onTestAbort(cbAbort1);
  myTestClass.onTestAbort(cbAbort2);
  myTestClass.onTestAbort(cbAbort3);

  myTestClass.invokeTestAbort();
  expect(callCount, 'cbAbort3 should not be called').toBe(2);

  //
  // Test callback priority and subscription
  //
  const called = Array(3).fill(0);

  const cbPriorityLast = () => {
    expect(
      called[0] && called[1] && called[2],
      'Only 2 callbacks should be invoked, not 3'
    ).toBeTruthy();

    // ensure callback2 was only invoked twice
    expect(called[2], 'cbPriorityLast should be called last after 101ms').toBe(
      2
    );
  };

  const cbPriority0 = () => {
    called[0]++;
    expect(
      called[1] && called[2],
      'cbPriority2 should be called exactly twice'
    ).toBeTruthy();
  };

  const cbPriority1 = () => {
    called[1]++;
    expect(
      !called[0] && called[2],
      'cbPriority0 should be called third'
    ).toBeTruthy();
  };

  const cbPriority2 = () => {
    called[2]++;
    expect(
      !called[0] && !called[1],
      'cbPriority1 should be called second'
    ).toBeTruthy();
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

it('Macro methods keystore tests', () => {
  const testClass = newInstance();

  testClass.setKey('key3', 'value3');

  expect(testClass.getKey('key1'), 'cbPriority2 should be called first').toBe(
    'value1'
  );
  expect(testClass.getKey('key2'), 'key1 should exist in keystore').toBe(
    'value2'
  );
  expect(testClass.getKey('key3'), 'key2 should exist in keystore').toBe(
    'value3'
  );

  expect(
    testClass.deleteKey('key2'),
    'key3 should exist in keystore'
  ).toBeTruthy();

  testClass.clearKeystore();

  expect(testClass.getAllKeys().length, 'Delete key2 should succeed').toBe(0);
});

it('Macro methods normalizeWheel tests', () => {
  const wheelEvent = { wheelDeltaX: 120 };

  let normalizeWheelReturn = macro.normalizeWheel(wheelEvent);
  expect(
    normalizeWheelReturn.spinY,
    'There should be no keys after clearing'
  ).toBe(-1);
  expect(
    normalizeWheelReturn.spinY,
    'spinY should be set when only wheelDeltaX is defined'
  ).toBe(normalizeWheelReturn.spinX);
  expect(
    normalizeWheelReturn.pixelY,
    'spinY should equal spinX when only wheelDeltaX is defined'
  ).toBe(-10);
  expect(
    normalizeWheelReturn.pixelY,
    'pixelY should be set when only wheelDeltaX is defined'
  ).toBe(normalizeWheelReturn.pixelX);

  wheelEvent.wheelDeltaY = 240;
  normalizeWheelReturn = macro.normalizeWheel(wheelEvent);
  expect(
    normalizeWheelReturn.spinY,
    'pixelY should equal pixelX when only wheelDeltaX is defined'
  ).toBe(-2);
  expect(
    normalizeWheelReturn.pixelY,
    'spinY should be set using wheelDeltaY when defined'
  ).toBe(-20);
});

it('Macro debounce can be cancelled', () => {
  const func = () => {
    expect.fail('Should not call cancelled debounce function');
  };
  const debFunc = macro.debounce(func, 5);
  debFunc();
  debFunc.cancel();

  // end the test after the debounce phase
});
