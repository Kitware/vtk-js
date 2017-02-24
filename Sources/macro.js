import vtk from './vtk';

let globalMTime = 0;

export function getCurrentGlobalMTime() {
  return globalMTime;
}

// ----------------------------------------------------------------------------
// capitilze provided string
// ----------------------------------------------------------------------------

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function enumToString(e, value) {
  return Object.keys(e).find(key => e[key] === value);
}

export function getStateArrayMapFunc(item) {
  if (item.isA) {
    return item.getState();
  }
  return item;
}

// ----------------------------------------------------------------------------
// vtkObject: modified(), onModified(callback), delete()
// ----------------------------------------------------------------------------

export function obj(publicAPI = {}, model = {}) {
  const callbacks = [];
  model.mtime = (Number.isInteger(model.mtime) ? model.mtime : ++globalMTime);
  model.classHierarchy = ['vtkObject'];

  function off(index) {
    callbacks[index] = null;
  }

  function on(index) {
    function unsubscribe() {
      off(index);
    }
    return Object.freeze({ unsubscribe });
  }

  publicAPI.isDeleted = () => !!model.deleted;

  publicAPI.modified = () => {
    if (model.deleted) {
      console.log('instance deleted - cannot call any method');
      return;
    }

    model.mtime = ++globalMTime;
    callbacks.forEach(callback => callback && callback(publicAPI));
  };

  publicAPI.onModified = (callback) => {
    if (model.deleted) {
      console.log('instance deleted - cannot call any method');
      return null;
    }

    const index = callbacks.length;
    callbacks.push(callback);
    return on(index);
  };

  publicAPI.getMTime = () => model.mtime;

  publicAPI.isA = className => (model.classHierarchy.indexOf(className) !== -1);

  publicAPI.getClassName = () => model.classHierarchy.slice(-1)[0];

  publicAPI.set = (map = {}, noWarning = false) => {
    let ret = false;
    Object.keys(map).forEach((name) => {
      const fn = publicAPI[`set${capitalize(name)}`];
      if (fn && Array.isArray(map[name])) {
        ret = fn(...map[name]) || ret;
      } else if (fn) {
        ret = fn(map[name]) || ret;
      } else {
        // Set data on model directly
        if (['mtime'].indexOf(name) === -1 && !noWarning) {
          console.log('Warning: Set value to model directly', name, map[name]);
        }
        model[name] = map[name];
        ret = true;
      }
    });
    return ret;
  };

  publicAPI.get = (...list) => {
    if (!list.length) {
      return model;
    }
    const subset = {};
    list.forEach((name) => {
      subset[name] = model[name];
    });
    return subset;
  };

  publicAPI.delete = () => {
    Object.keys(model).forEach(field => delete model[field]);
    callbacks.forEach((el, index) => off(index));

    // Flag the instance being deleted
    model.deleted = true;
  };

  // Add serialization support
  publicAPI.getState = () => {
    const jsonArchive = Object.assign({}, model, { vtkClass: publicAPI.getClassName() });

    // Convert every vtkObject to its serializable form
    Object.keys(jsonArchive).forEach((keyName) => {
      if (jsonArchive[keyName] === null || jsonArchive[keyName] === undefined) {
        delete jsonArchive[keyName];
      } else if (jsonArchive[keyName].isA) {
        jsonArchive[keyName] = jsonArchive[keyName].getState();
      } else if (Array.isArray(jsonArchive[keyName])) {
        jsonArchive[keyName] = jsonArchive[keyName].map(getStateArrayMapFunc);
      }
    });

    // Sort resulting object by key name
    const sortedObj = {};
    Object.keys(jsonArchive).sort().forEach((name) => {
      sortedObj[name] = jsonArchive[name];
    });

    // Remove mtime
    if (sortedObj.mtime) {
      delete sortedObj.mtime;
    }

    return sortedObj;
  };

  // Add shallowCopy(otherInstance) support
  publicAPI.shallowCopy = (other, debug = false) => {
    if (other.getClassName() !== publicAPI.getClassName()) {
      throw new Error(`Cannot ShallowCopy ${other.getClassName()} into ${publicAPI.getClassName()}`);
    }
    const otherModel = other.get();

    const keyList = Object.keys(model).sort();
    const otherKeyList = Object.keys(otherModel).sort();

    otherKeyList.forEach((key) => {
      const keyIdx = keyList.indexOf(key);
      if (keyIdx === -1) {
        if (debug) {
          console.log(`add ${key} in shallowCopy`);
        }
      } else {
        keyList.splice(keyIdx, 1);
      }
      model[key] = otherModel[key];
    });
    if (keyList.length && debug) {
      console.log(`Untouched keys: ${keyList.join(', ')}`);
    }

    publicAPI.modified();
  };
}

// ----------------------------------------------------------------------------
// getXXX: add getters
// ----------------------------------------------------------------------------

export function get(publicAPI, model, fieldNames) {
  fieldNames.forEach((field) => {
    if (typeof field === 'object') {
      publicAPI[`get${capitalize(field.name)}`] = () => model[field.name];
    } else {
      publicAPI[`get${capitalize(field)}`] = () => model[field];
    }
  });
}

// ----------------------------------------------------------------------------
// setXXX: add setters
// ----------------------------------------------------------------------------

const objectSetterMap = {
  enum(publicAPI, model, field) {
    return (value) => {
      if (typeof value === 'string') {
        if (field.enum[value] !== undefined) {
          if (model[field.name] !== field.enum[value]) {
            model[field.name] = field.enum[value];
            publicAPI.modified();
            return true;
          }
          return false;
        }
        console.error('Set Enum with invalid argument', field, value);
        throw new RangeError('Set Enum with invalid string argument');
      }
      if (typeof value === 'number') {
        if (model[field.name] !== value) {
          if (Object.keys(field.enum).map(key => field.enum[key]).indexOf(value) !== -1) {
            model[field.name] = value;
            publicAPI.modified();
            return true;
          }
          console.error('Set Enum outside numeric range', field, value);
          throw new RangeError('Set Enum outside numeric range');
        }
        return false;
      }
      console.error('Set Enum with invalid argument (String/Number)', field, value);
      throw new TypeError('Set Enum with invalid argument (String/Number)');
    };
  },
};

function findSetter(field) {
  if (typeof field === 'object') {
    const fn = objectSetterMap[field.type];
    if (fn) {
      return (publicAPI, model) => fn(publicAPI, model, field);
    }

    console.error('No setter for field', field);
    throw new TypeError('No setter for field');
  }
  return function getSetter(publicAPI, model) {
    return function setter(value) {
      if (model.deleted) {
        console.log('instance deleted - cannot call any method');
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

export function set(publicAPI, model, fields) {
  fields.forEach((field) => {
    if (typeof field === 'object') {
      publicAPI[`set${capitalize(field.name)}`] = findSetter(field)(publicAPI, model);
    } else {
      publicAPI[`set${capitalize(field)}`] = findSetter(field)(publicAPI, model);
    }
  });
}

// ----------------------------------------------------------------------------
// set/get XXX: add both setters and getters
// ----------------------------------------------------------------------------

export function setGet(publicAPI, model, fieldNames) {
  get(publicAPI, model, fieldNames);
  set(publicAPI, model, fieldNames);
}

// ----------------------------------------------------------------------------
// getXXX: add getters for object of type array
// ----------------------------------------------------------------------------

export function getArray(publicAPI, model, fieldNames) {
  fieldNames.forEach((field) => {
    publicAPI[`get${capitalize(field)}`] = () => [].concat(model[field]);
  });
}

// ----------------------------------------------------------------------------
// setXXX: add setter for object of type array
// ----------------------------------------------------------------------------

export function setArray(publicAPI, model, fieldNames, size) {
  fieldNames.forEach((field) => {
    publicAPI[`set${capitalize(field)}`] = (...args) => {
      if (model.deleted) {
        console.log('instance deleted - cannot call any method');
        return false;
      }

      let array = args;
      // allow an array passed as a single arg.
      if (array.length === 1 && Array.isArray(array[0])) {
        array = array[0];
      }

      if (array.length !== size) {
        throw new RangeError('Invalid number of values for array setter');
      }
      let changeDetected = false;
      model[field].forEach((item, index) => {
        if (item !== array[index]) {
          if (changeDetected) {
            return;
          }
          changeDetected = true;
        }
      });

      if (changeDetected) {
        model[field] = [].concat(array);
        publicAPI.modified();
      }
      return true;
    };
  });
}

// ----------------------------------------------------------------------------
// set/get XXX: add setter and getter for object of type array
// ----------------------------------------------------------------------------

export function setGetArray(publicAPI, model, fieldNames, size) {
  getArray(publicAPI, model, fieldNames);
  setArray(publicAPI, model, fieldNames, size);
}

// ----------------------------------------------------------------------------
// vtkAlgorithm: setInputData(), setInputConnection(), getOutput(), getOutputPort()
// ----------------------------------------------------------------------------

export function algo(publicAPI, model, numberOfInputs, numberOfOutputs) {
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

  // Methods
  function setInputData(dataset, port = 0) {
    if (model.deleted) {
      console.log('instance deleted - cannot call any method');
      return;
    }
    model.inputData[port] = dataset;
    model.inputConnection[port] = null;
  }

  function getInputData(port = 0) {
    if (model.inputConnection[port]) {
      model.inputData[port] = model.inputConnection[port]();
    }
    return model.inputData[port];
  }

  function setInputConnection(outputPort, port = 0) {
    if (model.deleted) {
      console.log('instance deleted - cannot call any method');
      return;
    }
    model.inputData[port] = null;
    model.inputConnection[port] = outputPort;
  }

  function getOutputData(port = 0) {
    if (model.deleted) {
      console.log('instance deleted - cannot call any method');
      return null;
    }
    if (publicAPI.shouldUpdate()) {
      // console.log('update filter', publicAPI.getClassName());
      publicAPI.update();
    }
    return model.output[port];
  }

  publicAPI.shouldUpdate = () => {
    const localMTime = publicAPI.getMTime();
    let count = numberOfOutputs;
    while (count--) {
      if (!model.output[count] || model.output[count].getMTime() < localMTime) {
        return true;
      }
    }

    count = numberOfInputs;
    while (count--) {
      if (model.inputConnection[count] && model.inputConnection[count].filter.shouldUpdate()) {
        return true;
      }
    }

    const minOutputMTime = Math.min(...model.output.filter(i => !!i).map(i => i.getMTime()));
    count = numberOfInputs;
    while (count--) {
      if (publicAPI.getInputData(count) && publicAPI.getInputData(count).getMTime() > minOutputMTime) {
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
  if (numberOfInputs) {
    // Reserve inputs
    let count = numberOfInputs;
    while (count--) {
      model.inputData.push(null);
      model.inputConnection.push(null);
    }

    // Expose public methods
    publicAPI.setInputData = setInputData;
    publicAPI.setInputConnection = setInputConnection;
    publicAPI.getInputData = getInputData;
  }

  if (numberOfOutputs) {
    publicAPI.getOutputData = getOutputData;
    publicAPI.getOutputPort = getOutputPort;
  }

  publicAPI.update = () => {
    const ins = [];
    if (numberOfInputs) {
      let count = 0;
      while (count < numberOfInputs) {
        ins[count] = publicAPI.getInputData(count);
        count++;
      }
    }
    if (publicAPI.shouldUpdate()) {
      publicAPI.requestData(ins, model.output);
    }
  };

  publicAPI.getNumberOfInputPorts = () => numberOfInputs;
  publicAPI.getNumberOfOutputPorts = () => numberOfOutputs;

  publicAPI.getInputArrayToProcess = (inputPort) => {
    const arrayDesc = model.inputArrayToProcess[inputPort];
    const ds = model.inputData[inputPort];
    if (arrayDesc && ds) {
      return ds[`get${arrayDesc.fieldAssociation}`]().getArray(arrayDesc.arrayName);
    }
    return null;
  };
  publicAPI.setInputArrayToProcess = (inputPort, arrayName, fieldAssociation, attributeType = 'Scalars') => {
    while (model.inputArrayToProcess.length < inputPort) {
      model.inputArrayToProcess.push(null);
    }
    model.inputArrayToProcess[inputPort] = { arrayName, fieldAssociation, attributeType };
  };
}

// ----------------------------------------------------------------------------
// Event handling: onXXX(callback), invokeXXX(args...)
// ----------------------------------------------------------------------------

export function event(publicAPI, model, eventName) {
  const callbacks = [];
  const previousDelete = publicAPI.delete;

  function off(index) {
    callbacks[index] = null;
  }

  function on(index) {
    function unsubscribe() {
      off(index);
    }
    return Object.freeze({ unsubscribe });
  }

  publicAPI[`invoke${capitalize(eventName)}`] = (...args) => {
    if (model.deleted) {
      console.log('instance deleted - cannot call any method');
      return;
    }

    callbacks.forEach(callback => callback && callback.apply(publicAPI, args));
  };

  publicAPI[`on${capitalize(eventName)}`] = (callback) => {
    if (model.deleted) {
      console.log('instance deleted - cannot call any method');
      return null;
    }

    const index = callbacks.length;
    callbacks.push(callback);
    return on(index);
  };

  publicAPI.delete = () => {
    previousDelete();
    callbacks.forEach((el, index) => off(index));
  };
}

// ----------------------------------------------------------------------------
// newInstance
// ----------------------------------------------------------------------------

export function newInstance(extend, className) {
  const constructor = (initialValues = {}) => {
    const model = {};
    const publicAPI = {};
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

export function chain(...fn) {
  return (...args) => fn.filter(i => !!i).forEach(i => i(...args));
}

// ----------------------------------------------------------------------------
// Loggins function calls
// ----------------------------------------------------------------------------

const loggerFunctions = {
  debug: console.debug,
  error: console.error,
  warn: console.warn,
};

function noOp() {}

export function setLoggerFunction(name, fn) {
  if (loggerFunctions[name]) {
    loggerFunctions[name] = fn || noOp;
  }
}

export function vtkDebugMacro(...args) {
  loggerFunctions.debug(...args);
}

export function vtkErrorMacro(...args) {
  loggerFunctions.error(...args);
}

export function vtkWarningMacro(...args) {
  loggerFunctions.warn(...args);
}

// ----------------------------------------------------------------------------
// Default export
// ----------------------------------------------------------------------------

export default {
  getCurrentGlobalMTime,
  capitalize,
  enumToString,
  getStateArrayMapFunc,
  obj,
  get,
  set,
  setGet,
  getArray,
  setArray,
  setGetArray,
  algo,
  event,
  newInstance,
  chain,
  setLoggerFunction,
  vtkDebugMacro,
  vtkErrorMacro,
  vtkWarningMacro,
};
