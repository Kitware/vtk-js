import * as macro from 'vtk.js/Sources/macros';
import Base64 from 'vtk.js/Sources/Common/Core/Base64';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkObjectManager from './vtkObjectManager';

const SYNCHRONIZER_CONTEXTS = {};

// ----------------------------------------------------------------------------
// Static methods
// ----------------------------------------------------------------------------

function createArrayHandler() {
  const dataArrayCache = {};
  let arrayFetcher = null;

  function setFetchArrayFunction(fetcher) {
    arrayFetcher = fetcher;
  }

  function getArray(sha, dataType, context) {
    const arrayEntry = dataArrayCache[sha];
    if (arrayEntry) {
      arrayEntry.mtimes[context.getActiveViewId()] = context.getMTime();
      return new Promise((resolve, reject) => {
        resolve(arrayEntry.array);
      });
    }

    if (!arrayFetcher) {
      return Promise.reject(
        new Error(
          'No array fetcher found, please use "setArrayFetcher" to provide one'
        )
      );
    }

    return new Promise((resolve, reject) => {
      arrayFetcher(sha).then(
        (data) => {
          let buffer = data;
          if (typeof data === 'string') {
            buffer = Base64.toArrayBuffer(data);
          }
          if (buffer instanceof Blob) {
            const fileReader = new FileReader();
            fileReader.onload = () => {
              const array = macro.newTypedArray(dataType, fileReader.result);
              const mtimes = {
                [context.getActiveViewId()]: context.getMTime(),
              };
              dataArrayCache[sha] = { mtimes, array };
              resolve(array);
            };
            fileReader.readAsArrayBuffer(buffer);
          } else {
            const array = macro.newTypedArray(dataType, buffer);
            const mtimes = { [context.getActiveViewId()]: context.getMTime() };
            dataArrayCache[sha] = { mtimes, array };
            resolve(array);
          }
        },
        (error) => {
          console.log('Error getting data array:');
          console.log(error);
          reject(error);
        }
      );
    });
  }

  function emptyCachedArrays() {
    Object.keys(dataArrayCache).forEach((key) => {
      delete dataArrayCache[key];
    });
  }

  function freeOldArrays(threshold, context) {
    const mtimeThreshold = context.getMTime() - threshold;
    Object.keys(dataArrayCache)
      .filter((key) => dataArrayCache[key].mtimes[context.getActiveViewId()])
      .filter(
        (key) =>
          dataArrayCache[key].mtimes[context.getActiveViewId()] < mtimeThreshold
      )
      .forEach((key) => {
        delete dataArrayCache[key];
      });
  }

  return {
    setFetchArrayFunction,
    getArray,
    emptyCachedArrays,
    freeOldArrays,
  };
}

// ----------------------------------------------------------------------------

function createInstanceMap() {
  const instances = {};

  function getInstance(id) {
    return instances[id];
  }

  function getInstanceId(instance) {
    let instanceId = null;

    Object.keys(instances).forEach((id) => {
      if (instance === instances[id]) {
        instanceId = id;
      }
    });

    return instanceId;
  }

  function registerInstance(id, instance) {
    instances[id] = instance;
  }

  function unregisterInstance(id) {
    delete instances[id];
  }

  function emptyCachedInstances() {
    Object.keys(instances).forEach((key) => {
      delete instances[key];
    });
  }

  return {
    getInstance,
    getInstanceId,
    registerInstance,
    unregisterInstance,
    emptyCachedInstances,
  };
}

// ----------------------------------------------------------------------------

function createProgressHandler() {
  let readyCount = 0;
  const publicAPI = {
    start() {
      readyCount += 1;
      publicAPI.invokeProgressEvent(readyCount);
    },
    end() {
      readyCount -= 1;
      publicAPI.invokeProgressEvent(readyCount);
      if (readyCount === 0) {
        publicAPI.invokeProgressDone();
      }
    },
    resetProgress() {
      readyCount = 0;
    },
  };
  const model = {};
  macro.event(publicAPI, model, 'progressEvent');
  macro.event(publicAPI, model, 'progressDone');

  return publicAPI;
}

// ----------------------------------------------------------------------------

function createSceneMtimeHandler() {
  const mtimes = {};
  let activeViewId = 'default';

  function getMTime(viewId) {
    const key = viewId || activeViewId;
    return mtimes[key] || 1;
  }

  function incrementMTime(viewId) {
    const key = viewId || activeViewId;
    if (!mtimes[key]) {
      mtimes[key] = 1;
    }
    mtimes[key] += 1;
  }

  function setActiveViewId(viewId) {
    activeViewId = viewId;
  }

  function getActiveViewId() {
    return activeViewId;
  }

  return { getMTime, incrementMTime, setActiveViewId, getActiveViewId };
}

// ----------------------------------------------------------------------------

function getSynchronizerContext(name = 'default') {
  let ctx = SYNCHRONIZER_CONTEXTS[name];
  if (!ctx) {
    ctx = {
      ...createArrayHandler(),
      ...createInstanceMap(),
      ...createProgressHandler(),
      ...createSceneMtimeHandler(),
    };
    SYNCHRONIZER_CONTEXTS[name] = ctx;
  }
  return ctx;
}

// ----------------------------------------------------------------------------

function setSynchronizerContext(name, ctx) {
  SYNCHRONIZER_CONTEXTS[name] = ctx;
}

// ----------------------------------------------------------------------------

function createSyncFunction(renderWindow, synchronizerContext) {
  let lastMtime = -1;
  let gcThreshold = 100;

  const getManagedInstanceId = (instance) =>
    instance.get('managedInstanceId').managedInstanceId;
  const getManagedInstanceIds = () =>
    macro.traverseInstanceTree(renderWindow, getManagedInstanceId);

  function clearOneTimeUpdaters() {
    vtkObjectManager.clearOneTimeUpdaters(getManagedInstanceIds());
  }

  function setSynchronizedViewId(synchronizedViewId) {
    renderWindow.set({ synchronizedViewId }, true, true);
  }

  function getSynchronizedViewId() {
    return renderWindow.get('synchronizedViewId').synchronizedViewId;
  }

  function updateGarbageCollectorThreshold(v) {
    gcThreshold = v;
  }

  function synchronize(state) {
    if (!getSynchronizedViewId()) {
      setSynchronizedViewId(state.id);
    }
    const mtime = state.mtime || 0;
    if (getSynchronizedViewId() === state.id && lastMtime < mtime) {
      return new Promise((resolve, reject) => {
        const subscription = synchronizerContext.onProgressDone(() => {
          subscription.unsubscribe();
          renderWindow.render();
          resolve(true);
        });
        lastMtime = mtime;
        synchronizerContext.setActiveViewId(state.id);
        synchronizerContext.incrementMTime();
        vtkObjectManager.updateRenderWindow(
          renderWindow,
          state,
          synchronizerContext
        );
        synchronizerContext.freeOldArrays(gcThreshold, synchronizerContext);
      });
    }
    return Promise.resolve(false);
  }

  return {
    synchronize,
    setSynchronizedViewId,
    getSynchronizedViewId,
    updateGarbageCollectorThreshold,
    getManagedInstanceIds,
    clearOneTimeUpdaters,
  };
}

// ----------------------------------------------------------------------------
// vtkSynchronizableRenderWindow methods
// ----------------------------------------------------------------------------

function vtkSynchronizableRenderWindow(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSynchronizableRenderWindow');

  if (!model.synchronizerContext) {
    model.synchronizerContext = getSynchronizerContext(
      model.synchronizerContextName
    );
  }

  const addOn = createSyncFunction(publicAPI, model.synchronizerContext);

  Object.keys(addOn).forEach((methodName) => {
    if (publicAPI[methodName]) {
      publicAPI[methodName] = macro.chain(
        publicAPI[methodName],
        addOn[methodName]
      );
    } else {
      publicAPI[methodName] = addOn[methodName];
    }
  });
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

export const DEFAULT_VALUES = {
  synchronizerContextName: 'default',
  synchronizerContext: null,
  synchronizedViewId: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  vtkRenderWindow.extend(publicAPI, model);
  macro.get(publicAPI, model, ['synchronizerContext']);

  // Object methods
  vtkSynchronizableRenderWindow(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkSynchronizableRenderWindow'
);

// ----------------------------------------------------------------------------
// More Static methods
// ----------------------------------------------------------------------------

function decorate(renderWindow, name = 'default') {
  const addOn = createSyncFunction(renderWindow, getSynchronizerContext(name));
  return {
    ...addOn,
    ...renderWindow,
    delete: macro.chain(renderWindow.delete, addOn.delete),
  };
}

// ----------------------------------------------------------------------------

export default {
  newInstance,
  extend,
  getSynchronizerContext,
  setSynchronizerContext,
  decorate,
  createInstanceMap,
  createArrayHandler,
  createProgressHandler,
  createSceneMtimeHandler,
  vtkObjectManager,
};
