import macro from 'vtk.js/Sources/macro';
import vtkSphereState from 'vtk.js/Sources/Interaction/Widgets2/SphereState';
import vtkWidgetState from 'vtk.js/Sources/Interaction/Widgets2/WidgetState';

const STATE_TYPES = {
  sphere: vtkSphereState,
};

class Builder {
  constructor() {
    this.publicAPI = {};
    this.model = {};

    vtkWidgetState.extend(this.publicAPI, this.model);
  }

  add(type, name, initialValues) {
    if (STATE_TYPES[type]) {
      const instance = STATE_TYPES[type].newInstance(initialValues);
      this.model[name] = instance;
      this.publicAPI.bindState(instance);
      macro.setGet(this.publicAPI, this.model, [name]);
    }
    return this;
  }

  build() {
    return Object.freeze(this.publicAPI);
  }
}

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
