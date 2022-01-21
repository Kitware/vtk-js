import * as macro from 'vtk.js/Sources/macros';
import vtkCompositeMouseManipulator from 'vtk.js/Sources/Interaction/Manipulators/CompositeMouseManipulator';

const OUTSIDE_BOUNDS = [-2, -1, -2, -1];

const DEFAULT_STYLE = {
  position: 'absolute',
  zIndex: 1,
  border: '2px solid #F44336',
  backgroundColor: 'rgba(0, 0, 0, 0.1)',
  borderRadius: '4px',
  boxSizing: 'border-box',
};

function applyStyle(element, style) {
  Object.keys(style).forEach((name) => {
    element.style[name] = style[name];
  });
}

// ----------------------------------------------------------------------------
// vtkMouseBoxSelectionManipulator methods
// ----------------------------------------------------------------------------

function vtkMouseBoxSelectionManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkMouseBoxSelectionManipulator');

  // Private variable
  let view = null;
  let container = null;
  let previousPosition = null;
  let currentPosition = null;
  let div = null;
  let inDOM = false;

  function getBounds() {
    if (!previousPosition || !currentPosition) {
      return OUTSIDE_BOUNDS;
    }
    return [
      Math.min(previousPosition.x, currentPosition.x),
      Math.max(previousPosition.x, currentPosition.x),
      Math.min(previousPosition.y, currentPosition.y),
      Math.max(previousPosition.y, currentPosition.y),
    ];
  }

  function applyStyleToDiv() {
    if (!view || !container) {
      return;
    }
    const [viewWidth, viewHeight] = view.getSize();
    const { width, height } = container.getBoundingClientRect();
    const [xMin, xMax, yMin, yMax] = getBounds();
    div.style.left = `${(width * xMin) / viewWidth}px`;
    div.style.top = `${height - (height * yMax) / viewHeight}px`;
    div.style.width = `${(width * (xMax - xMin)) / viewWidth}px`;
    div.style.height = `${(height * (yMax - yMin)) / viewHeight}px`;
  }

  //-------------------------------------------------------------------------

  publicAPI.onButtonDown = (interactor, renderer, position) => {
    previousPosition = position;

    if (model.renderSelection) {
      // Need window size and location to convert to style
      if (!view) {
        view = interactor.getView();
      }

      if (!container && view?.getContainer) {
        container = view.getContainer();
      }

      if (!container) {
        container = model.container;
      }

      if (!div) {
        div = document.createElement('div');
        applyStyle(div, model.selectionStyle);
      }

      applyStyleToDiv();

      if (container && !inDOM) {
        inDOM = true;
        container.appendChild(div);
      }
    }
  };

  //-------------------------------------------------------------------------

  publicAPI.onMouseMove = (interactor, renderer, position) => {
    if (!previousPosition) {
      return;
    }
    if (!position) {
      return;
    }

    currentPosition = position;

    publicAPI.invokeBoxSelectInput({
      view,
      container,
      selection: getBounds(),
    });

    if (model.renderSelection) {
      applyStyleToDiv();
    }
  };

  //-------------------------------------------------------------------------

  publicAPI.onButtonUp = (interactor, renderer) => {
    if (!previousPosition || !currentPosition) {
      return;
    }

    publicAPI.invokeBoxSelectChange({
      view,
      container,
      selection: getBounds(),
    });

    if (inDOM) {
      div.parentElement.removeChild(div);
      inDOM = false;
    }

    // clear positions
    view = null;
    container = null;
    previousPosition = null;
    currentPosition = null;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

function DEFAULT_VALUES(initialValues) {
  return {
    // container: null,
    renderSelection: true,
    ...initialValues,
    selectionStyle: {
      ...DEFAULT_STYLE,
      ...initialValues.selectionStyle,
    },
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES(initialValues));

  // Inheritance
  macro.obj(publicAPI, model);
  vtkCompositeMouseManipulator.extend(publicAPI, model, initialValues);
  macro.event(publicAPI, model, 'BoxSelectChange'); // Trigger at release
  macro.event(publicAPI, model, 'BoxSelectInput'); // Trigger while dragging
  macro.setGet(publicAPI, model, [
    'renderSelection',
    'selectionStyle',
    'container',
  ]);

  // Object specific methods
  vtkMouseBoxSelectionManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkMouseBoxSelectionManipulator'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
