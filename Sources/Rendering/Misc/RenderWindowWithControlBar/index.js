import macro from 'vtk.js/Sources/macros';
import vtkGenericRenderWindow from 'vtk.js/Sources/Rendering/Misc/GenericRenderWindow';
import style from 'vtk.js/Sources/Rendering/Misc/RenderWindowWithControlBar/RenderWindowWithControlBar.module.css';

// Load basic classes for vtk() factory
import 'vtk.js/Sources/Common/Core/Points';
import 'vtk.js/Sources/Common/Core/DataArray';
import 'vtk.js/Sources/Common/DataModel/PolyData';
import 'vtk.js/Sources/Rendering/Core/Actor';
import 'vtk.js/Sources/Rendering/Core/Mapper';

// ----------------------------------------------------------------------------
// Utility functions to control style
// ----------------------------------------------------------------------------

const CONTROL_STYLE = {
  left(size) {
    return {
      top: '0',
      left: '0',
      bottom: '0',
      right: 'unset',
      height: 'unset',
      width: `${size}px`,
    };
  },
  right(size) {
    return {
      top: '0',
      right: '0',
      bottom: '0',
      left: 'unset',
      height: 'unset',
      width: `${size}px`,
    };
  },
  top(size) {
    return {
      top: '0',
      left: '0',
      right: '0',
      bottom: 'unset',
      width: 'unset',
      height: `${size}px`,
    };
  },
  bottom(size) {
    return {
      bottom: '0',
      left: '0',
      right: '0',
      top: 'unset',
      width: 'unset',
      height: `${size}px`,
    };
  },
};

function applyControlStyle(el, position, size) {
  const styleToApply = CONTROL_STYLE[position](size);
  Object.keys(styleToApply).forEach((key) => {
    el.style[key] = styleToApply[key];
  });
}

// ----------------------------------------------------------------------------

function vtkRenderWindowWithControlBar(publicAPI, model) {
  const superClass = { ...publicAPI };

  function resetStyleToZero(key) {
    model.renderWindowContainer.style[key] = '0px';
  }

  function updateControlerStyle() {
    ['left', 'right', 'top', 'bottom'].forEach(resetStyleToZero);
    model.renderWindowContainer.style[
      model.controlPosition
    ] = `${model.controlSize}px`;
    applyControlStyle(
      model.controlContainer,
      model.controlPosition,
      model.controlSize
    );
  }

  // Create container for the vtkGenericRenderWindow
  model.renderWindowContainer = document.createElement('div');
  model.renderWindowContainer.classList.add(style.renderWindow);
  superClass.setContainer(model.renderWindowContainer);

  // Create container for controls
  model.controlContainer = document.createElement('div');
  model.controlContainer.classList.add(style.control);

  // Handle DOM container relocation
  publicAPI.setContainer = (el) => {
    if (model.rootContainer) {
      model.rootContainer.removeChild(model.container);
      model.rootContainer.removeChild(model.controlContainer);
      model.rootContainer.classList.remove(style.rootContainer);
    }

    // Switch container
    model.rootContainer = el;

    // Bind to new container
    if (model.rootContainer) {
      model.rootContainer.appendChild(model.container);
      model.rootContainer.appendChild(model.controlContainer);
      model.rootContainer.classList.add(style.rootContainer);
      updateControlerStyle();
      publicAPI.resize();
    }
  };

  publicAPI.setControlSize = (size) => {
    model.controlSize = size;
    updateControlerStyle();
    publicAPI.modified();
  };

  publicAPI.setControlPosition = (pos) => {
    model.controlPosition = pos;
    updateControlerStyle();
    publicAPI.modified();
  };

  // Handle size
  if (model.listenWindowResize) {
    window.addEventListener('resize', publicAPI.resize);
  }
  updateControlerStyle();
  publicAPI.resize();
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  rootContainer: null,
  controlPosition: 'left',
  controlSize: 10,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  vtkGenericRenderWindow.extend(publicAPI, model);
  macro.get(publicAPI, model, [
    'rootContainer',
    'controlContainer',
    'renderWindowContainer',
  ]);

  // Object specific methods
  vtkRenderWindowWithControlBar(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkRenderWindowWithControlBar'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
