import macro from 'vtk.js/Sources/macros';

import { PlaneNormal } from 'vtk.js/Sources/Interaction/Widgets/ResliceCursor/ResliceCursorActor/Constants';

// ----------------------------------------------------------------------------
// vtkResliceCursorPolyDataAlgorithm methods
// ----------------------------------------------------------------------------

function vtkResliceCursorPolyDataAlgorithm(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkResliceCursorPolyDataAlgorithm');

  const superClass = { ...publicAPI };

  publicAPI.setReslicePlaneNormalToXAxis = () => {
    publicAPI.setReslicePlaneNormal(PlaneNormal.XAxis);
  };

  publicAPI.setReslicePlaneNormalToYAxis = () => {
    publicAPI.setReslicePlaneNormal(PlaneNormal.YAxis);
  };

  publicAPI.setReslicePlaneNormalToZAxis = () => {
    publicAPI.setReslicePlaneNormal(PlaneNormal.ZAxis);
  };

  publicAPI.getCenterlineAxis1 = () => publicAPI.getOutputData(0);

  publicAPI.getCenterlineAxis2 = () => publicAPI.getOutputData(1);

  publicAPI.getAxis1 = () => {
    if (model.reslicePlaneNormal === PlaneNormal.ZAxis) {
      return 1;
    }

    return 2;
  };

  publicAPI.getAxis2 = () => {
    if (model.reslicePlaneNormal === PlaneNormal.XAxis) {
      return 1;
    }

    return 0;
  };

  publicAPI.getPlaneAxis1 = () => {
    if (model.reslicePlaneNormal === PlaneNormal.XAxis) {
      return 1;
    }

    return 0;
  };

  publicAPI.getPlaneAxis2 = () => {
    if (model.reslicePlaneNormal === PlaneNormal.ZAxis) {
      return 1;
    }

    return 2;
  };

  publicAPI.getOtherPlaneForAxis = (p) => {
    for (let i = 0; i < 3; i++) {
      if (i !== p && i !== model.reslicePlaneNormal) {
        return i;
      }
    }
    return -1;
  };

  publicAPI.getMTime = () => {
    let mTime = superClass.getMTime();

    if (model.resliceCursor) {
      const time = model.resliceCursor.getMTime();

      if (time > mTime) {
        mTime = time;
      }
    }

    return mTime;
  };

  publicAPI.requestData = (inData, outData) => {
    if (!model.resliceCursor) {
      return;
    }

    // Cut the reslice cursor with the plane on which we are viewing.
    const axis1 = publicAPI.getAxis1();
    outData[0] = model.resliceCursor.getCenterlineAxisPolyData(axis1);

    const axis2 = publicAPI.getAxis2();
    outData[1] = model.resliceCursor.getCenterlineAxisPolyData(axis2);
  };

  //----------------------------------------------------------------------------
  // Public API methods
  //----------------------------------------------------------------------------
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  reslicePlaneNormal: PlaneNormal.XAxis,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  model.resliceCursor = null;

  macro.obj(publicAPI, model);
  macro.algo(publicAPI, model, 0, 2);
  macro.setGet(publicAPI, model, ['reslicePlaneNormal', 'resliceCursor']);

  // Object methods
  vtkResliceCursorPolyDataAlgorithm(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkResliceCursorPolyDataAlgorithm'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
