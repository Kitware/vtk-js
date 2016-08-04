import vtk from './vtk';

let globalMTime = 0;
// ----------------------------------------------------------------------------
// capitilze provided string
// ----------------------------------------------------------------------------

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function enumToString(e, value) {
  return Object.keys(e).find(key => e[key] === value);
}

// ----------------------------------------------------------------------------
// vtkObject: modified(), onModified(callback), delete()
// ----------------------------------------------------------------------------

export function obj(publicAPI, model = {}) {
  const callbacks = [];
  model.mtime = model.mtime || globalMTime;
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

  publicAPI.modified = () => {
    if (model.deleted) {
      console.log('instance deleted - can not call any method');
      return;
    }

    model.mtime = ++globalMTime;
    callbacks.forEach(callback => callback && callback(publicAPI));
  };

  publicAPI.onModified = callback => {
    if (model.deleted) {
      console.log('instance deleted - can not call any method');
      return null;
    }

    const index = callbacks.length;
    callbacks.push(callback);
    return on(index);
  };

  publicAPI.getMTime = () => model.mtime;

  publicAPI.isA = className => (model.classHierarchy.indexOf(className) !== -1);

  publicAPI.getClassName = () => model.classHierarchy.slice(-1)[0];

  publicAPI.set = (map = {}) => {
    Object.keys(map).forEach(name => {
      if (Array.isArray(map[name])) {
        publicAPI[`set${capitalize(name)}`](...map[name]);
      } else if (publicAPI[`set${capitalize(name)}`]) {
        publicAPI[`set${capitalize(name)}`](map[name]);
      } else {
        // Set data on model directly
        if (['mtime'].indexOf(name) === -1) {
          console.log('Warning: Set value to model directly', name, map[name]);
        }
        model[name] = map[name];
      }
    });
  };

  publicAPI.get = (...list) => {
    if (!list) {
      return model;
    }
    const subset = {};
    list.forEach(name => {
      subset[name] = model[name];
    });
    return subset;
  };

  publicAPI.delete = () => {
    Object.keys(model).forEach(field => delete model[field]);
    callbacks.forEach((el, index) => off(index));

    // Flag the instance beeing deleted
    model.deleted = true;
  };
}

// ----------------------------------------------------------------------------
// getXXX: add getters
// ----------------------------------------------------------------------------

export function get(publicAPI, model, fieldNames) {
  fieldNames.forEach(field => {
    if (typeof field === 'object') {
      publicAPI[`get${capitalize(field.name)}`] = () => model[field];
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
    return value => {
      if (typeof value === 'string') {
        if (model.enum[value] !== undefined) {
          if (model[field.name] !== model.enum[value]) {
            model[field.name] = model.enum[value];
            publicAPI.modified();
            return true;
          }
          return false;
        }
        console.log('Set Enum with invalid argument', field, value);
        return null;
      }
      if (typeof value === 'number') {
        if (model[field.name] !== value) {
          if (Object.keys(field.enum).map(key => field.enum[key]).indexOf(value) !== -1) {
            model[field.name] = value;
            publicAPI.modified();
            return true;
          }
          console.log('Set Enum outside range', field, value);
        }
        return false;
      }
      console.log('Set Enum with invalid argument (String/Number)', field, value);
      return null;
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
  }
  return function getSetter(publicAPI, model) {
    return function setter(value) {
      if (model.deleted) {
        console.log('instance deleted - can not call any method');
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
  fields.forEach(field => {
    publicAPI[`set${capitalize(field)}`] = findSetter(field)(publicAPI, model);
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
  fieldNames.forEach(field => {
    publicAPI[`get${capitalize(field)}`] = () => [].concat(model[field]);
  });
}

// ----------------------------------------------------------------------------
// setXXX: add setter for object of type array
// ----------------------------------------------------------------------------

export function setArray(publicAPI, model, fieldNames, size) {
  fieldNames.forEach(field => {
    publicAPI[`set${capitalize(field)}`] = (...array) => {
      if (model.deleted) {
        console.log('instance deleted - can not call any method');
        return;
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
  model.inputData = [];
  model.inputConnection = [];
  model.output = [];
  model.inputArrayToProcess = [];

  // Methods
  function setInputData(dataset, port = 0) {
    if (model.deleted) {
      console.log('instance deleted - can not call any method');
      return;
    }
    model.inputData[port] = dataset;
    model.inputConnection[port] = null;
  }

  function getInputData(port = 0) {
    if (!model.inputData[port] && model.inputConnection[port]) {
      model.inputData[port] = model.inputConnection[port]();
    }
    return model.inputData[port];
  }

  function setInputConnection(outputPort, port = 0) {
    if (model.deleted) {
      console.log('instance deleted - can not call any method');
      return;
    }
    model.inputData[port] = null;
    model.inputConnection[port] = outputPort;
  }

  function getOutputData(port = 0) {
    if (model.deleted) {
      console.log('instance deleted - can not call any method');
      return null;
    }
    publicAPI.update();
    return model.output[port];
  }

  function getOutputPort(port = 0) {
    return () => getOutputData(port);
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
        if (model.inputConnection[count]) {
          model.inputData[count] = null;
        }
        ins[count] = publicAPI.getInputData(count);
        count++;
      }
    }
    publicAPI.requestData(ins, model.output);
  };

  publicAPI.getNumberOfInputPorts = () => numberOfInputs;
  publicAPI.getNumberOfOutputPorts = () => numberOfOutputs;

  publicAPI.getInputArrayToProcess = inputPort => {
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
      console.log('instance deleted - can not call any method');
      return;
    }

    callbacks.forEach(callback => callback && callback.apply(publicAPI, args));
  };

  publicAPI[`on${capitalize(eventName)}`] = callback => {
    if (model.deleted) {
      console.log('instance deleted - can not call any method');
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

