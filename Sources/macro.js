// ----------------------------------------------------------------------------
// capitilze provided string
// ----------------------------------------------------------------------------

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ----------------------------------------------------------------------------
// vtkObject: modified(), onModified(callback), delete()
// ----------------------------------------------------------------------------

export function obj(publicAPI, model, type = 'vtkObject', implementations = []) {
  const callbacks = [];
  model.mtime = 1;

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

    ++model.mtime;
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

  publicAPI.isA = t => (type === t);

  publicAPI.getClassName = () => type;

  publicAPI.getImplements = map => {
    if (map) {
      return implementations.filter(name => !!map[name]);
    }
    return implementations;
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
    publicAPI[`get${capitalize(field)}`] = () => model[field];
  });
}

// ----------------------------------------------------------------------------
// setXXX: add setters
// ----------------------------------------------------------------------------

export function set(publicAPI, model, fieldNames) {
  function createSetter(field) {
    function setter(value) {
      if (model.deleted) {
        console.log('instance deleted - can not call any method');
        return;
      }

      if (model[field] !== value) {
        model[field] = value;
        publicAPI.modified();
      }
    }

    publicAPI[`set${capitalize(field)}`] = setter;
  }

  fieldNames.forEach(createSetter);
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
    publicAPI[`set${capitalize(field)}`] = array => {
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

  // Methods
  function setInputData(dataset, port = 0) {
    if (model.deleted) {
      console.log('instance deleted - can not call any method');
      return;
    }
    model.inputData[port] = dataset;
    model.inputConnection[port] = null;
  }

  function setInputConnection(outputPort, port = 0) {
    if (model.deleted) {
      console.log('instance deleted - can not call any method');
      return;
    }
    model.inputData[port] = null;
    model.inputConnection[port] = outputPort;
  }

  function getOutput(port = 0) {
    if (model.deleted) {
      console.log('instance deleted - can not call any method');
      return null;
    }
    publicAPI.update();
    return model.output[port];
  }

  function getOutputPort(port = 0) {
    return () => getOutput(port);
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
  }

  if (numberOfOutputs) {
    publicAPI.getOutput = getOutput;
    publicAPI.getOutputPort = getOutputPort;
  }
}

// ----------------------------------------------------------------------------
// Event handling: onXXX(callback), fireXXX(args...)
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

  publicAPI[`fire${capitalize(eventName)}`] = (...args) => {
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
