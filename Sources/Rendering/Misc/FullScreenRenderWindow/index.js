import * as macro                 from '../../../../Sources/macro';
import vtkOpenGLRenderWindow      from '../../../../Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderer                from '../../../../Sources/Rendering/Core/Renderer';
import vtkRenderWindow            from '../../../../Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor  from '../../../../Sources/Rendering/Core/RenderWindowInteractor';

// Load basic classes for vtk() factory
import '../../../../Sources/Common/Core/Points';
import '../../../../Sources/Common/Core/DataArray';
import '../../../../Sources/Common/DataModel/PolyData';
import '../../../../Sources/Rendering/Core/Actor';
import '../../../../Sources/Rendering/Core/Mapper';

// Load style
import style from './FullScreenRenderWindow.mcss';

function vtkFullScreenRenderWindow(publicAPI, model) {
  // Full screen DOM handler
  model.container = document.createElement('div');
  model.container.className = style.container;
  document.querySelector('body').appendChild(model.container);

  // VTK renderWindow/renderer
  model.renderWindow = vtkRenderWindow.newInstance();
  model.renderer = vtkRenderer.newInstance();
  model.renderWindow.addRenderer(model.renderer);

  // OpenGlRenderWindow
  model.openGlRenderWindow = vtkOpenGLRenderWindow.newInstance();
  model.openGlRenderWindow.setContainer(model.container);
  model.renderWindow.addView(model.openGlRenderWindow);

  // Interactor
  model.interactor = vtkRenderWindowInteractor.newInstance();
  model.interactor.setView(model.openGlRenderWindow);
  model.interactor.initialize();
  model.interactor.bindEvents(model.container);

  // Expose background
  publicAPI.setBackground = model.renderer.setBackground;

  publicAPI.addController = (html) => {
    model.controlContainer = document.createElement('div');
    model.controlContainer.className = style.controlPanel;
    document.querySelector('body').appendChild(model.controlContainer);
    model.controlContainer.innerHTML = html;

    document.querySelector('body').addEventListener('keypress', (e) => {
      if (String.fromCharCode(e.charCode) === 'c') {
        if (model.controlContainer.style.display === 'none') {
          model.controlContainer.style.display = 'block';
        } else {
          model.controlContainer.style.display = 'none';
        }
      }
    });
  };

  // Update BG color
  publicAPI.setBackground(...model.background);

  // Handle window resize
  function updateRenderWindowSize() {
    const dims = model.container.getBoundingClientRect();
    model.openGlRenderWindow.setSize(dims.width, dims.height);
    model.renderWindow.render();
  }

  window.addEventListener('resize', updateRenderWindowSize);
  updateRenderWindowSize();
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  background: [0.32, 0.34, 0.43],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, [
    'renderWindow',
    'renderer',
    'openGlRenderWindow',
    'interactor',
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
