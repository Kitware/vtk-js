import vtk from './vtk';

let globalMTime = 0;

export const VOID = Symbol('void');

function getCurrentGlobalMTime() {
  return globalMTime;
}

// ----------------------------------------------------------------------------
// Loggins function calls
// ----------------------------------------------------------------------------
/* eslint-disable no-prototype-builtins                                      */

const fakeConsole = {};

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

global.console = window.console.hasOwnProperty('log')
  ? window.console
  : fakeConsole;

const loggerFunctions = {
  debug: noOp, // Don't print debug by default
  error: global.console.error || noOp,
  info: global.console.info || noOp,
  log: global.console.log || noOp,
  warn: global.console.warn || noOp,
};

export function setLoggerFunction(name, fn) {
  if (loggerFunctions[name]) {
    loggerFunctions[name] = fn || noOp;
  }
}

export function vtkLogMacro(...args) {
  loggerFunctions.log(...args);
}

export function vtkInfoMacro(...args) {
  loggerFunctions.info(...args);
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
// capitilze provided string
// ----------------------------------------------------------------------------

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ----------------------------------------------------------------------------
// Array helper
// ----------------------------------------------------------------------------

function safeArrays(model) {
  Object.keys(model).forEach((key) => {
    if (Array.isArray(model[key])) {
      model[key] = [].concat(model[key]);
    }
  });
}

// ----------------------------------------------------------------------------

function enumToString(e, value) {
  return Object.keys(e).find((key) => e[key] === value);
}

function getStateArrayMapFunc(item) {
  if (item.isA) {
    return item.getState();
  }
  return item;
}

// ----------------------------------------------------------------------------
// vtkObject: modified(), onModified(callback), delete()
// ----------------------------------------------------------------------------

export function obj(publicAPI = {}, model = {}) {
  // Ensure each instance as a unique ref of array
  safeArrays(model);

  const callbacks = [];
  model.mtime = Number.isInteger(model.mtime) ? model.mtime : ++globalMTime;
  model.classHierarchy = ['vtkObject'];

  function off(index) {
    callbacks[index] = null;
  }

  function on(index) {
    function unsubscribe() {
      off(index);
    }
    return Object.freeze({
      unsubscribe,
    });
  }

  publicAPI.isDeleted = () => !!model.deleted;

  publicAPI.modified = (otherMTime) => {
    if (model.deleted) {
      vtkErrorMacro('instance deleted - cannot call any method');
      return;
    }

    if (otherMTime && otherMTime < model.mtime) {
      return;
    }

    model.mtime = ++globalMTime;
    callbacks.forEach((callback) => callback && callback(publicAPI));
  };

  publicAPI.onModified = (callback) => {
    if (model.deleted) {
      vtkErrorMacro('instance deleted - cannot call any method');
      return null;
    }

    const index = callbacks.length;
    callbacks.push(callback);
    return on(index);
  };

  publicAPI.getMTime = () => model.mtime;

  publicAPI.isA = (className) => {
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

  publicAPI.set = (map = {}, noWarning = false, noFunction = false) => {
    let ret = false;
    Object.keys(map).forEach((name) => {
      const fn = noFunction ? null : publicAPI[`set${capitalize(name)}`];
      if (fn && Array.isArray(map[name])) {
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

  publicAPI.getReferenceByName = (val) => model[val];

  publicAPI.delete = () => {
    Object.keys(model).forEach((field) => delete model[field]);
    callbacks.forEach((el, index) => off(index));

    // Flag the instance being deleted
    model.deleted = true;
  };

  // Add serialization support
  publicAPI.getState = () => {
    const jsonArchive = Object.assign({}, model, {
      vtkClass: publicAPI.getClassName(),
    });

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
  publicAPI.shallowCopy = (other, debug = false) => {
    if (other.getClassName() !== publicAPI.getClassName()) {
      throw new Error(
        `Cannot ShallowCopy ${other.getClassName()} into ${publicAPI.getClassName()}`
      );
    }
    const otherModel = other.get();

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

function findSetter(field) {
  if (typeof field === 'object') {
    const fn = objectSetterMap[field.type];
    if (fn) {
      return (publicAPI, model) => fn(publicAPI, model, field);
    }

    vtkErrorMacro(`No setter for field ${field}`);
    throw new TypeError('No setter for field');
  }
  return function getSetter(publicAPI, model) {
    return function setter(value) {
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

export function set(publicAPI, model, fields) {
  fields.forEach((field) => {
    if (typeof field === 'object') {
      publicAPI[`set${capitalize(field.name)}`] = findSetter(field)(
        publicAPI,
        model
      );
    } else {
      publicAPI[`set${capitalize(field)}`] = findSetter(field)(
        publicAPI,
        model
      );
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
// getXXX: add getters for object of type array with copy to be safe
// getXXXByReference: add getters for object of type array without copy
// ----------------------------------------------------------------------------

export function getArray(publicAPI, model, fieldNames) {
  fieldNames.forEach((field) => {
    publicAPI[`get${capitalize(field)}`] = () => [].concat(model[field]);
    publicAPI[`get${capitalize(field)}ByReference`] = () => model[field];
  });
}

// ----------------------------------------------------------------------------
// setXXX: add setter for object of type array
// if 'defaultVal' is supplied, shorter arrays will be padded to 'size' with 'defaultVal'
// set...From: fast path to copy the content of an array to the current one without call to modified.
// ----------------------------------------------------------------------------

export function setArray(
  publicAPI,
  model,
  fieldNames,
  size,
  defaultVal = undefined
) {
  fieldNames.forEach((field) => {
    publicAPI[`set${capitalize(field)}`] = (...args) => {
      if (model.deleted) {
        vtkErrorMacro('instance deleted - cannot call any method');
        return false;
      }

      let array = args;
      // allow an array passed as a single arg.
      if (array.length === 1 && Array.isArray(array[0])) {
        /* eslint-disable prefer-destructuring */
        array = array[0];
        /* eslint-enable prefer-destructuring */
      }

      if (array.length !== size) {
        if (array.length < size && defaultVal !== undefined) {
          array = [].concat(array);
          while (array.length < size) array.push(defaultVal);
        } else {
          throw new RangeError('Invalid number of values for array setter');
        }
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

      if (changeDetected || model[field].length !== array.length) {
        model[field] = [].concat(array);
        publicAPI.modified();
      }
      return true;
    };

    publicAPI[`set${capitalize(field)}From`] = (otherArray) => {
      const target = model[field];
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
  publicAPI,
  model,
  fieldNames,
  size,
  defaultVal = undefined
) {
  getArray(publicAPI, model, fieldNames);
  setArray(publicAPI, model, fieldNames, size, defaultVal);
}

// ----------------------------------------------------------------------------
// vtkAlgorithm: setInputData(), setInputConnection(), getOutputData(), getOutputPort()
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

  // Cache the argument for later manipulation
  model.numberOfInputs = numberOfInputs;

  // Methods
  function setInputData(dataset, port = 0) {
    if (model.deleted) {
      vtkErrorMacro('instance deleted - cannot call any method');
      return;
    }
    if (port >= model.numberOfInputs) {
      let msg = `algorithm ${publicAPI.getClassName()} only has `;
      msg += `${model.numberOfInputs}`;
      msg += ' input ports. To add more input ports, use addInputData()';
      vtkErrorMacro(msg);
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
      model.inputData[port] = model.inputConnection[port]();
    }
    return model.inputData[port];
  }

  function setInputConnection(outputPort, port = 0) {
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

  function getInputConnection(port = 0) {
    return model.inputConnection[port];
  }

  function addInputConnection(outputPort) {
    if (model.deleted) {
      vtkErrorMacro('instance deleted - cannot call any method');
      return;
    }
    model.numberOfInputs++;
    setInputConnection(outputPort, model.numberOfInputs - 1);
  }

  function addInputData(dataset) {
    if (model.deleted) {
      vtkErrorMacro('instance deleted - cannot call any method');
      return;
    }
    model.numberOfInputs++;
    setInputData(dataset, model.numberOfInputs - 1);
  }

  function getOutputData(port = 0) {
    if (model.deleted) {
      vtkErrorMacro('instance deleted - cannot call any method');
      return null;
    }
    if (publicAPI.shouldUpdate()) {
      // console.log('update filter', publicAPI.getClassName());
      publicAPI.update();
    }
    return model.output[port];
  }

  publicAPI.shouldUpdate = () => {
    const localMTime = model.mtime;
    let count = numberOfOutputs;
    let minOutputMTime = Infinity;
    while (count--) {
      if (!model.output[count]) {
        return true;
      }
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
        model.inputConnection[count] &&
        model.inputConnection[count].filter.shouldUpdate()
      ) {
        return true;
      }
    }

    count = model.numberOfInputs;
    while (count--) {
      if (
        publicAPI.getInputData(count) &&
        publicAPI.getInputData(count).getMTime() > minOutputMTime
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
  publicAPI.getNumberOfOutputPorts = () => numberOfOutputs;

  publicAPI.getInputArrayToProcess = (inputPort) => {
    const arrayDesc = model.inputArrayToProcess[inputPort];
    const ds = model.inputData[inputPort];
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

export function event(publicAPI, model, eventName) {
  const callbacks = [];
  const previousDelete = publicAPI.delete;
  let curCallbackID = 1;

  function off(callbackID) {
    for (let i = 0; i < callbacks.length; ++i) {
      const [cbID] = callbacks[i];
      if (cbID === callbackID) {
        callbacks.splice(i, 1);
        return;
      }
    }
  }

  function on(callbackID) {
    function unsubscribe() {
      off(callbackID);
    }
    return Object.freeze({
      unsubscribe,
    });
  }

  function invoke() {
    if (model.deleted) {
      vtkErrorMacro('instance deleted - cannot call any method');
      return;
    }
    /* eslint-disable prefer-rest-params */
    for (let index = 0; index < callbacks.length; ++index) {
      const [, cb, priority] = callbacks[index];
      if (priority < 0) {
        setTimeout(() => cb.apply(publicAPI, arguments), 1 - priority);
      } else if (cb) {
        // Abort only if the callback explicitly returns false
        const continueNext = cb.apply(publicAPI, arguments);
        if (continueNext === EVENT_ABORT) {
          break;
        }
      }
    }
    /* eslint-enable prefer-rest-params */
  }

  publicAPI[`invoke${capitalize(eventName)}`] = invoke;

  publicAPI[`on${capitalize(eventName)}`] = (callback, priority = 0.0) => {
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
  return (...args) => fn.filter((i) => !!i).forEach((i) => i(...args));
}

// ----------------------------------------------------------------------------
// Some utility methods for vtk objects
// ----------------------------------------------------------------------------

export function isVtkObject(instance) {
  return instance && instance.isA && instance.isA('vtkObject');
}

export function traverseInstanceTree(
  instance,
  extractFunction,
  accumulator = [],
  visitedInstances = []
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
    const model = instance.get();
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

export function debounce(func, wait, immediate) {
  let timeout;
  return (...args) => {
    const context = this;
    const later = () => {
      timeout = null;
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

export function proxy(publicAPI, model) {
  const parentDelete = publicAPI.delete;

  // getProxyId
  model.proxyId = `${nextProxyId++}`;

  // ui handling
  model.ui = JSON.parse(JSON.stringify(model.ui || [])); // deep copy
  get(publicAPI, model, ['proxyId', 'proxyGroup', 'proxyName']);
  setGet(publicAPI, model, ['proxyManager']);

  // group properties
  const propertyMap = {};
  const groupChildrenNames = {};

  function registerProperties(descriptionList, currentGroupName) {
    if (!groupChildrenNames[currentGroupName]) {
      groupChildrenNames[currentGroupName] = [];
    }
    const childrenNames = groupChildrenNames[currentGroupName];

    for (let i = 0; i < descriptionList.length; i++) {
      childrenNames.push(descriptionList[i].name);
      propertyMap[descriptionList[i].name] = descriptionList[i];
      if (descriptionList[i].children && descriptionList[i].children.length) {
        registerProperties(
          descriptionList[i].children,
          descriptionList[i].name
        );
      }
    }
  }
  registerProperties(model.ui, ROOT_GROUP_NAME);

  publicAPI.updateUI = (ui) => {
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

  publicAPI.updateProxyProperty = (propertyName, propUI) => {
    const prop = propertyMap[propertyName];
    if (prop) {
      Object.assign(prop, propUI);
    }
  };

  // property link
  model.propertyLinkSubscribers = [];
  publicAPI.registerPropertyLinkForGC = (otherLink) => {
    model.propertyLinkSubscribers.push(otherLink);
  };

  publicAPI.gcPropertyLinks = () => {
    while (model.propertyLinkSubscribers.length) {
      model.propertyLinkSubscribers.pop().unbind(publicAPI);
    }
  };

  model.propertyLinkMap = {};
  publicAPI.getPropertyLink = (id) => {
    if (model.propertyLinkMap[id]) {
      return model.propertyLinkMap[id];
    }
    let value = null;
    const links = [];
    let count = 0;
    let updateInProgress = false;

    function update(source) {
      if (updateInProgress) {
        return;
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

      const newValue = sourceLink.instance[
        `get${capitalize(sourceLink.propertyName)}`
      ]();
      if (newValue !== value) {
        value = newValue;
        updateInProgress = true;
        while (needUpdate.length) {
          const linkToUpdate = needUpdate.pop();
          linkToUpdate.instance.set({
            [linkToUpdate.propertyName]: value,
          });
        }
        updateInProgress = false;
      }
    }

    function bind(instance, propertyName) {
      const subscription = instance.onModified(update);
      links.push({
        instance,
        propertyName,
        subscription,
      });
    }

    function unbind(instance, propertyName) {
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
        links.splice(indexToDelete.pop(), 1);
      }
    }

    function unsubscribe() {
      while (links.length) {
        links.pop().subscription.unsubscribe();
      }
    }

    const linkHandler = {
      bind,
      unbind,
      unsubscribe,
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
      const method = publicAPI[`get${capitalize(name)}`];
      const value = method ? method() : undefined;
      const prop = {
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

  publicAPI.getPropertyByName = (name) =>
    getProperties().find((p) => p.name === name);

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
    count = model.propertyLinkSubscribers.length;
    while (count--) {
      model.propertyLinkSubscribers[count].unbind(publicAPI);
    }
    parentDelete();
  };
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

export function proxyPropertyMapping(publicAPI, model, map) {
  const parentDelete = publicAPI.delete;
  const subscriptions = [];

  const propertyNames = Object.keys(map);
  let count = propertyNames.length;
  while (count--) {
    const propertyName = propertyNames[count];
    const { modelKey, property } = map[propertyName];
    const methodSrc = capitalize(property);
    const methodDst = capitalize(propertyName);
    publicAPI[`get${methodDst}`] = model[modelKey][`get${methodSrc}`];
    publicAPI[`set${methodDst}`] = model[modelKey][`set${methodSrc}`];
    subscriptions.push(model[modelKey].onModified(publicAPI.modified));
  }

  publicAPI.delete = () => {
    while (subscriptions.length) {
      subscriptions.pop().unsubscribe();
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
  publicAPI,
  model,
  state = {},
  defaults = {}
) {
  model.this = publicAPI;

  function applyState(map) {
    const modelKeys = Object.keys(map);
    let count = modelKeys.length;
    while (count--) {
      const modelKey = modelKeys[count];
      model[modelKey].set(map[modelKey]);
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
    publicAPI[`set${capitalize(key)}`] = (value) => {
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
// Default export
// ----------------------------------------------------------------------------

export default {
  EVENT_ABORT,
  VOID,
  algo,
  capitalize,
  chain,
  enumToString,
  event,
  get,
  getArray,
  getCurrentGlobalMTime,
  getStateArrayMapFunc,
  isVtkObject,
  newInstance,
  obj,
  safeArrays,
  set,
  setArray,
  setGet,
  setGetArray,
  setLoggerFunction,
  traverseInstanceTree,
  vtkDebugMacro,
  vtkErrorMacro,
  vtkInfoMacro,
  vtkLogMacro,
  vtkWarningMacro,
  debounce,
  proxy,
  proxyPropertyMapping,
  proxyPropertyState,
};
