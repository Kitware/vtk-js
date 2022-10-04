import macro from 'vtk.js/Sources/macros';

import vtkWidgetState from 'vtk.js/Sources/Widgets/Core/WidgetState';

import bounds from 'vtk.js/Sources/Widgets/Core/StateBuilder/boundsMixin';
import color from 'vtk.js/Sources/Widgets/Core/StateBuilder/colorMixin';
import corner from 'vtk.js/Sources/Widgets/Core/StateBuilder/cornerMixin';
import direction from 'vtk.js/Sources/Widgets/Core/StateBuilder/directionMixin';
import manipulator from 'vtk.js/Sources/Widgets/Core/StateBuilder/manipulatorMixin';
import name from 'vtk.js/Sources/Widgets/Core/StateBuilder/nameMixin';
import orientation from 'vtk.js/Sources/Widgets/Core/StateBuilder/orientationMixin';
import origin from 'vtk.js/Sources/Widgets/Core/StateBuilder/originMixin';
import scale1 from 'vtk.js/Sources/Widgets/Core/StateBuilder/scale1Mixin';
import scale3 from 'vtk.js/Sources/Widgets/Core/StateBuilder/scale3Mixin';
import text from 'vtk.js/Sources/Widgets/Core/StateBuilder/textMixin';
import visible from 'vtk.js/Sources/Widgets/Core/StateBuilder/visibleMixin';
import shape from 'vtk.js/Sources/Widgets/Core/StateBuilder/shapeMixin';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// Global type lookup map
// ----------------------------------------------------------------------------

const MIXINS = {
  bounds,
  color,
  corner,
  direction,
  manipulator,
  name,
  orientation,
  origin,
  scale1,
  scale3,
  text,
  visible,
  shape,
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
    // The root state should always have the bounds/placeWidget/widgetFactor
    bounds.extend(this.publicAPI, this.model);
  }

  /* eslint-disable no-shadow */
  addDynamicMixinState({ labels, mixins, name, initialValues }) {
    const listName = `${name}List`;
    this.model[listName] = [];
    // Create new Instance method
    this.publicAPI[`add${macro.capitalize(name)}`] = (values) => {
      const instance = newInstance(mixins, {
        ...initialValues,
        ...values,
      });
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
      this.model[listName].splice(removeIndex, 1);
      this.publicAPI.modified();
    };
    this.publicAPI[`get${macro.capitalize(name)}List`] = () =>
      this.model[listName].slice();
    this.publicAPI[`clear${macro.capitalize(name)}List`] = () => {
      while (this.model[listName].length) {
        const instance = this.model[listName].pop();
        if (instance) {
          this.publicAPI.unbindState(instance);
        }
      }
      this.publicAPI.modified();
    };
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
