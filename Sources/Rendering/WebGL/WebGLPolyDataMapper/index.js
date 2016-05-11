import * as macro from '../../../macro';
import ViewNode from '../../SceneGraph/ViewNode';

// ----------------------------------------------------------------------------
// vtkWebGLPolyDataMapper methods
// ----------------------------------------------------------------------------

export function webGLPolyDataMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGLPolyDataMapper');

  // Builds myself.
  publicAPI.build = (prepass) => {
    if (prepass) {
      if (!model.renderable) {
        return;
      }
    }
  };

  // Renders myself
  publicAPI.render = (prepass) => {
    if (prepass) {
      // draw the polydata
    } else {
      // something
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, initialValues = {}) {
  const model = Object.assign(initialValues, DEFAULT_VALUES);

  // Inheritance
  ViewNode.extend(publicAPI, model);

  // Build VTK API
  macro.get(publicAPI, model, ['shaderCache']);

  // Object methods
  webGLPolyDataMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
