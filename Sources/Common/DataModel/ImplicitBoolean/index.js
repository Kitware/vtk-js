import macro from 'vtk.js/Sources/macro';
import Constants from 'vtk.js/Sources/Common/DataModel/ImplicitBoolean/Constants';

const { Operation } = Constants;

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// vtkImplicitBoolean methods
// ----------------------------------------------------------------------------

function vtkImplicitBoolean(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImplicitBoolean');

  // Capture "parentClass" api for internal use
  const superClass = Object.assign({}, publicAPI);

  publicAPI.getMTime = () => {
    let mTime = superClass.getMTime();
    if (!model.functions || model.functions.length <= 0) {
      return mTime;
    }

    for (let i = 0; i < model.functions.length; ++i) {
      mTime = Math.max(mTime, model.functions[i].getMTime());
    }
    return mTime;
  };

  publicAPI.getOperationAsString = () =>
    macro.enumToString(Operation, model.operation);

  publicAPI.setOperationToUnion = () => publicAPI.setOperation(0);
  publicAPI.setOperationToIntersection = () => publicAPI.setOperation(1);
  publicAPI.setOperationToDifference = () => publicAPI.setOperation(2);

  publicAPI.getFunctions = () => model.functions;
  publicAPI.hasFunction = (f) =>
    !!model.functions.filter((item) => item === f).length;
  publicAPI.addFunction = (f) => {
    if (f && !publicAPI.hasFunction(f)) {
      model.functions = model.functions.concat(f);
    }
  };

  publicAPI.removeFunction = (f) => {
    const newFunctionList = model.functions.filter((item) => item !== f);
    if (model.functions.length !== newFunctionList.length) {
      model.functions = newFunctionList;
    }
  };

  publicAPI.removeAllFunctions = () => {
    model.functions = [];
  };

  publicAPI.evaluateFunction = (xyz) => {
    let value = 0.0;
    if (model.functions.length <= 0) {
      return value;
    }

    if (model.operation === Operation.UNION) {
      value = Number.MAX_VALUE;
      for (let i = 0; i < model.functions.length; ++i) {
        const f = model.functions[i];
        const v = f.evaluateFunction(xyz);
        if (v < value) {
          value = v;
        }
      }
    } else if (model.operation === Operation.INTERSECTION) {
      value = -Number.MAX_VALUE;
      for (let i = 0; i < model.functions.length; ++i) {
        const f = model.functions[i];
        const v = f.evaluateFunction(xyz);
        if (v > value) {
          value = v;
        }
      }
    } else {
      const firstF = model.functions[0];
      value = firstF.evaluateFunction(xyz);
      for (let i = 1; i < model.functions.length; ++i) {
        const f = model.functions[i];
        const v = -1.0 * f.evaluateFunction(xyz);
        if (v > value) {
          value = v;
        }
      }
    }
    return value;
  };

  publicAPI.evaluateGradient = (xyz) => {
    const t =
      model.axis[0] * (xyz[0] - model.center[0]) +
      model.axis[1] * (xyz[1] - model.center[1]) +
      model.axis[2] * (xyz[2] - model.center[2]);

    const cp = new Float32Array(3);
    cp[0] = model.center[0] + t * model.axis[0];
    cp[1] = model.center[1] + t * model.axis[1];
    cp[2] = model.center[2] + t * model.axis[2];

    const retVal = [
      2.0 * (xyz[0] - cp[0]),
      2.0 * (xyz[1] - cp[1]),
      2.0 * (xyz[2] - cp[2]),
    ];
    return retVal;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
const DEFAULT_VALUES = {
  operation: 0,
  functions: [],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);

  macro.setGet(publicAPI, model, ['operation']);

  vtkImplicitBoolean(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImplicitBoolean');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, Constants);
