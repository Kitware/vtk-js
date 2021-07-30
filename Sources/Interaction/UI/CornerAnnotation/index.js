import macro from 'vtk.js/Sources/macros';
import style from 'vtk.js/Sources/Interaction/UI/CornerAnnotation/CornerAnnotation.module.css';

function noOp() {}

const KEY_MAPPING = {
  nw: 'northWestContainer',
  n: 'northContainer',
  ne: 'northEastContainer',
  w: 'westContainer',
  e: 'eastContainer',
  sw: 'southWestContainer',
  s: 'southContainer',
  se: 'southEastContainer',
};

// ----------------------------------------------------------------------------
// Static helpers
// ----------------------------------------------------------------------------

function get(path, obj, fb = `$\{${path}}`) {
  return path
    .split('.')
    .reduce((res, key) => (res[key] !== undefined ? res[key] : fb), obj);
}

/* from https://gist.github.com/smeijer/6580740a0ff468960a5257108af1384e */
function applyTemplate(template, map, fallback) {
  return template.replace(/\${([^{]+)}/g, (match) => {
    const path = match.substr(2, match.length - 3).trim();
    return get(path, map, fallback);
  });
}

// ----------------------------------------------------------------------------
// vtkCornerAnnotation methods
// ----------------------------------------------------------------------------

function vtkCornerAnnotation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCornerAnnotation');

  // Create instance specific container
  if (!model.templates) {
    model.templates = {};
  }
  if (!model.metadata) {
    model.metadata = {};
  }

  model.annotationContainer = document.createElement('div');
  model.annotationContainer.setAttribute('class', style.container);
  model.annotationContainer.innerHTML = `
    <div class="${style.topRow}">
      <div class="js-nw ${style.northWest}"></div>
      <div class="js-n ${style.north}"></div>
      <div class="js-ne ${style.northEast}"></div>
    </div>
    <div class="${style.middleRow}">
      <div class="js-w ${style.west}"></div>
      <div class="js-e ${style.east}"></div>
    </div>
    <div class="${style.bottomRow}">
      <div class="js-sw ${style.southWest}"></div>
      <div class="js-s ${style.south}"></div>
      <div class="js-se ${style.southEast}"></div>
    </div>`;

  // Extract various containers
  model.northWestContainer = model.annotationContainer.querySelector('.js-nw');
  model.northContainer = model.annotationContainer.querySelector('.js-n');
  model.northEastContainer = model.annotationContainer.querySelector('.js-ne');
  model.westContainer = model.annotationContainer.querySelector('.js-w');
  model.eastContainer = model.annotationContainer.querySelector('.js-e');
  model.southWestContainer = model.annotationContainer.querySelector('.js-sw');
  model.southContainer = model.annotationContainer.querySelector('.js-s');
  model.southEastContainer = model.annotationContainer.querySelector('.js-se');

  // --------------------------------------------------------------------------
  // Private methods
  // --------------------------------------------------------------------------

  function updateAnnotations() {
    const keys = Object.keys(model.templates);
    let count = keys.length;
    while (count--) {
      const el = model[KEY_MAPPING[keys[count]]];
      const fn = model.templates[keys[count]];
      if (el && fn) {
        el.innerHTML = fn(model.metadata);
      }
    }
  }

  // --------------------------------------------------------------------------

  publicAPI.setContainer = (el) => {
    if (model.container && model.container !== el) {
      model.container.removeChild(model.annotationContainer);
    }
    if (model.container !== el) {
      model.container = el;
      if (model.container) {
        model.container.appendChild(model.annotationContainer);
        publicAPI.resize();
      }
      publicAPI.modified();
    }
  };

  publicAPI.resize = noOp;

  publicAPI.updateTemplates = (templates) => {
    model.templates = Object.assign(model.templates, templates);
    updateAnnotations();
    publicAPI.modified();
  };

  publicAPI.updateMetadata = (metadata) => {
    model.metadata = Object.assign(model.metadata, metadata);
    updateAnnotations();
    publicAPI.modified();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  templates: null,
  metadata: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, [
    'annotationContainer',
    'northWestContainer',
    'northContainer',
    'northEastContainer',
    'westContainer',
    'eastContainer',
    'southWestContainer',
    'southContainer',
    'southEastContainer',
    'metadata',
  ]);

  // Object specific methods
  vtkCornerAnnotation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkCornerAnnotation');

// ----------------------------------------------------------------------------

export default { newInstance, extend, applyTemplate };
