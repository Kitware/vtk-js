import macro from 'vtk.js/Sources/macro';
import Constants from 'vtk.js/Sources/Interaction/UI/Slider/Constants';
import style from 'vtk.js/Sources/Interaction/UI/Slider/Slider.module.css';

// ----------------------------------------------------------------------------
// Helper methods
// ----------------------------------------------------------------------------

function findClosestValue(value, values) {
  let distance = Number.MAX_VALUE;
  let index = -1;
  let count = values.length;
  while (count--) {
    const dist = Math.abs(values[count] - value);
    if (dist < distance) {
      distance = dist;
      index = count;
    }
  }
  return index !== -1 ? values[index] : undefined;
}

// ----------------------------------------------------------------------------
// vtkSlider methods
// ----------------------------------------------------------------------------

function vtkSlider(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSlider');

  model.el = document.createElement('div');
  model.el.setAttribute('class', style.cursor);

  // --------------------------------------------------------------------------
  // Private methods
  // --------------------------------------------------------------------------

  function getDisplacementRatio() {
    return (
      ((model.containerSizes[1] - model.containerSizes[0]) *
        (model.value - model.values[0])) /
      (model.values[model.values.length - 1] - model.values[0])
    );
  }

  function updateCursorPosition() {
    if (!model.container) {
      return;
    }
    const cursorSize = model.containerSizes[0];
    const position = getDisplacementRatio();
    if (Number.isNaN(position) || Number.isNaN(cursorSize)) {
      return;
    }
    model.el.style.width = `${cursorSize}px`;
    model.el.style.height = `${cursorSize}px`;
    if (model.orientation === Constants.SliderOrientation.VERTICAL) {
      // VERTICAL
      model.el.style.left = '0';
      model.el.style.top = `${position}px`;
      model.el.style.cursor = 'row-resize';
    } else {
      // HORIZONTAL
      model.el.style.top = '0';
      model.el.style.left = `${position}px`;
      model.el.style.cursor = 'col-resize';
    }
  }

  // --------------------------------------------------------------------------

  let isDragging = false;
  let offset = 0;
  let ratio = 0;

  function handleDragEvents(enable) {
    const rootElm = document.querySelector('body');
    const method = enable ? 'addEventListener' : 'removeEventListener';

    /* eslint-disable no-use-before-define */
    rootElm[method]('mousemove', onMouseMove);
    rootElm[method]('mouseleave', onMouseOut);
    rootElm[method]('mouseup', onMouseUp);
    /* eslint-enable no-use-before-define */
  }

  function onMouseMove(e) {
    e.preventDefault();
    if (isDragging) {
      const newRatio =
        ratio +
        ((model.orientation ? e.clientX : e.clientY) - offset) /
          (model.containerSizes[1] - model.containerSizes[0]);
      const value = newRatio * model.range + model.values[0];
      const newValue = findClosestValue(value, model.values);
      if (newValue !== undefined) {
        publicAPI.setValue(newValue);
      }
    }
  }

  function onMouseOut(e) {
    isDragging = false;
  }

  function onMouseUp(e) {
    handleDragEvents(false);
    if (!isDragging) {
      const isClick = !((model.orientation ? e.clientX : e.clientY) - offset);
      if (isClick) {
        const absValue =
          model.values[0] +
          (model.range *
            (offset -
              model.container.getBoundingClientRect()[
                model.orientation ? 'left' : 'top'
              ] -
              0.5 * model.containerSizes[0])) /
            (model.containerSizes[1] - model.containerSizes[0]);
        const newValue = findClosestValue(absValue, model.values);
        if (newValue !== undefined) {
          publicAPI.setValue(newValue);
        }
      }
    }
    isDragging = false;
  }

  function onMouseDown(e) {
    handleDragEvents(true);
    e.preventDefault();
    isDragging = e.target === model.el;
    offset = model.orientation ? e.clientX : e.clientY;
    ratio = (model.value - model.values[0]) / model.range;
  }

  function bindEvents() {
    model.container.addEventListener('mousedown', onMouseDown);
  }

  function unbindEvents() {
    handleDragEvents(false);
    model.container.removeEventListener('mousedown', onMouseDown);
  }

  // --------------------------------------------------------------------------

  publicAPI.setContainer = (el) => {
    if (model.container && model.container !== el) {
      model.container.removeChild(model.el);
      unbindEvents();
    }
    if (model.container !== el) {
      model.container = el;
      if (model.container) {
        model.container.appendChild(model.el);
        publicAPI.resize();
        bindEvents();
      }
      publicAPI.modified();
    }
  };

  publicAPI.resize = () => {
    if (model.container) {
      const dims = model.container.getBoundingClientRect();
      const width = Math.floor(dims.width);
      const height = Math.floor(dims.height);
      const min = Math.min(width, height);
      const max = Math.max(width, height);
      publicAPI.setOrientation(
        height === max
          ? Constants.SliderOrientation.VERTICAL
          : Constants.SliderOrientation.HORIZONTAL
      );
      model.containerSizes = [min, max];
      updateCursorPosition();
    }
  };

  publicAPI.setValue = (v) => {
    if (model.value !== v && model.values.indexOf(v) !== -1) {
      model.value = v;
      updateCursorPosition();
      publicAPI.modified();
      publicAPI.invokeValueChange(v);
    } else if (model.values[0] <= v && v <= model.values.slice(-1)[0]) {
      model.value = v;
      updateCursorPosition();
      publicAPI.modified();
      publicAPI.invokeValueChange(v);
    }
  };

  publicAPI.setValues = (values) => {
    if (model.values !== values) {
      model.values = values;
      model.range = values[values.length - 1] - values[0];
      updateCursorPosition();
      publicAPI.modified();
    }
  };

  publicAPI.generateValues = (min, max, nbSteps) => {
    const step = (max - min) / (nbSteps - 1);
    model.values = [];
    for (let i = 0; i < nbSteps; i++) {
      model.values.push(min + i * step);
    }
    model.range = max - min;
    updateCursorPosition();
    publicAPI.modified();
  };

  publicAPI.updateCursorStyle = (cursorStyle) => {
    model.cursorStyle = Object.assign({}, model.cursorStyle, cursorStyle);
    const keys = Object.keys(model.cursorStyle);
    let count = keys.length;
    while (count--) {
      model.el.style[keys[count]] = model.cursorStyle[keys[count]];
    }
  };

  // Apply default style
  publicAPI.updateCursorStyle();
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  orientation: Constants.SliderOrientation.VERTICAL,
  value: 0.5,
  values: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
  range: 1,
  containerSizes: [10, 100],
  cursorStyle: {
    border: 'solid 4px #aaa',
    backgroundColor: '#ccc',
    transform: 'scale(0.7)',
  },
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['orientation', 'value', 'values']);
  macro.set(publicAPI, model, ['orientation']);
  macro.event(publicAPI, model, 'ValueChange');

  // Object specific methods
  vtkSlider(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkSlider');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, Constants);
