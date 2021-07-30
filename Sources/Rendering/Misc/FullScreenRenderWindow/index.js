import macro from 'vtk.js/Sources/macros';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';
import vtkURLExtract from 'vtk.js/Sources/Common/Core/URLExtract';

// Load basic classes for vtk() factory
import 'vtk.js/Sources/Common/Core/Points';
import 'vtk.js/Sources/Common/Core/DataArray';
import 'vtk.js/Sources/Common/DataModel/PolyData';
import 'vtk.js/Sources/Rendering/Core/Actor';
import 'vtk.js/Sources/Rendering/Core/Mapper';
import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';

// Process arguments from URL
const userParams = vtkURLExtract.extractURLParameters();

const STYLE_CONTAINER = {
  margin: '0',
  padding: '0',
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
};

const STYLE_CONTROL_PANEL = {
  position: 'absolute',
  left: '25px',
  top: '25px',
  backgroundColor: 'white',
  borderRadius: '5px',
  listStyle: 'none',
  padding: '5px 10px',
  margin: '0',
  display: 'block',
  border: 'solid 1px black',
  maxWidth: 'calc(100% - 70px)',
  maxHeight: 'calc(100% - 60px)',
  overflow: 'auto',
};

function applyStyle(el, style) {
  Object.keys(style).forEach((key) => {
    el.style[key] = style[key];
  });
}

function vtkFullScreenRenderWindow(publicAPI, model) {
  model.classHierarchy.push('vtkFullScreenRenderWindow');

  const body = document.querySelector('body');

  // Full screen DOM handler
  if (!model.rootContainer) {
    model.rootContainer = body;
  }

  if (!model.container) {
    model.container = document.createElement('div');
    applyStyle(model.container, model.containerStyle || STYLE_CONTAINER);
    model.rootContainer.appendChild(model.container);
  }

  // apply 100% to html and body for fullscreen
  if (model.rootContainer === body) {
    document.documentElement.style.height = '100%';
    body.style.height = '100%';
    body.style.padding = '0';
    body.style.margin = '0';
  }

  // VTK renderWindow/renderer
  model.renderWindow = vtkRenderWindow.newInstance();
  model.renderer = vtkRenderer.newInstance();
  model.renderWindow.addRenderer(model.renderer);

  // apiSpecificRenderWindow
  model.apiSpecificRenderWindow = model.renderWindow.newAPISpecificView(
    userParams.viewAPI
  );
  model.apiSpecificRenderWindow.setContainer(model.container);
  model.renderWindow.addView(model.apiSpecificRenderWindow);

  // Interactor
  model.interactor = vtkRenderWindowInteractor.newInstance();
  model.interactor.setInteractorStyle(
    vtkInteractorStyleTrackballCamera.newInstance()
  );
  model.interactor.setView(model.apiSpecificRenderWindow);
  model.interactor.initialize();
  model.interactor.bindEvents(model.container);

  // Expose background
  publicAPI.setBackground = model.renderer.setBackground;

  publicAPI.removeController = () => {
    const el = model.controlContainer;
    if (el) {
      el.parentNode.removeChild(el);
    }
  };

  publicAPI.setControllerVisibility = (visible) => {
    model.controllerVisibility = visible;
    if (model.controlContainer) {
      if (visible) {
        model.controlContainer.style.display = 'block';
      } else {
        model.controlContainer.style.display = 'none';
      }
    }
  };

  publicAPI.toggleControllerVisibility = () => {
    publicAPI.setControllerVisibility(!model.controllerVisibility);
  };

  publicAPI.addController = (html) => {
    model.controlContainer = document.createElement('div');
    applyStyle(
      model.controlContainer,
      model.controlPanelStyle || STYLE_CONTROL_PANEL
    );
    model.rootContainer.appendChild(model.controlContainer);
    model.controlContainer.innerHTML = html;

    publicAPI.setControllerVisibility(model.controllerVisibility);

    model.rootContainer.addEventListener('keypress', (e) => {
      if (String.fromCharCode(e.charCode) === 'c') {
        publicAPI.toggleControllerVisibility();
      }
    });
  };

  // Update BG color
  publicAPI.setBackground(...model.background);

  // Representation API
  publicAPI.addRepresentation = (representation) => {
    representation.getActors().forEach((actor) => {
      model.renderer.addActor(actor);
    });
  };
  publicAPI.removeRepresentation = (representation) => {
    representation
      .getActors()
      .forEach((actor) => model.renderer.removeActor(actor));
  };

  // Properly release GL context
  publicAPI.delete = macro.chain(
    publicAPI.setContainer,
    model.apiSpecificRenderWindow.delete,
    publicAPI.delete
  );

  // Handle window resize
  publicAPI.resize = () => {
    const dims = model.container.getBoundingClientRect();
    const devicePixelRatio = window.devicePixelRatio || 1;
    model.apiSpecificRenderWindow.setSize(
      Math.floor(dims.width * devicePixelRatio),
      Math.floor(dims.height * devicePixelRatio)
    );
    if (model.resizeCallback) {
      model.resizeCallback(dims);
    }
    model.renderWindow.render();
  };

  publicAPI.setResizeCallback = (cb) => {
    model.resizeCallback = cb;
    publicAPI.resize();
  };

  if (model.listenWindowResize) {
    window.addEventListener('resize', publicAPI.resize);
  }
  publicAPI.resize();
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  background: [0.32, 0.34, 0.43],
  containerStyle: null,
  controlPanelStyle: null,
  listenWindowResize: true,
  resizeCallback: null,
  controllerVisibility: true,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, [
    'renderWindow',
    'renderer',
    'apiSpecificRenderWindow',
    'interactor',
    'rootContainer',
    'container',
    'controlContainer',
  ]);

  // Object specific methods
  vtkFullScreenRenderWindow(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
