import macro from 'vtk.js/Sources/macro';

import vtkWidgetState from 'vtk.js/Sources/Interaction/Widgets2/WidgetState';

import color from 'vtk.js/Sources/Interaction/Widgets2/StateBuilder/colorMixin';
import direction from 'vtk.js/Sources/Interaction/Widgets2/StateBuilder/directionMixin';
import origin from 'vtk.js/Sources/Interaction/Widgets2/StateBuilder/originMixin';
import scale1 from 'vtk.js/Sources/Interaction/Widgets2/StateBuilder/scale1Mixin';
import scale3 from 'vtk.js/Sources/Interaction/Widgets2/StateBuilder/scale3Mixin';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// Global type lookup map
// ----------------------------------------------------------------------------

const MIXINS = {
  color,
  direction,
  origin,
  scale1,
  scale3,
};

// ----------------------------------------------------------------------------

class Builder {
  constructor() {
    this.publicAPI = {};
    this.model = {};

    vtkWidgetState.extend(this.publicAPI, this.model);
  }

  addStateFromMixin({ labels, mixins, name, initialValues }) {
    const publicAPI = {};
    const model = {};

    vtkWidgetState.extend(publicAPI, model, initialValues);
    for (let i = 0; i < mixins.length; i++) {
      const mixin = MIXINS[mixins[i]];
      if (mixin) {
        mixin.extend(publicAPI, model, initialValues);
      } else {
        vtkErrorMacro('Invalid mixin name:', mixins[i]);
      }
    }
    macro.safeArrays(model);

    const instance = Object.freeze(publicAPI);
    this.model[name] = instance;
    this.publicAPI.bindState(instance, labels);
    macro.setGet(this.publicAPI, this.model, [name]);
    return this;
  }

  addStateFromInstance({ labels, name, instance }) {
    this.model[name] = instance;
    this.publicAPI.bindState(instance, labels);
    macro.setGet(this.publicAPI, this.model, [name]);
    return this;
  }

  addField({ name, initialValue }) {
    if (Array.isArray(initialValue)) {
      macro.setGetArray(
        this.publicAPI,
        this.model,
        [name],
        initialValue.length
      );
    } else {
      macro.setGet(this.publicAPI, this.model, [name]);
    }
    this.model[name] = initialValue;
  }

  build() {
    macro.safeArrays(this.model);
    return Object.freeze(this.publicAPI);
  }
}

// ----------------------------------------------------------------------------
// Public API
// ----------------------------------------------------------------------------

export function createBuilder() {
  return new Builder();
}

export default {
  createBuilder,
};
