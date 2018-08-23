import macro from 'vtk.js/Sources/macro';
import vtkWidgetState from 'vtk.js/Sources/Interaction/Widgets2/WidgetState';
import vtkSphereState from 'vtk.js/Sources/Interaction/Widgets2/SphereState';
import vtkCubeState from 'vtk.js/Sources/Interaction/Widgets2/CubeState';

// ----------------------------------------------------------------------------
// Global type lookup map
// ----------------------------------------------------------------------------

const STATE_TYPES = {
  sphere: vtkSphereState,
  cube: vtkCubeState,
};

// ----------------------------------------------------------------------------

class Builder {
  constructor() {
    this.publicAPI = {};
    this.model = {};

    vtkWidgetState.extend(this.publicAPI, this.model);
  }

  addState({ labels, type, name, initialValues }) {
    if (STATE_TYPES[type]) {
      const instance = STATE_TYPES[type].newInstance(initialValues);
      this.model[name] = instance;
      this.publicAPI.bindState(instance, labels);
      macro.setGet(this.publicAPI, this.model, [name]);
    }
    return this;
  }

  build() {
    return Object.freeze(this.publicAPI);
  }
}

// ----------------------------------------------------------------------------
// Public API
// ----------------------------------------------------------------------------

function createBuilder() {
  return new Builder();
}

function registerStateType(type, klass) {
  STATE_TYPES[type] = klass;
}

export default {
  createBuilder,
  registerStateType,
};
