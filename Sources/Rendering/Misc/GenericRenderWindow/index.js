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

function vtkGenericRenderWindow(publicAPI, model) {
  // Capture resize trigger method to remove from publicAPI
  const invokeResize = publicAPI.invokeResize;
  delete publicAPI.invokeResize;

  // VTK renderWindow/renderer
  model.renderWindow = vtkRenderWindow.newInstance();
  model.renderer = vtkRenderer.newInstance();
  model.renderWindow.addRenderer(model.renderer);

  // OpenGLRenderWindow
  model._apiSpecificRenderWindow = model.renderWindow.newAPISpecificView(
    userParams.viewAPI ?? model.defaultViewAPI
  );
  model.renderWindow.addView(model._apiSpecificRenderWindow);

  // Interactor
  model.interactor = vtkRenderWindowInteractor.newInstance();
  model.interactor.setInteractorStyle(
    vtkInteractorStyleTrackballCamera.newInstance()
  );
  model.interactor.setView(model._apiSpecificRenderWindow);
  model.interactor.initialize();

  // Expose background
  publicAPI.setBackground = model.renderer.setBackground;

  // Update BG color
  publicAPI.setBackground(...model.background);

  // Handle window resize
  publicAPI.resize = () => {
    if (model.container) {
      const dims = model.container.getBoundingClientRect();
      const devicePixelRatio = window.devicePixelRatio || 1;
      model._apiSpecificRenderWindow.setSize(
        Math.floor(dims.width * devicePixelRatio),
        Math.floor(dims.height * devicePixelRatio)
      );
      invokeResize();
      model.renderWindow.render();
    }
  };

  // Handle DOM container relocation
  publicAPI.setContainer = (el) => {
    if (model.container) {
      model.interactor.unbindEvents(model.container);
    }

    // Switch container
    model.container = el;
    model._apiSpecificRenderWindow.setContainer(model.container);

    // Bind to new container
    if (model.container) {
      model.interactor.bindEvents(model.container);
    }
  };

  // Properly release GL context
  publicAPI.delete = macro.chain(
    publicAPI.setContainer,
    model._apiSpecificRenderWindow.delete,
    publicAPI.delete
  );

  // Handle size
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
  listenWindowResize: true,
  container: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, [
    'renderWindow',
    'renderer',
    '_apiSpecificRenderWindow',
    'interactor',
    'container',
  ]);
  macro.moveToProtected(publicAPI, model, ['_apiSpecificRenderWindow']);
  macro.event(publicAPI, model, 'resize');

  // Object specific methods
  vtkGenericRenderWindow(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
