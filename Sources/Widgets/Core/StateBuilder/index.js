import macro from 'vtk.js/Sources/macro';

import vtkWidgetState from 'vtk.js/Sources/Widgets/Core/WidgetState';

import bounds from 'vtk.js/Sources/Widgets/Core/StateBuilder/boundsMixin';
import color from 'vtk.js/Sources/Widgets/Core/StateBuilder/colorMixin';
import direction from 'vtk.js/Sources/Widgets/Core/StateBuilder/directionMixin';
import manipulator from 'vtk.js/Sources/Widgets/Core/StateBuilder/manipulatorMixin';
import origin from 'vtk.js/Sources/Widgets/Core/StateBuilder/originMixin';
import scale1 from 'vtk.js/Sources/Widgets/Core/StateBuilder/scale1Mixin';
import scale3 from 'vtk.js/Sources/Widgets/Core/StateBuilder/scale3Mixin';
import visible from 'vtk.js/Sources/Widgets/Core/StateBuilder/visibleMixin';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// Global type lookup map
// ----------------------------------------------------------------------------

const MIXINS = {
  bounds,
  color,
  direction,
  manipulator,
  origin,
  scale1,
  scale3,
  visible,
};

// ----------------------------------------------------------------------------

function newInstance(
  mixins,
  initialValues,
  publicAPI = {},
  model = {},
  skipWidgetState = false
) {
  if (!skipWidgetState) {
    vtkWidgetState.extend(publicAPI, model, initialValues);
  }

  for (let i = 0; i < mixins.length; i++) {
    const mixin = MIXINS[mixins[i]];
    if (mixin) {
      mixin.extend(publicAPI, model, initialValues);
    } else {
      vtkErrorMacro('Invalid mixin name:', mixins[i]);
    }
  }
  macro.safeArrays(model);

  return Object.freeze(publicAPI);
}

// ----------------------------------------------------------------------------

class Builder {
  constructor() {
    this.publicAPI = {};
    this.model = {};

    vtkWidgetState.extend(this.publicAPI, this.model);
  }

  addDynamicMixinState({ labels, mixins, name, initialValues }) {
    const listName = `${name}List`;
    this.model[listName] = [];
    // Create new Instance method
    this.publicAPI[`add${macro.capitalize(name)}`] = () => {
      const instance = newInstance(mixins, initialValues);
      this.publicAPI.bindState(instance, labels);
      this.model[listName].push(instance);
      this.publicAPI.modified();
      return instance;
    };
    this.publicAPI[`remove${macro.capitalize(name)}`] = (instanceOrIndex) => {
      let removeIndex = this.model[listName].indexOf(instanceOrIndex);
      if (removeIndex === -1 && instanceOrIndex < this.model[listName].length) {
        removeIndex = instanceOrIndex;
      }
      const instance = this.model[listName][removeIndex];
      if (instance) {
        this.publicAPI.unbindState(instance);
      }
      this.publicAPI.modified();
    };
    this.publicAPI[`get${macro.capitalize(name)}List`] = () =>
      this.model[listName];
    return this;
  }

  addStateFromMixin({ labels, mixins, name, initialValues }) {
    const instance = newInstance(mixins, initialValues);
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
    return this;
  }

  build(...mixins) {
    return newInstance(mixins, {}, this.publicAPI, this.model, true);
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
