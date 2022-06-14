/**
 * macros.js is the old macro.js.
 * The name change is so we do not get eaten by babel-plugin-macros.
 */
import vtk, { vtkGlobal } from './vtk';
import ClassHierarchy from './Common/Core/ClassHierarchy';
import { vtkAlgorithm, vtkObject, vtkSubscription } from './interfaces';
import { Nullable, vtkPipelineConnection } from './types';

let globalMTime = 0;

export const VOID = Symbol('void');

function getCurrentGlobalMTime() {
  return globalMTime;
}

// ----------------------------------------------------------------------------
// Logging function calls
// ----------------------------------------------------------------------------
/* eslint-disable no-prototype-builtins                                      */

const fakeConsole = {} as Record<string, Function>;

function noOp() {}

const consoleMethods = [
  'log',
  'debug',
  'info',
  'warn',
  'error',
  'time',
  'timeEnd',
  'group',
  'groupEnd',
];
consoleMethods.forEach((methodName) => {
  fakeConsole[methodName] = noOp;
});

vtkGlobal.console = console.hasOwnProperty('log') ? console : fakeConsole;

const loggerFunctions = {
  debug: noOp, // Don't print debug by default
  error: vtkGlobal.console.error || noOp,
  info: vtkGlobal.console.info || noOp,
  log: vtkGlobal.console.log || noOp,
  warn: vtkGlobal.console.warn || noOp,
} as Record<string, Function>;

export function setLoggerFunction(name: string, fn: Function) {
  if (loggerFunctions[name]) {
    loggerFunctions[name] = fn || noOp;
  }
}

export function vtkLogMacro(...args: any[]) {
  loggerFunctions.log(...args);
}

export function vtkInfoMacro(...args: any[]) {
  loggerFunctions.info(...args);
}

export function vtkDebugMacro(...args: any[]) {
  loggerFunctions.debug(...args);
}

export function vtkErrorMacro(...args: any[]) {
  loggerFunctions.error(...args);
}

export function vtkWarningMacro(...args: any[]) {
  loggerFunctions.warn(...args);
}

const ERROR_ONCE_MAP = {} as Record<string, boolean>;

export function vtkOnceErrorMacro(str: string) {
  if (!ERROR_ONCE_MAP[str]) {
    loggerFunctions.error(str);
    ERROR_ONCE_MAP[str] = true;
  }
}

// ----------------------------------------------------------------------------
// TypedArray
// ----------------------------------------------------------------------------

export const TYPED_ARRAYS = Object.create(null);
TYPED_ARRAYS.Float32Array = Float32Array;
TYPED_ARRAYS.Float64Array = Float64Array;
TYPED_ARRAYS.Uint8Array = Uint8Array;
TYPED_ARRAYS.Int8Array = Int8Array;
TYPED_ARRAYS.Uint16Array = Uint16Array;
TYPED_ARRAYS.Int16Array = Int16Array;
TYPED_ARRAYS.Uint32Array = Uint32Array;
TYPED_ARRAYS.Int32Array = Int32Array;
TYPED_ARRAYS.Uint8ClampedArray = Uint8ClampedArray;
// TYPED_ARRAYS.BigInt64Array = BigInt64Array;
// TYPED_ARRAYS.BigUint64Array = BigUint64Array;

export function newTypedArray(type: string, ...args: any[]) {
  return new (TYPED_ARRAYS[type] || Float64Array)(...args);
}

export function newTypedArrayFrom(type: string, ...args: any[]) {
  return (TYPED_ARRAYS[type] || Float64Array).from(...args);
}

// ----------------------------------------------------------------------------
// capitilize provided string
// ----------------------------------------------------------------------------

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function _capitalize(str: string) {
  return capitalize(str[0] === '_' ? str.slice(1) : str);
}

export function uncapitalize(str: string) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

// ----------------------------------------------------------------------------
// Convert byte size into a well formatted string
// ----------------------------------------------------------------------------

export function formatBytesToProperUnit(
  size: number,
  precision = 2,
  chunkSize = 1000
) {
  const units = ['TB', 'GB', 'MB', 'KB'];
  let value = Number(size);
  let currentUnit = 'B';
  while (value > chunkSize && units.length) {
    value /= chunkSize;
    currentUnit = units.pop()!;
  }
  return `${value.toFixed(precision)} ${currentUnit}`;
}

// ----------------------------------------------------------------------------
// Convert thousand number with proper separator
// ----------------------------------------------------------------------------

export function formatNumbersWithThousandSeparator(n: number, separator = ' ') {
  const sections = [];
  let size = n;
  while (size > 1000) {
    sections.push(`000${size % 1000}`.slice(-3));
    size = Math.floor(size / 1000);
  }
  if (size > 0) {
    sections.push(size);
  }
  sections.reverse();
  return sections.join(separator);
}

// ----------------------------------------------------------------------------
// Array helper
// ----------------------------------------------------------------------------

function safeArrays(model: ObjModel) {
  Object.keys(model).forEach((key) => {
    const arr = model[key] as unknown[] | unknown;
    if (Array.isArray(arr)) {
      model[key] = [...arr];
    }
  });
}

// ----------------------------------------------------------------------------
// shallow equals
// ----------------------------------------------------------------------------

function shallowEquals(a: Nullable<object>, b: Nullable<object>) {
  if (a === b) {
    return true;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }

  return false;
}

// ----------------------------------------------------------------------------

function enumToString(e: Record<string, unknown>, value: unknown) {
  return Object.keys(e).find((key) => e[key] === value);
}

function getStateArrayMapFunc(item: unknown) {
  if (isVtkObject(item)) {
    return item.getState();
  }
  return item;
}

// ----------------------------------------------------------------------------
// setImmediate
// ----------------------------------------------------------------------------

export function setImmediateVTK(fn: Function) {
  setTimeout(fn, 0);
}

// ----------------------------------------------------------------------------
// measurePromiseExecution
//
// Measures the time it takes for a promise to finish from
//   the time this function is invoked.
// The callback receives the time it took for the promise to resolve or reject.
// ----------------------------------------------------------------------------

export function measurePromiseExecution(
  promise: Promise<unknown>,
  callback: Function
) {
  const start = performance.now();
  promise.finally(() => {
    const delta = performance.now() - start;
    callback(delta);
  });
}

// ----------------------------------------------------------------------------
// vtkObject: modified(), onModified(callback), delete()
// ----------------------------------------------------------------------------

// TODO move to types.d.ts?
export type IndexableAPI<T> = T & Record<string, Function>;
export type IndexableModel<T> = T & Record<string, unknown>;

export interface ObjModel extends Record<string, unknown> {
  mtime: number;
  classHierarchy: Array<string>;
  deleted?: boolean;
}

interface ObjPublicAPI extends vtkObject, Record<string, Function> {}

export function obj(
  publicAPI: ObjPublicAPI = {} as ObjPublicAPI,
  model: ObjModel = {} as ObjModel
) {
  // Ensure each instance as a unique ref of array
  safeArrays(model);

  const callbacks: Array<Function | null> = [];

  if (!Number.isInteger(model.mtime)) {
    model.mtime = ++globalMTime;
  }

  if (!('classHierarchy' in model)) {
    model.classHierarchy = new ClassHierarchy();
    model.classHierarchy.push('vtkObject');
  } else if (!(model.classHierarchy instanceof ClassHierarchy)) {
    model.classHierarchy = ClassHierarchy.from(
      model.classHierarchy as string[]
    );
  }

  function off(index: number) {
    callbacks[index] = null;
  }

  function on(index: number) {
    function unsubscribe() {
      off(index);
    }

    return Object.freeze({
      unsubscribe,
    });
  }

  publicAPI.isDeleted = () => !!model.deleted;

  publicAPI.modified = (otherMTime?: number) => {
    if (model.deleted) {
      vtkErrorMacro('instance deleted - cannot call any method');
      return;
    }

    if (otherMTime && otherMTime < publicAPI.getMTime()) {
      return;
    }

    model.mtime = ++globalMTime;
    callbacks.forEach((callback) => callback && callback(publicAPI));
  };

  publicAPI.onModified = (callback: (instance: vtkObject) => void) => {
    if (model.deleted) {
      vtkErrorMacro('instance deleted - cannot call any method');
      return null;
    }

    const index = callbacks.length;
    callbacks.push(callback);
    return on(index);
  };

  publicAPI.getMTime = () => model.mtime;

  publicAPI.isA = (className: string) => {
    let count = model.classHierarchy.length;
    // we go backwards as that is more likely for
    // early termination
    while (count--) {
      if (model.classHierarchy[count] === className) {
        return true;
      }
    }
    return false;
  };

  publicAPI.getClassName = (depth = 0) =>
    model.classHierarchy[model.classHierarchy.length - 1 - depth];

  publicAPI.set = (
    map: Record<string, any> = {},
    noWarning = false,
    noFunction = false
  ) => {
    let ret = false;
    Object.keys(map).forEach((name) => {
      const fn = noFunction ? null : publicAPI[`set${capitalize(name)}`];
      if (fn && Array.isArray(map[name]) && fn.length > 1) {
        ret = fn(...map[name]) || ret;
      } else if (fn) {
        ret = fn(map[name]) || ret;
      } else {
        // Set data on model directly
        if (['mtime'].indexOf(name) === -1 && !noWarning) {
          vtkWarningMacro(
            `Warning: Set value to model directly ${name}, ${map[name]}`
          );
        }
        ret = model[name] !== map[name] || ret;
        model[name] = map[name];
      }
    });
    return ret;
  };

  publicAPI.get = (...list: string[]) => {
    if (!list.length) {
      return model;
    }
    const subset: Record<string, unknown> = {};
    list.forEach((name) => {
      subset[name] = model[name];
    });
    return subset;
  };

  publicAPI.getReferenceByName = (val: string) => model[val];

  publicAPI.delete = () => {
    Object.keys(model).forEach((field) => delete model[field]);
    callbacks.forEach((el, index) => off(index));

    // Flag the instance being deleted
    model.deleted = true;
  };

  // Add serialization support
  publicAPI.getState = () => {
    if (model.deleted) {
      return null;
    }
    const jsonArchive: Record<string, any> = {
      ...model,
      vtkClass: publicAPI.getClassName(),
    };

    // Convert every vtkObject to its serializable form
    Object.keys(jsonArchive).forEach((keyName) => {
      if (
        jsonArchive[keyName] === null ||
        jsonArchive[keyName] === undefined ||
        keyName[0] === '_' // protected members start with _
      ) {
        delete jsonArchive[keyName];
      } else if (jsonArchive[keyName].isA) {
        jsonArchive[keyName] = jsonArchive[keyName].getState();
      } else if (Array.isArray(jsonArchive[keyName])) {
        jsonArchive[keyName] = jsonArchive[keyName].map(getStateArrayMapFunc);
      }
    });

    // Sort resulting object by key name
    const sortedObj: Record<string, any> = {};
    Object.keys(jsonArchive)
      .sort()
      .forEach((name) => {
        sortedObj[name] = jsonArchive[name];
      });

    // Remove mtime
    if (sortedObj.mtime) {
      delete sortedObj.mtime;
    }

    return sortedObj;
  };

  // Add shallowCopy(otherInstance) support
  publicAPI.shallowCopy = (other: vtkObject, debug = false) => {
    if (other.getClassName() !== publicAPI.getClassName()) {
      throw new Error(
        `Cannot ShallowCopy ${other.getClassName()} into ${publicAPI.getClassName()}`
      );
    }
    const otherModel = other.get() as ObjModel;

    const keyList = Object.keys(model).sort();
    const otherKeyList = Object.keys(otherModel).sort();

    otherKeyList.forEach((key) => {
      const keyIdx = keyList.indexOf(key);
      if (keyIdx === -1) {
        if (debug) {
          vtkDebugMacro(`add ${key} in shallowCopy`);
        }
      } else {
        keyList.splice(keyIdx, 1);
      }
      model[key] = otherModel[key];
    });
    if (keyList.length && debug) {
      vtkDebugMacro(`Untouched keys: ${keyList.join(', ')}`);
    }

    publicAPI.modified();
  };

  // This function will get called when one invoke JSON.stringify(vtkObject)
  // JSON.stringify will only stringify the return value of this function
  publicAPI.toJSON = function vtkObjToJSON() {
    return publicAPI.getState();
  };

  // Allow usage as decorator
  return publicAPI;
}

// ----------------------------------------------------------------------------
// getXXX: add getters
// ----------------------------------------------------------------------------

export function get(
  publicAPI: Record<string, Function>,
  model: Record<string, unknown>,
  fieldNames: SetterFields
) {
  fieldNames.forEach((field) => {
    if (typeof field === 'object') {
      publicAPI[`get${_capitalize(field.name)}`] = () => model[field.name];
    } else {
      publicAPI[`get${_capitalize(field)}`] = () => model[field];
    }
  });
}

// ----------------------------------------------------------------------------
// setXXX: add setters
// ----------------------------------------------------------------------------

type EnumFieldSpec = {
  type: 'enum';
  name: string;
  enum: Record<string, any>;
};
type SetterFieldSpec = EnumFieldSpec;

const objectSetterMap = {
  enum(publicAPI: ObjPublicAPI, model: ObjModel, field: SetterFieldSpec) {
    return (value: string | number) => {
      if (typeof value === 'string') {
        if (field.enum[value] !== undefined) {
          if (model[field.name] !== field.enum[value]) {
            model[field.name] = field.enum[value];
            publicAPI.modified();
            return true;
          }
          return false;
        }
        vtkErrorMacro(`Set Enum with invalid argument ${field}, ${value}`);
        throw new RangeError('Set Enum with invalid string argument');
      }
      if (typeof value === 'number') {
        if (model[field.name] !== value) {
          if (
            Object.keys(field.enum)
              .map((key) => field.enum[key])
              .indexOf(value) !== -1
          ) {
            model[field.name] = value;
            publicAPI.modified();
            return true;
          }
          vtkErrorMacro(`Set Enum outside numeric range ${field}, ${value}`);
          throw new RangeError('Set Enum outside numeric range');
        }
        return false;
      }
      vtkErrorMacro(
        `Set Enum with invalid argument (String/Number) ${field}, ${value}`
      );
      throw new TypeError('Set Enum with invalid argument (String/Number)');
    };
  },
};

function findSetter(field: string | SetterFieldSpec) {
  if (typeof field === 'object') {
    if (field.type in objectSetterMap) {
      const fn = objectSetterMap[field.type as keyof typeof objectSetterMap];
      return <P extends ObjPublicAPI, M extends ObjModel>(
        publicAPI: P,
        model: M
      ) => fn(publicAPI, model, field);
    }

    vtkErrorMacro(`No setter for field ${field}`);
    throw new TypeError('No setter for field');
  }
  return function getSetter(publicAPI: ObjPublicAPI, model: ObjModel) {
    return function setter(value: unknown) {
      if (model.deleted) {
        vtkErrorMacro('instance deleted - cannot call any method');
        return false;
      }

      if (model[field] !== value) {
        model[field] = value;
        publicAPI.modified();
        return true;
      }
      return false;
    };
  };
}

type SetterFields = (string | SetterFieldSpec)[];
export function set(
  publicAPI: ObjPublicAPI,
  model: ObjModel,
  fields: SetterFields
) {
  fields.forEach((field) => {
    if (typeof field === 'object') {
      publicAPI[`set${_capitalize(field.name)}`] = findSetter(field)(
        publicAPI,
        model
      );
    } else {
      publicAPI[`set${_capitalize(field)}`] = findSetter(field)(
        publicAPI,
        model
      );
    }
  });
}

// ----------------------------------------------------------------------------
// set/get XXX: add both setters and getters
// ----------------------------------------------------------------------------

export function setGet(
  publicAPI: ObjPublicAPI,
  model: ObjModel,
  fieldNames: SetterFields
) {
  get(publicAPI, model, fieldNames);
  set(publicAPI, model, fieldNames);
}

// ----------------------------------------------------------------------------
// getXXX: add getters for object of type array with copy to be safe
// getXXXByReference: add getters for object of type array without copy
// ----------------------------------------------------------------------------

export function getArray(
  publicAPI: ObjPublicAPI,
  model: ObjModel,
  fieldNames: string[]
) {
  fieldNames.forEach((field) => {
    publicAPI[`get${_capitalize(field)}`] = () =>
      model[field] ? (<unknown[]>[]).concat(model[field]) : model[field];
    publicAPI[`get${_capitalize(field)}ByReference`] = () => model[field];
  });
}

// ----------------------------------------------------------------------------
// setXXX: add setter for object of type array
// if 'defaultVal' is supplied, shorter arrays will be padded to 'size' with 'defaultVal'
// set...From: fast path to copy the content of an array to the current one without call to modified.
// ----------------------------------------------------------------------------

export function setArray(
  publicAPI: ObjPublicAPI,
  model: ObjModel,
  fieldNames: string[],
  size: number,
  defaultVal = undefined
) {
  fieldNames.forEach((field) => {
    const initialFieldValue = model[field];
    if (
      Array.isArray(initialFieldValue) &&
      size &&
      initialFieldValue.length !== size
    ) {
      throw new RangeError(
        `Invalid initial number of values for array (${field})`
      );
    }

    publicAPI[`set${_capitalize(field)}`] = (...args: unknown[]) => {
      if (model.deleted) {
        vtkErrorMacro('instance deleted - cannot call any method');
        return false;
      }

      let array: Nullable<unknown[]> = args;
      let changeDetected;
      let needCopy = false;
      // allow null or an array to be passed as a single arg.
      if (array.length === 1) {
        const first = array[0] as Nullable<unknown[]>;
        if (first === null || first.length) {
          /* eslint-disable prefer-destructuring */
          array = first;
          /* eslint-enable prefer-destructuring */
          needCopy = true;
        }
      }
      if (array == null) {
        changeDetected = model[field] !== array;
      } else {
        if (size && array.length !== size) {
          if (array.length < size && defaultVal !== undefined) {
            array = Array.from(array);
            needCopy = false;
            while (array.length < size) array.push(defaultVal);
          } else {
            throw new RangeError(
              `Invalid number of values for array setter (${field})`
            );
          }
        }
        const fieldValue = model[field] as Nullable<unknown[]>;
        changeDetected =
          fieldValue == null ||
          fieldValue.some((item, index) => item !== array![index]) ||
          fieldValue.length !== array.length;
        if (changeDetected && needCopy) {
          array = Array.from(array);
        }
      }

      if (changeDetected) {
        model[field] = array;
        publicAPI.modified();
      }
      return changeDetected;
    };

    publicAPI[`set${_capitalize(field)}From`] = (otherArray: unknown[]) => {
      const target = model[field] as unknown[];
      otherArray.forEach((v, i) => {
        target[i] = v;
      });
    };
  });
}

// ----------------------------------------------------------------------------
// set/get XXX: add setter and getter for object of type array
// ----------------------------------------------------------------------------

export function setGetArray(
  publicAPI: ObjPublicAPI,
  model: ObjModel,
  fieldNames: string[],
  size: number,
  defaultVal = undefined
) {
  getArray(publicAPI, model, fieldNames);
  setArray(publicAPI, model, fieldNames, size, defaultVal);
}

export function moveToProtected(
  publicAPI: ObjPublicAPI,
  model: ObjModel,
  fieldNames: string[]
) {
  for (let i = 0; i < fieldNames.length; i++) {
    const fieldName = fieldNames[i];
    if (model[fieldName] !== undefined) {
      model[`_${fieldName}`] = model[fieldName];
      delete model[fieldName];
    }
  }
}
// ----------------------------------------------------------------------------
// vtkAlgorithm: setInputData(), setInputConnection(), getOutputData(), getOutputPort()
// ----------------------------------------------------------------------------

export interface AlgoPublicAPI extends vtkAlgorithm, ObjPublicAPI {}

interface AlgoArrayToProcess {
  arrayName: string;
  fieldAssociation: string;
  attributeType: string;
}

export interface AlgoModel extends ObjModel {
  // FIXME the PLYWriter getOutputData is data, not a vtkObject...
  inputData: Nullable<vtkObject>[]; // FIXME Nullable<unknown>[]?
  inputConnection: Nullable<vtkPipelineConnection>[];
  output: vtkObject[]; // FIXME Nullable<unknown>[]?
  inputArrayToProcess: Nullable<AlgoArrayToProcess>[];
  numberOfInputs: number;
  numberOfOutputs: number;
}

export function algo(
  publicAPI: AlgoPublicAPI,
  model: AlgoModel,
  numberOfInputs: number,
  numberOfOutputs: number
) {
  if (model.inputData) {
    model.inputData = model.inputData.map(vtk);
  } else {
    model.inputData = [];
  }

  if (model.inputConnection) {
    model.inputConnection = model.inputConnection.map(vtk);
  } else {
    model.inputConnection = [];
  }

  if (model.output) {
    model.output = model.output.map(vtk);
  } else {
    model.output = [];
  }

  if (model.inputArrayToProcess) {
    model.inputArrayToProcess = model.inputArrayToProcess.map(vtk);
  } else {
    model.inputArrayToProcess = [];
  }

  // Cache the argument for later manipulation
  model.numberOfInputs = numberOfInputs;

  // Methods
  function setInputData(dataset: vtkObject, port = 0) {
    if (model.deleted) {
      vtkErrorMacro('instance deleted - cannot call any method');
      return;
    }
    if (port >= model.numberOfInputs) {
      vtkErrorMacro(
        `algorithm ${publicAPI.getClassName()} only has ${
          model.numberOfInputs
        } input ports. To add more input ports, use addInputData()`
      );
      return;
    }
    if (model.inputData[port] !== dataset || model.inputConnection[port]) {
      model.inputData[port] = dataset;
      model.inputConnection[port] = null;
      if (publicAPI.modified) {
        publicAPI.modified();
      }
    }
  }

  function getInputData(port = 0) {
    if (model.inputConnection[port]) {
      model.inputData[port] = model.inputConnection[port]!() as vtkObject;
    }
    return model.inputData[port];
  }

  function setInputConnection(outputPort: vtkPipelineConnection, port = 0) {
    if (model.deleted) {
      vtkErrorMacro('instance deleted - cannot call any method');
      return;
    }
    if (port >= model.numberOfInputs) {
      let msg = `algorithm ${publicAPI.getClassName()} only has `;
      msg += `${model.numberOfInputs}`;
      msg += ' input ports. To add more input ports, use addInputConnection()';
      vtkErrorMacro(msg);
      return;
    }
    model.inputData[port] = null;
    model.inputConnection[port] = outputPort;
  }

  function getInputConnection(port: number = 0) {
    return model.inputConnection[port];
  }

  function getPortToFill() {
    let portToFill = model.numberOfInputs;
    while (
      portToFill &&
      !model.inputData[portToFill - 1] &&
      !model.inputConnection[portToFill - 1]
    ) {
      portToFill--;
    }
    if (portToFill === model.numberOfInputs) {
      model.numberOfInputs++;
    }
    return portToFill;
  }

  function addInputConnection(outputPort: vtkPipelineConnection) {
    if (model.deleted) {
      vtkErrorMacro('instance deleted - cannot call any method');
      return;
    }
    setInputConnection(outputPort, getPortToFill());
  }

  function addInputData(dataset: vtkObject) {
    if (model.deleted) {
      vtkErrorMacro('instance deleted - cannot call any method');
      return;
    }
    setInputData(dataset, getPortToFill());
  }

  function getOutputData(port = 0) {
    if (model.deleted) {
      vtkErrorMacro('instance deleted - cannot call any method');
      return null;
    }
    if (publicAPI.shouldUpdate()) {
      publicAPI.update();
    }
    return model.output[port];
  }

  publicAPI.shouldUpdate = () => {
    const localMTime = publicAPI.getMTime();
    let minOutputMTime = Infinity;

    let count = numberOfOutputs;
    while (count--) {
      // FIXME isDeleted() assumes output is a vtkObject. See comments above.
      if (!model.output[count] || model.output[count].isDeleted()) {
        return true;
      }
      // FIXME getMTime() assumes output is a vtkObject. See comments above.
      const mt = model.output[count].getMTime();
      if (mt < localMTime) {
        return true;
      }
      if (mt < minOutputMTime) {
        minOutputMTime = mt;
      }
    }

    count = model.numberOfInputs;
    while (count--) {
      if (
        model.inputConnection[count]?.filter.shouldUpdate() ||
        publicAPI.getInputData(count)?.getMTime() > minOutputMTime
      ) {
        return true;
      }
    }

    return false;
  };

  function getOutputPort(port = 0) {
    const outputPortAccess = () => getOutputData(port);
    // Add reference to filter
    outputPortAccess.filter = publicAPI;
    return outputPortAccess;
  }

  // Handle input if needed
  if (model.numberOfInputs) {
    // Reserve inputs
    let count = model.numberOfInputs;
    while (count--) {
      model.inputData.push(null);
      model.inputConnection.push(null);
    }

    // Expose public methods
    publicAPI.setInputData = setInputData;
    publicAPI.setInputConnection = setInputConnection;
    publicAPI.addInputData = addInputData;
    publicAPI.addInputConnection = addInputConnection;
    publicAPI.getInputData = getInputData;
    publicAPI.getInputConnection = getInputConnection;
  }

  if (numberOfOutputs) {
    publicAPI.getOutputData = getOutputData;
    publicAPI.getOutputPort = getOutputPort;
  }

  publicAPI.update = () => {
    const ins = [];
    if (model.numberOfInputs) {
      let count = 0;
      while (count < model.numberOfInputs) {
        ins[count] = publicAPI.getInputData(count);
        count++;
      }
    }
    if (publicAPI.shouldUpdate() && publicAPI.requestData) {
      publicAPI.requestData(ins, model.output);
    }
  };

  publicAPI.getNumberOfInputPorts = () => model.numberOfInputs;
  publicAPI.getNumberOfOutputPorts = () =>
    numberOfOutputs || model.output.length;

  publicAPI.getInputArrayToProcess = (inputPort = 0) => {
    const arrayDesc = model.inputArrayToProcess[inputPort];
    const ds = model.inputData[inputPort] as IndexableAPI<vtkObject>;
    if (arrayDesc && ds) {
      return ds[`get${arrayDesc.fieldAssociation}`]().getArray(
        arrayDesc.arrayName
      );
    }
    return null;
  };
  publicAPI.setInputArrayToProcess = (
    inputPort,
    arrayName,
    fieldAssociation,
    attributeType = 'Scalars'
  ) => {
    while (model.inputArrayToProcess.length < inputPort) {
      model.inputArrayToProcess.push(null);
    }
    model.inputArrayToProcess[inputPort] = {
      arrayName,
      fieldAssociation,
      attributeType,
    };
  };
}

// ----------------------------------------------------------------------------
// Event handling: onXXX(callback), invokeXXX(args...)
// ----------------------------------------------------------------------------

export const EVENT_ABORT = Symbol('Event abort');

export function event(
  publicAPI: ObjPublicAPI,
  model: ObjModel,
  eventName: string
) {
  // id, callback, priority
  type Callback = [number, Function, number];

  const callbacks: Callback[] = [];
  const previousDelete = publicAPI.delete;
  let curCallbackID = 1;

  function off(callbackID: number) {
    for (let i = 0; i < callbacks.length; ++i) {
      const [cbID] = callbacks[i];
      if (cbID === callbackID) {
        callbacks.splice(i, 1);
        return;
      }
    }
  }

  function on(callbackID: number) {
    function unsubscribe() {
      off(callbackID);
    }

    return Object.freeze({
      unsubscribe,
    });
  }

  function invoke(...args: unknown[]) {
    if (model.deleted) {
      vtkErrorMacro('instance deleted - cannot call any method');
      return;
    }
    /* eslint-disable prefer-rest-params */
    // Go through a copy of the callbacks array in case new callbacks
    // get prepended within previous callbacks
    const currentCallbacks = callbacks.slice();
    for (let index = 0; index < currentCallbacks.length; ++index) {
      const [, cb, priority] = currentCallbacks[index];

      if (!cb) {
        continue; // eslint-disable-line
      }

      if (priority < 0) {
        setTimeout(() => cb.apply(publicAPI, args), 1 - priority);
      } else {
        // Abort only if the callback explicitly returns false
        const continueNext = cb.apply(publicAPI, args);
        if (continueNext === EVENT_ABORT) {
          break;
        }
      }
    }
    /* eslint-enable prefer-rest-params */
  }

  publicAPI[`invoke${_capitalize(eventName)}`] = invoke;

  publicAPI[`on${_capitalize(eventName)}`] = (
    callback: Function,
    priority = 0.0
  ) => {
    if (!callback.apply) {
      console.error(`Invalid callback for event ${eventName}`);
      return null;
    }

    if (model.deleted) {
      vtkErrorMacro('instance deleted - cannot call any method');
      return null;
    }

    const callbackID = curCallbackID++;
    callbacks.push([callbackID, callback, priority]);
    callbacks.sort((cb1, cb2) => cb2[2] - cb1[2]);
    return on(callbackID);
  };

  publicAPI.delete = () => {
    previousDelete();
    callbacks.forEach(([cbID]) => off(cbID));
  };
}

// ----------------------------------------------------------------------------
// newInstance
// ----------------------------------------------------------------------------

// FIXME copied from macros.d.ts
// maybe we will generate the d.ts from this ts?
export type VtkExtend<P, M, I = Record<string, unknown>> = (
  publicAPI: P,
  model: M,
  initialValues: I
) => void;

export function newInstance<P, M, I = Record<string, unknown>>(
  extend: VtkExtend<P, M, I>,
  className: string
) {
  const constructor = (initialValues: I = {} as I) => {
    const model = {} as M;
    const publicAPI = {} as P;
    extend(publicAPI, model, initialValues);

    return Object.freeze(publicAPI);
  };

  // Register constructor to factory
  if (className) {
    vtk.register(className, constructor);
  }

  return constructor;
}

// ----------------------------------------------------------------------------
// Chain function calls
// ----------------------------------------------------------------------------

export function chain(...fn: Function[]) {
  return (...args: unknown[]) => fn.filter((i) => !!i).map((i) => i(...args));
}

// ----------------------------------------------------------------------------
// Some utility methods for vtk objects
// ----------------------------------------------------------------------------

export function isVtkObject(instance: unknown): instance is vtkObject {
  return (
    !!instance &&
    (instance as ObjPublicAPI).isA &&
    (instance as ObjPublicAPI).isA('vtkObject')
  );
}

export function traverseInstanceTree(
  instance: unknown,
  extractFunction: (instance: vtkObject) => unknown,
  accumulator: unknown[] = [],
  visitedInstances: vtkObject[] = []
) {
  if (isVtkObject(instance)) {
    if (visitedInstances.indexOf(instance) >= 0) {
      // avoid cycles
      return accumulator;
    }

    visitedInstances.push(instance);
    const result = extractFunction(instance);
    if (result !== undefined) {
      accumulator.push(result);
    }

    // Now go through this instance's model
    const model = instance.get() as ObjModel;
    Object.keys(model).forEach((key) => {
      const modelObj = model[key];
      if (Array.isArray(modelObj)) {
        modelObj.forEach((subObj) => {
          traverseInstanceTree(
            subObj,
            extractFunction,
            accumulator,
            visitedInstances
          );
        });
      } else {
        traverseInstanceTree(
          modelObj,
          extractFunction,
          accumulator,
          visitedInstances
        );
      }
    });
  }

  return accumulator;
}

// ----------------------------------------------------------------------------
// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.

export function debounce(
  this: unknown,
  func: Function,
  wait: number,
  immediate: boolean
) {
  let timeout: ReturnType<typeof setTimeout>;
  const debounced = (...args: unknown[]) => {
    const context = this;
    const later = () => {
      if (!immediate) {
        func.apply(context, args);
      }
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) {
      func.apply(context, args);
    }
  };

  debounced.cancel = () => clearTimeout(timeout);

  return debounced;
}

// ----------------------------------------------------------------------------
// Creates a throttled function that only invokes `func` at most once per
// every `wait` milliseconds.

export function throttle(callback: Function, delay: number) {
  let isThrottled = false;
  let argsToUse: Nullable<unknown[]> = null;

  function next() {
    isThrottled = false;
    if (argsToUse !== null) {
      wrapper(...argsToUse); // eslint-disable-line
      argsToUse = null;
    }
  }

  function wrapper(...args: unknown[]) {
    if (isThrottled) {
      argsToUse = args;
      return;
    }
    isThrottled = true;
    callback(...args);
    setTimeout(next, delay);
  }

  return wrapper;
}

// ----------------------------------------------------------------------------
// keystore(publicAPI, model, initialKeystore)
//
//    - initialKeystore: Initial keystore. This can be either a Map or an
//      object.
//
// Generated API
//  setKey(key, value) : mixed (returns value)
//  getKey(key) : mixed
//  getAllKeys() : [mixed]
//  deleteKey(key) : Boolean
// ----------------------------------------------------------------------------

export interface KeystorePublicAPI {
  setKey<T>(key: string, value: T): void;
  getKey<T>(key: string): T;
  getAllKeys(): string[];
  deleteKey(key: string): void;
  clearKeystore(): void;
}

export interface KeystoreModel extends ObjModel {
  keystore: Record<string, unknown>;
}

export function keystore(
  publicAPI: KeystorePublicAPI,
  model: KeystoreModel,
  initialKeystore: Record<string, unknown> = {}
) {
  model.keystore = Object.assign(
    model.keystore || ({} as Record<string, unknown>),
    initialKeystore
  );

  publicAPI.setKey = (key: string, value: unknown) => {
    model.keystore[key] = value;
  };
  publicAPI.getKey = <T>(key: string) => model.keystore[key] as T;
  publicAPI.getAllKeys = () => Object.keys(model.keystore);
  publicAPI.deleteKey = (key: string) => delete model.keystore[key];
  publicAPI.clearKeystore = () =>
    publicAPI.getAllKeys().forEach((key: string) => delete model.keystore[key]);
}

// ----------------------------------------------------------------------------
// proxy(publicAPI, model, sectionName, propertyUI)
//
//    - sectionName: Name of the section for UI
//    - propertyUI: List of props with their UI description
//
// Generated API
//  getProxyId() : String
//  listProxyProperties() : [string]
//  updateProxyProperty(name, prop)
//  getProxySection() => List of properties for UI generation
// ----------------------------------------------------------------------------
let nextProxyId = 1;
const ROOT_GROUP_NAME = '__root__';

interface ProxyPropertyDescription {
  name: string;
  domain?: Record<string, unknown>;
  children?: Array<ProxyPropertyDescription>;
}

interface ProxyPropertyLink {
  bind: Function;
  unbind: Function;
  unsubscribe: Function;
  persistent: boolean;
  value?: unknown;
}

interface ProxyProperty {
  id: string;
  name: string;
  value: unknown;
  children?: ProxyProperty[];
}

interface ProxyPropertyLinkSpec {
  link: string;
  property: string;
  updateOnBind?: boolean;
  type?: 'application';
  persistent?: boolean;
}

interface ProxySection {
  id: string;
  name: string;
  ui: ProxyPropertyDescription[];
  properties: ProxyProperty[];
}

export interface ProxyObjPublicAPI extends ObjPublicAPI, KeystorePublicAPI {
  getProxyId(): string;
  getProxyGroup(): string;
  getProxyName(): string;
  // TODO FIXME type of manager
  setProxyManager(manager: ProxyObjPublicAPI): boolean;
  getProxyManager(): ProxyObjPublicAPI;
  updateUI(ui: ProxyPropertyDescription[]): void;
  updateProxyProperty(
    propertyName: string,
    propUI: ProxyPropertyDescription
  ): void;
  activate(): void;
  registerPropertyLinkForGC(otherLink: ProxyPropertyLink, type: string): void;
  gcPropertyLinks(type: string): void;
  getPropertyLink(id: string, persistent: boolean): ProxyPropertyLink;
  listPropertyNames(): string[];
  getPropertyByName(name: string): ProxyProperty | undefined;
  getPropertyDomainByName(name: string): Record<string, unknown> | undefined;
  getProxySection(): ProxySection;
}

export interface ProxyObjModel extends ObjModel, KeystoreModel {
  proxyId: string;
  proxyGroup: string;
  ui: ProxyPropertyDescription[];
  proxyManager?: ObjPublicAPI;
  propertyLinkSubscribers: Record<string, ProxyPropertyLink[]>;
  propertyLinkMap: Record<string, ProxyPropertyLink>;
  links: ProxyPropertyLinkSpec[];
}

export function proxy(publicAPI: ProxyObjPublicAPI, model: ProxyObjModel) {
  // Proxies are keystores
  keystore(publicAPI, model);

  const parentDelete = publicAPI.delete;

  // getProxyId
  model.proxyId = `${nextProxyId++}`;

  // ui handling
  model.ui = JSON.parse(JSON.stringify(model.ui || [])); // deep copy
  get(publicAPI, model, ['proxyId', 'proxyGroup', 'proxyName']);
  setGet(publicAPI, model, ['proxyManager']);

  // group properties
  const propertyMap: Record<string, ProxyPropertyDescription> = {};
  const groupChildrenNames: Record<string, string[]> = {};

  function registerProperties(
    descriptionList: ProxyPropertyDescription[],
    currentGroupName: string
  ) {
    if (!groupChildrenNames[currentGroupName]) {
      groupChildrenNames[currentGroupName] = [];
    }
    const childrenNames = groupChildrenNames[currentGroupName];

    for (let i = 0; i < descriptionList.length; i++) {
      childrenNames.push(descriptionList[i].name);
      propertyMap[descriptionList[i].name] = descriptionList[i];
      const { children } = descriptionList[i];
      if (children?.length) {
        registerProperties(children, descriptionList[i].name);
      }
    }
  }

  registerProperties(model.ui, ROOT_GROUP_NAME);

  publicAPI.updateUI = (ui: ProxyPropertyDescription[]) => {
    model.ui = JSON.parse(JSON.stringify(ui || [])); // deep copy
    Object.keys(propertyMap).forEach((k) => delete propertyMap[k]);
    Object.keys(groupChildrenNames).forEach(
      (k) => delete groupChildrenNames[k]
    );
    registerProperties(model.ui, ROOT_GROUP_NAME);
    publicAPI.modified();
  };

  function listProxyProperties(gName = ROOT_GROUP_NAME) {
    return groupChildrenNames[gName];
  }

  publicAPI.updateProxyProperty = (
    propertyName: string,
    propUI: ProxyPropertyDescription
  ) => {
    const prop = propertyMap[propertyName];
    if (prop) {
      Object.assign(prop, propUI);
    } else {
      propertyMap[propertyName] = { ...propUI };
    }
  };

  publicAPI.activate = () => {
    if (model.proxyManager) {
      const setActiveMethod = `setActive${_capitalize(
        publicAPI.getProxyGroup().slice(0, -1)
      )}`;
      if (model.proxyManager[setActiveMethod]) {
        model.proxyManager[setActiveMethod](publicAPI);
      }
    }
  };

  // property link
  model.propertyLinkSubscribers = {};

  publicAPI.registerPropertyLinkForGC = (
    otherLink: ProxyPropertyLink,
    type: string
  ) => {
    if (!(type in model.propertyLinkSubscribers)) {
      model.propertyLinkSubscribers[type] = [];
    }
    model.propertyLinkSubscribers[type].push(otherLink);
  };

  publicAPI.gcPropertyLinks = (type: string) => {
    const subscribers = model.propertyLinkSubscribers[type] || [];
    while (subscribers.length) {
      subscribers.pop()!.unbind(publicAPI);
    }
  };

  model.propertyLinkMap = {};

  interface InternalLink {
    instance: ObjPublicAPI;
    propertyName: string;
    subscription: vtkSubscription;
  }

  publicAPI.getPropertyLink = (id: string, persistent = false) => {
    if (model.propertyLinkMap[id]) {
      return model.propertyLinkMap[id];
    }
    let value: Nullable<object> = null;
    const links: InternalLink[] = [];
    let count = 0;
    let updateInProgress = false;

    function update(source: unknown, force = false) {
      if (updateInProgress) {
        return null;
      }

      const needUpdate = [];
      let sourceLink = null;
      count = links.length;
      while (count--) {
        const link = links[count];
        if (link.instance === source) {
          sourceLink = link;
        } else {
          needUpdate.push(link);
        }
      }

      if (!sourceLink) {
        return null;
      }

      const newValue =
        sourceLink.instance[`get${_capitalize(sourceLink.propertyName)}`]();
      if (!shallowEquals(newValue, value) || force) {
        value = newValue;
        updateInProgress = true;
        while (needUpdate.length) {
          const linkToUpdate = needUpdate.pop()!;
          linkToUpdate.instance.set({
            [linkToUpdate.propertyName]: value,
          });
        }
        updateInProgress = false;
      }

      if (model.propertyLinkMap[id].persistent) {
        model.propertyLinkMap[id].value = newValue;
      }

      return newValue;
    }

    function unbind(instance: ObjPublicAPI, propertyName: string) {
      const indexToDelete = [];
      count = links.length;
      while (count--) {
        const link = links[count];
        if (
          link.instance === instance &&
          (link.propertyName === propertyName || propertyName === undefined)
        ) {
          link.subscription.unsubscribe();
          indexToDelete.push(count);
        }
      }
      while (indexToDelete.length) {
        links.splice(indexToDelete.pop()!, 1);
      }
    }

    function bind(
      instance: ObjPublicAPI,
      propertyName: string,
      updateMe = false
    ) {
      if (instance.isDeleted()) {
        return;
      }
      const subscription = instance.onModified(update)!;
      const other = links[0];
      links.push({
        instance,
        propertyName,
        subscription,
      });
      if (updateMe) {
        if (
          model.propertyLinkMap[id].persistent &&
          model.propertyLinkMap[id].value !== undefined
        ) {
          instance.set({
            [propertyName]: model.propertyLinkMap[id].value,
          });
        } else if (other) {
          update(other.instance, true);
        }
      }
      return {
        unsubscribe: () => unbind(instance, propertyName),
      };
    }

    function unsubscribe() {
      while (links.length) {
        links.pop()!.subscription.unsubscribe();
      }
    }

    const linkHandler = {
      bind,
      unbind,
      unsubscribe,
      persistent,
    };
    model.propertyLinkMap[id] = linkHandler;
    return linkHandler;
  };

  // extract values
  function getProperties(groupName = ROOT_GROUP_NAME) {
    const values = [];
    const id = model.proxyId;
    const propertyNames = listProxyProperties(groupName) || [];
    for (let i = 0; i < propertyNames.length; i++) {
      const name = propertyNames[i];
      const method = publicAPI[`get${_capitalize(name)}`];
      const value = method ? method() : undefined;
      const prop: ProxyProperty = {
        id,
        name,
        value,
      };
      const children = getProperties(name);
      if (children.length) {
        prop.children = children;
      }
      values.push(prop);
    }
    return values;
  }

  publicAPI.listPropertyNames = () => getProperties().map((p) => p.name);

  publicAPI.getPropertyByName = (name: string) =>
    getProperties().find((p) => p.name === name);

  publicAPI.getPropertyDomainByName = (name: string) =>
    (propertyMap[name] || {}).domain;

  // ui section
  publicAPI.getProxySection = () => ({
    id: model.proxyId,
    name: model.proxyGroup,
    ui: model.ui,
    properties: getProperties(),
  });

  // free resources
  publicAPI.delete = () => {
    const list = Object.keys(model.propertyLinkMap);
    let count = list.length;
    while (count--) {
      model.propertyLinkMap[list[count]].unsubscribe();
    }
    Object.keys(model.propertyLinkSubscribers).forEach((type) =>
      publicAPI.gcPropertyLinks(type)
    );
    parentDelete();
  };

  // @todo fix infinite recursion due to active source
  publicAPI.getState = () => null;

  function registerLinks() {
    // Allow dynamic registration of links at the application level
    if (model.links && model.proxyManager) {
      for (let i = 0; i < model.links.length; i++) {
        const { link, property, persistent, updateOnBind, type } =
          model.links[i];
        if (type === 'application') {
          const sLink = model.proxyManager.getPropertyLink(link, persistent);
          publicAPI.registerPropertyLinkForGC(sLink, 'application');
          sLink.bind(publicAPI, property, updateOnBind);
        }
      }
    }
  }

  setImmediateVTK(registerLinks);
}

// ----------------------------------------------------------------------------
// proxyPropertyMapping(publicAPI, model, map)
//
//   map = {
//      opacity: { modelKey: 'property', property: 'opacity' },
//   }
//
// Generated API:
//  Elevate set/get methods from internal object stored in the model to current one
// ----------------------------------------------------------------------------

type ProxyPropertyMapping = Record<
  string,
  { modelKey: string; property: string; modified?: boolean }
>;

export function proxyPropertyMapping(
  publicAPI: ObjPublicAPI,
  model: ObjModel,
  map: ProxyPropertyMapping
) {
  const parentDelete = publicAPI.delete;
  const subscriptions: vtkSubscription[] = [];

  const propertyNames = Object.keys(map);
  let count = propertyNames.length;
  while (count--) {
    const propertyName = propertyNames[count];
    const { modelKey, property, modified = true } = map[propertyName];
    const methodSrc = _capitalize(property);
    const methodDst = _capitalize(propertyName);
    const dstObj = model[modelKey] as ObjPublicAPI;
    publicAPI[`get${methodDst}`] = dstObj[`get${methodSrc}`];
    publicAPI[`set${methodDst}`] = dstObj[`set${methodSrc}`];
    if (modified) {
      subscriptions.push(dstObj.onModified(() => publicAPI.modified())!);
    }
  }

  publicAPI.delete = () => {
    while (subscriptions.length) {
      subscriptions.pop()!.unsubscribe();
    }
    parentDelete();
  };
}

// ----------------------------------------------------------------------------
// proxyPropertyState(publicAPI, model, state, defaults)
//
//   state = {
//     representation: {
//       'Surface with edges': { property: { edgeVisibility: true, representation: 2 } },
//       Surface: { property: { edgeVisibility: false, representation: 2 } },
//       Wireframe: { property: { edgeVisibility: false, representation: 1 } },
//       Points: { property: { edgeVisibility: false, representation: 0 } },
//     },
//   }
//
//   defaults = {
//      representation: 'Surface',
//   }
//
// Generated API
//   get / set Representation ( string ) => push state to various internal objects
// ----------------------------------------------------------------------------

export function proxyPropertyState(
  publicAPI: ObjPublicAPI,
  model: ObjModel,
  state: Record<
    string,
    Record<string, Record<string, Record<string, unknown>>>
  > = {},
  defaults: Record<string, string> = {}
) {
  model.this = publicAPI;

  function applyState(map: Record<string, Record<string, unknown>>) {
    const modelKeys = Object.keys(map);
    let count = modelKeys.length;
    while (count--) {
      const modelKey = modelKeys[count];
      (model[modelKey] as vtkObject).set(map[modelKey]);
    }
  }

  const modelKeys = Object.keys(defaults);
  let count = modelKeys.length;
  while (count--) {
    // Add default
    const key = modelKeys[count];
    model[key] = defaults[key];

    // Add set method
    const mapping = state[key];
    publicAPI[`set${_capitalize(key)}`] = (value: string) => {
      if (value !== model[key]) {
        model[key] = value;
        const propValues = mapping[value];
        applyState(propValues);
        publicAPI.modified();
      }
    };
  }

  // Add getter
  if (modelKeys.length) {
    get(publicAPI, model, modelKeys);
  }
}

// ----------------------------------------------------------------------------
// From : https://github.com/facebookarchive/fixed-data-table/blob/master/src/vendor_upstream/dom/normalizeWheel.js
//
//
// Copyright (c) 2015, Facebook, Inc.
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree. An additional grant
// of patent rights can be found in the PATENTS file in the same directory.
//
//
// Mouse wheel (and 2-finger trackpad) support on the web sucks.  It is
// complicated, thus this doc is long and (hopefully) detailed enough to answer
// your questions.
//
// If you need to react to the mouse wheel in a predictable way, this code is
// like your bestest friend.// hugs//
//
// As of today, there are 4 DOM event types you can listen to:
//
//   'wheel'                -- Chrome(31+), FF(17+), IE(9+)
//   'mousewheel'           -- Chrome, IE(6+), Opera, Safari
//   'MozMousePixelScroll'  -- FF(3.5 only!) (2010-2013) -- don't bother!
//   'DOMMouseScroll'       -- FF(0.9.7+) since 2003
//
// So what to do?  The is the best:
//
//   normalizeWheel.getEventType();
//
// In your event callback, use this code to get sane interpretation of the
// deltas.  This code will return an object with properties:
//
//   spinX   -- normalized spin speed (use for zoom) - x plane
//   spinY   -- " - y plane
//   pixelX  -- normalized distance (to pixels) - x plane
//   pixelY  -- " - y plane
//
// Wheel values are provided by the browser assuming you are using the wheel to
// scroll a web page by a number of lines or pixels (or pages).  Values can vary
// significantly on different platforms and browsers, forgetting that you can
// scroll at different speeds.  Some devices (like trackpads) emit more events
// at smaller increments with fine granularity, and some emit massive jumps with
// linear speed or acceleration.
//
// This code does its best to normalize the deltas for you:
//
//   - spin is trying to normalize how far the wheel was spun (or trackpad
//     dragged).  This is super useful for zoom support where you want to
//     throw away the chunky scroll steps on the PC and make those equal to
//     the slow and smooth tiny steps on the Mac. Key data: This code tries to
//     resolve a single slow step on a wheel to 1.
//
//   - pixel is normalizing the desired scroll delta in pixel units.  You'll
//     get the crazy differences between browsers, but at least it'll be in
//     pixels!
//
//   - positive value indicates scrolling DOWN/RIGHT, negative UP/LEFT.  This
//     should translate to positive value zooming IN, negative zooming OUT.
//     This matches the newer 'wheel' event.
//
// Why are there spinX, spinY (or pixels)?
//
//   - spinX is a 2-finger side drag on the trackpad, and a shift + wheel turn
//     with a mouse.  It results in side-scrolling in the browser by default.
//
//   - spinY is what you expect -- it's the classic axis of a mouse wheel.
//
//   - I dropped spinZ/pixelZ.  It is supported by the DOM 3 'wheel' event and
//     probably is by browsers in conjunction with fancy 3D controllers .. but
//     you know.
//
// Implementation info:
//
// Examples of 'wheel' event if you scroll slowly (down) by one step with an
// average mouse:
//
//   OS X + Chrome  (mouse)     -    4   pixel delta  (wheelDelta -120)
//   OS X + Safari  (mouse)     -  N/A   pixel delta  (wheelDelta  -12)
//   OS X + Firefox (mouse)     -    0.1 line  delta  (wheelDelta  N/A)
//   Win8 + Chrome  (mouse)     -  100   pixel delta  (wheelDelta -120)
//   Win8 + Firefox (mouse)     -    3   line  delta  (wheelDelta -120)
//
// On the trackpad:
//
//   OS X + Chrome  (trackpad)  -    2   pixel delta  (wheelDelta   -6)
//   OS X + Firefox (trackpad)  -    1   pixel delta  (wheelDelta  N/A)
//
// On other/older browsers.. it's more complicated as there can be multiple and
// also missing delta values.
//
// The 'wheel' event is more standard:
//
// http://www.w3.org/TR/DOM-Level-3-Events/#events-wheelevents
//
// The basics is that it includes a unit, deltaMode (pixels, lines, pages), and
// deltaX, deltaY and deltaZ.  Some browsers provide other values to maintain
// backward compatibility with older events.  Those other values help us
// better normalize spin speed.  Example of what the browsers provide:
//
//                          | event.wheelDelta | event.detail
//        ------------------+------------------+--------------
//          Safari v5/OS X  |       -120       |       0
//          Safari v5/Win7  |       -120       |       0
//         Chrome v17/OS X  |       -120       |       0
//         Chrome v17/Win7  |       -120       |       0
//                IE9/Win7  |       -120       |   undefined
//         Firefox v4/OS X  |     undefined    |       1
//         Firefox v4/Win7  |     undefined    |       3
//
// ----------------------------------------------------------------------------

// Reasonable defaults
const PIXEL_STEP = 10;
const LINE_HEIGHT = 40;
const PAGE_HEIGHT = 800;

interface DeprecatedWheelEvent {
  wheelDelta: number;
  wheelDeltaY: number;
  wheelDeltaX: number;
  axis: number;
  HORIZONTAL_AXIS: number;
}

export function normalizeWheel(wheelEvent: WheelEvent & DeprecatedWheelEvent) {
  let sX = 0; // spinX
  let sY = 0; // spinY
  let pX = 0; // pixelX
  let pY = 0; // pixelY

  // Legacy
  if ('detail' in wheelEvent) {
    sY = wheelEvent.detail;
  }
  if ('wheelDelta' in wheelEvent) {
    sY = -wheelEvent.wheelDelta / 120;
  }
  if ('wheelDeltaY' in wheelEvent) {
    sY = -wheelEvent.wheelDeltaY / 120;
  }
  if ('wheelDeltaX' in wheelEvent) {
    sX = -wheelEvent.wheelDeltaX / 120;
  }

  // side scrolling on FF with DOMMouseScroll
  if ('axis' in wheelEvent && wheelEvent.axis === wheelEvent.HORIZONTAL_AXIS) {
    sX = sY;
    sY = 0;
  }

  pX = sX * PIXEL_STEP;
  pY = sY * PIXEL_STEP;

  if ('deltaY' in wheelEvent) {
    pY = wheelEvent.deltaY;
  }
  if ('deltaX' in wheelEvent) {
    pX = wheelEvent.deltaX;
  }

  if ((pX || pY) && wheelEvent.deltaMode) {
    if (wheelEvent.deltaMode === 1) {
      // delta in LINE units
      pX *= LINE_HEIGHT;
      pY *= LINE_HEIGHT;
    } else {
      // delta in PAGE units
      pX *= PAGE_HEIGHT;
      pY *= PAGE_HEIGHT;
    }
  }

  // Fall-back if spin cannot be determined
  if (pX && !sX) {
    sX = pX < 1 ? -1 : 1;
  }
  if (pY && !sY) {
    sY = pY < 1 ? -1 : 1;
  }

  return {
    spinX: sX,
    spinY: sY,
    pixelX: pX,
    pixelY: pY,
  };
}

// ----------------------------------------------------------------------------
// Default export
// ----------------------------------------------------------------------------

export default {
  algo,
  capitalize,
  chain,
  debounce,
  enumToString,
  event,
  EVENT_ABORT,
  formatBytesToProperUnit,
  formatNumbersWithThousandSeparator,
  get,
  getArray,
  getCurrentGlobalMTime,
  getStateArrayMapFunc,
  isVtkObject,
  keystore,
  measurePromiseExecution,
  moveToProtected,
  newInstance,
  newTypedArray,
  newTypedArrayFrom,
  normalizeWheel,
  obj,
  proxy,
  proxyPropertyMapping,
  proxyPropertyState,
  safeArrays,
  set,
  setArray,
  setGet,
  setGetArray,
  setImmediate: setImmediateVTK,
  setLoggerFunction,
  throttle,
  traverseInstanceTree,
  TYPED_ARRAYS, // deprecated todo remove on breaking API revision
  uncapitalize,
  VOID,
  vtkDebugMacro,
  vtkErrorMacro,
  vtkInfoMacro,
  vtkLogMacro,
  vtkOnceErrorMacro,
  vtkWarningMacro,
};
