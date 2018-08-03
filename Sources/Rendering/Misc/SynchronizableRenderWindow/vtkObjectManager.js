import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCamera from 'vtk.js/Sources/Rendering/Core/Camera';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkLight from 'vtk.js/Sources/Rendering/Core/Light';
import vtkLookupTable from 'vtk.js/Sources/Common/Core/LookupTable';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';

// ----------------------------------------------------------------------------
// Some internal, module-level variables and methods
// ----------------------------------------------------------------------------

const TYPE_HANDLERS = {};
const WRAPPED_ID_RE = /instance:\${([^}]+)}/;
const WRAP_ID = (id) => `instance:$\{${id}}`;
const ONE_TIME_INSTANCE_TRACKERS = {};
const SKIPPED_INSTANCE_IDS = [];
const EXCLUDE_INSTANCE_MAP = {};

function extractCallArgs(synchronizerContext, argList) {
  return argList.map((arg) => {
    const m = WRAPPED_ID_RE.exec(arg);
    if (m) {
      return synchronizerContext.getInstance(m[1]);
    }
    return arg;
  });
}

function extractInstanceIds(argList) {
  return argList
    .map((arg) => WRAPPED_ID_RE.exec(arg))
    .filter((m) => m)
    .map((m) => m[1]);
}

function extractDependencyIds(state, depList = []) {
  if (state.dependencies) {
    state.dependencies.forEach((childState) => {
      depList.push(childState.id);
      extractDependencyIds(childState, depList);
    });
  }
  return depList;
}

// ----------------------------------------------------------------------------
// Static methods for export
// ----------------------------------------------------------------------------

function update(type, instance, props, context) {
  if (!instance) {
    return;
  }
  const handler = TYPE_HANDLERS[type];
  if (handler && handler.update) {
    handler.update(instance, props, context);
  } else {
    console.log('no updater for', type);
  }
}

function build(type, initialProps = {}) {
  const handler = TYPE_HANDLERS[type];

  if (handler && handler.build) {
    return handler.build(initialProps);
  }

  console.log('No builder for', type);
  return null;
}

function setTypeMapping(type, buildFn = null, updateFn = null) {
  if (!build && !update) {
    delete TYPE_HANDLERS[type];
    return;
  }

  TYPE_HANDLERS[type] = { build: buildFn, update: updateFn };
}

function excludeInstance(type, propertyName, propertyValue) {
  EXCLUDE_INSTANCE_MAP[type] = {
    key: propertyName,
    value: propertyValue,
  };
}

function getSupportedTypes() {
  return Object.keys(TYPE_HANDLERS);
}

function clearTypeMapping() {
  Object.keys(TYPE_HANDLERS).forEach((key) => {
    delete TYPE_HANDLERS[key];
  });
}

function updateRenderWindow(instance, props, context) {
  return update('vtkRenderWindow', instance, props, context);
}

function clearAllOneTimeUpdaters() {
  Object.keys(ONE_TIME_INSTANCE_TRACKERS).forEach((key) => {
    delete ONE_TIME_INSTANCE_TRACKERS[key];
  });
}

function clearOneTimeUpdaters(...ids) {
  if (ids.length === 0) {
    return clearAllOneTimeUpdaters();
  }

  let array = ids;
  // allow an array passed as a single arg.
  if (array.length === 1 && Array.isArray(array[0])) {
    array = array[0];
  }
  array.forEach((instanceId) => {
    delete ONE_TIME_INSTANCE_TRACKERS[instanceId];
  });
  return array;
}

function notSkippedInstance(call) {
  if (call[1].length === 1) {
    return SKIPPED_INSTANCE_IDS.indexOf(call[1][0]) === -1;
  }
  let keep = false;
  for (let i = 0; i < call[1]; i++) {
    keep = keep || SKIPPED_INSTANCE_IDS.indexOf(call[1][i]) === -1;
  }
  return keep;
}

// ----------------------------------------------------------------------------
// Updater functions
// ----------------------------------------------------------------------------

function genericUpdater(instance, state, context) {
  context.start();

  // First update our own properties
  instance.set(state.properties);

  // Now handle dependencies
  if (state.dependencies) {
    state.dependencies.forEach((childState) => {
      const { id, type } = childState;

      if (EXCLUDE_INSTANCE_MAP[type]) {
        const { key, value } = EXCLUDE_INSTANCE_MAP[type];
        if (!key || childState.properties[key] === value) {
          SKIPPED_INSTANCE_IDS.push(WRAP_ID(id));
          return;
        }
      }

      let childInstance = context.getInstance(id);
      if (!childInstance) {
        childInstance = build(type, { managedInstanceId: id });
        context.registerInstance(id, childInstance);
      }
      update(type, childInstance, childState, context);
    });
  }

  if (state.calls) {
    state.calls
      .filter(notSkippedInstance)
      .forEach((call) =>
        instance[call[0]].apply(null, extractCallArgs(context, call[1]))
      );
  }

  context.end();
}

// ----------------------------------------------------------------------------

function oneTimeGenericUpdater(instance, state, context) {
  if (!ONE_TIME_INSTANCE_TRACKERS[state.id]) {
    genericUpdater(instance, state, context);
  }

  ONE_TIME_INSTANCE_TRACKERS[state.id] = true;
}

// ----------------------------------------------------------------------------

function rendererUpdater(instance, state, context) {
  // Don't do start/end on the context here because we don't need to hold up
  // rendering for the book-keeping we do after the genericUpdater finishes.

  // First allow generic update process to happen as usual
  genericUpdater(instance, state, context);

  // Any view props that were removed in the previous phase, genericUpdater(...),
  // may have left orphaned children in our instance cache.  Below is where those
  // refs can be tracked in the first place, and then later removed as necessary
  // to allow garbage collection.

  // In some cases, seemingly with 'vtkColorTransferFunction', the server side
  // object id may be conserved even though the actor and mapper containing or
  // using it were deleted.  In this case we must not unregister an instance
  // which is depended upon by an incoming actor just because it was also
  // depended upon by an outgoing one.
  const allActorsDeps = new Set();

  // Here we gather the list of dependencies (instance ids) for each view prop and
  // store them on the instance, in case that view prop is later removed.
  if (state.dependencies) {
    state.dependencies.forEach((childState) => {
      const viewPropInstance = context.getInstance(childState.id);
      if (viewPropInstance) {
        const flattenedDepIds = extractDependencyIds(childState);
        viewPropInstance.set({ flattenedDepIds }, true);
        flattenedDepIds.forEach((depId) => allActorsDeps.add(depId));
      }
    });
  }

  // Look for 'removeViewProp' calls and clean up references to dependencies of
  // those view props.
  const unregisterCandidates = new Set();

  if (state.calls) {
    state.calls
      .filter(notSkippedInstance)
      .filter((call) => call[0] === 'removeViewProp')
      .forEach((call) => {
        // extract any ids associated with a 'removeViewProp' call (though really there
        // should just be a single one), and use them to build a flat list of all
        // representation dependency ids which we can then use our synchronizer context
        // to unregister
        extractInstanceIds(call[1]).forEach((vpId) => {
          const deps = context.getInstance(vpId).get('flattenedDepIds')
            .flattenedDepIds;
          if (deps) {
            // Consider each dependency for unregistering
            deps.forEach((depId) => unregisterCandidates.add(depId));
          }
          // Consider the viewProp itself for unresistering
          unregisterCandidates.add(vpId);
        });
      });
  }

  // Now unregister any instances that are no longer needed
  const idsToUnregister = [...unregisterCandidates].filter(
    (depId) => !allActorsDeps.has(depId)
  );
  idsToUnregister.forEach((depId) => context.unregisterInstance(depId));
}

// ----------------------------------------------------------------------------

function vtkRenderWindowUpdater(instance, state, context) {
  // For each renderer we may be removing from this render window, we should first
  // remove all of the renderer's view props, then have the render window re-render
  // itself.  This will clear the screen, at which point we can go about the normal
  // updater process.
  if (state.calls) {
    state.calls
      .filter(notSkippedInstance)
      .filter((call) => call[0] === 'removeRenderer')
      .forEach((call) => {
        extractInstanceIds(call[1]).forEach((renId) => {
          const renderer = context.getInstance(renId);
          // Take brief detour through the view props to unregister the dependencies
          // of each one
          const viewProps = renderer.getViewProps();
          viewProps.forEach((viewProp) => {
            const deps = viewProp.get('flattenedDepIds').flattenedDepIds;
            if (deps) {
              deps.forEach((depId) => context.unregisterInstance(depId));
            }
            context.unregisterInstance(context.getInstanceId(viewProp));
          });
          // Now just remove all the view props
          renderer.removeAllViewProps();
        });
      });
  }

  instance.render();

  // Now just do normal update process
  genericUpdater(instance, state, context);
}

// ----------------------------------------------------------------------------

function colorTransferFunctionUpdater(instance, state, context) {
  context.start();
  const nodes = state.properties.nodes.map(
    ([x, r, g, b, midpoint, sharpness]) => ({ x, r, g, b, midpoint, sharpness })
  );
  instance.set(Object.assign({}, state.properties, { nodes }), true);
  instance.sortAndUpdateRange();
  instance.modified();
  context.end();
}

// ----------------------------------------------------------------------------

function polydataUpdater(instance, state, context) {
  context.start();
  const props = state.properties;
  const piecesToFetch = ['points', 'polys', 'verts', 'lines', 'strips'];
  let nbArrayToDownload = props.fields.length;
  const arraysToBind = [
    [instance.getPointData().removeAllArrays, []],
    [instance.getCellData().removeAllArrays, []],
  ];

  function validateDataset() {
    if (arraysToBind.length - 2 === nbArrayToDownload) {
      while (arraysToBind.length) {
        const [fn, args] = arraysToBind.shift();
        fn(...args);
      }
      instance.modified();
      context.end();
    }
  }

  // Fetch geometry
  piecesToFetch.forEach((arrayName) => {
    if (props[arrayName]) {
      nbArrayToDownload += 1;
      const arrayMetadata = props[arrayName];
      context
        .getArray(arrayMetadata.hash, arrayMetadata.dataType, context)
        .then(
          (values) => {
            arraysToBind.push([
              instance.get(arrayName)[arrayName].setData,
              [values, arrayMetadata.numberOfComponents],
            ]);
            validateDataset();
          },
          (error) => {
            console.log('error geometry fetching array', error);
          }
        );
    }
  });

  // Fetch needed data arrays...
  props.fields.forEach((arrayMetadata) => {
    context.getArray(arrayMetadata.hash, arrayMetadata.dataType, context).then(
      (values) => {
        const array = vtkDataArray.newInstance(
          Object.assign({ values }, arrayMetadata)
        );
        const regMethod = arrayMetadata.registration
          ? arrayMetadata.registration
          : 'addArray';
        arraysToBind.push([
          instance.get(arrayMetadata.location)[arrayMetadata.location][
            regMethod
          ],
          [array],
        ]);
        validateDataset();
      },
      (error) => {
        console.log('error field fetching array', error);
      }
    );
  });
}

// ----------------------------------------------------------------------------
// Construct the type mapping
// ----------------------------------------------------------------------------

const DEFAULT_MAPPING = {
  vtkCompositePolyDataMapper2: {
    build: vtkMapper.newInstance,
    update: genericUpdater,
  },
  vtkLookupTable: {
    build: vtkLookupTable.newInstance,
    update: genericUpdater,
  },
  vtkOpenGLProperty: {
    build: vtkProperty.newInstance,
    update: genericUpdater,
  },
  vtkOpenGLRenderer: {
    build: vtkRenderer.newInstance,
    update: rendererUpdater,
  },
  vtkOpenGLCamera: {
    build: vtkCamera.newInstance,
    update: oneTimeGenericUpdater,
  },
  vtkPolyData: {
    build: vtkPolyData.newInstance,
    update: polydataUpdater,
  },
  vtkPVDiscretizableColorTransferFunction: {
    build: vtkColorTransferFunction.newInstance,
    update: colorTransferFunctionUpdater,
  },
  vtkPVLODActor: {
    build: vtkActor.newInstance,
    update: genericUpdater,
  },
  vtkOpenGLActor: {
    build: vtkActor.newInstance,
    update: genericUpdater,
  },
  vtkRenderWindow: {
    build: vtkRenderWindow.newInstance,
    update: vtkRenderWindowUpdater,
  },
  vtkOpenGLLight: {
    build: vtkLight.newInstance,
    update: genericUpdater,
  },
  vtkPVLight: {
    build: vtkLight.newInstance,
    update: genericUpdater,
  },
};

function setDefaultMapping(reset = true) {
  if (reset) {
    clearTypeMapping();
  }

  Object.keys(DEFAULT_MAPPING).forEach((type) => {
    const mapping = DEFAULT_MAPPING[type];
    setTypeMapping(type, mapping.build, mapping.update);
  });
}

setDefaultMapping();

// Avoid handling any lights at the moment
EXCLUDE_INSTANCE_MAP.vtkOpenGLLight = {};
EXCLUDE_INSTANCE_MAP.vtkPVLight = {};

// ----------------------------------------------------------------------------
// Publicly exposed methods
// ----------------------------------------------------------------------------

export default {
  build,
  update,
  setTypeMapping,
  clearTypeMapping,
  getSupportedTypes,
  clearOneTimeUpdaters,
  updateRenderWindow,
  excludeInstance,
};
