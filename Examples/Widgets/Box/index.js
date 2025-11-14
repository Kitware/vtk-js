import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import '@kitware/vtk.js/Rendering/Profiles/Glyph';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';

import GUI from 'lil-gui';

import vtkBoxWidget from './BoxWidget';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
const openGLRenderWindow = fullScreenRenderer.getApiSpecificRenderWindow();

// ----------------------------------------------------------------------------
// 2D overlay rendering
// ----------------------------------------------------------------------------

const overlaySize = 15;
const overlayBorder = 2;
const overlay = document.createElement('div');
overlay.style.position = 'absolute';
overlay.style.width = `${overlaySize}px`;
overlay.style.height = `${overlaySize}px`;
overlay.style.border = `solid ${overlayBorder}px red`;
overlay.style.borderRadius = '50%';
overlay.style.left = '-100px';
overlay.style.pointerEvents = 'none';
document.querySelector('body').appendChild(overlay);

// ----------------------------------------------------------------------------
// Widget manager
// ----------------------------------------------------------------------------

const widgetManager = vtkWidgetManager.newInstance();
widgetManager.setRenderer(renderer);

const widget = vtkBoxWidget.newInstance();

function widgetRegistration(e) {
  const action = e ? e.currentTarget.dataset.action : 'addWidget';
  const viewWidget = widgetManager[action](widget);
  if (viewWidget) {
    viewWidget.setScaleInPixels(false);
    viewWidget.setDisplayCallback((coords) => {
      overlay.style.left = '-100px';
      if (coords) {
        const [w, h] = openGLRenderWindow.getSize();
        overlay.style.left = `${Math.round(
          (coords[0][0] / w) * window.innerWidth -
            overlaySize * 0.5 -
            overlayBorder
        )}px`;
        overlay.style.top = `${Math.round(
          ((h - coords[0][1]) / h) * window.innerHeight -
            overlaySize * 0.5 -
            overlayBorder
        )}px`;
      }
    });

    renderer.resetCamera();
    renderer.resetCameraClippingRange();
  }
  widgetManager.enablePicking();
  renderWindow.render();
}

// Initial widget register
widgetRegistration();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

const gui = new GUI();
const params = {
  pickable: true,
  visibility: true,
  contextVisibility: true,
  handleVisibility: true,
  addWidget: () => widgetRegistration(),
  removeWidget: () =>
    widgetRegistration({
      currentTarget: { dataset: { action: 'removeWidget' } },
    }),
};

gui
  .add(params, 'pickable')
  .name('Pickable')
  .onChange((value) => {
    widget.set({ pickable: !!value });
    widgetManager.enablePicking();
    renderWindow.render();
  });

gui
  .add(params, 'visibility')
  .name('Visibility')
  .onChange((value) => {
    widget.set({ visibility: !!value });
    widgetManager.enablePicking();
    renderWindow.render();
  });

gui
  .add(params, 'contextVisibility')
  .name('Context visibility')
  .onChange((value) => {
    widget.set({ contextVisibility: !!value });
    widgetManager.enablePicking();
    renderWindow.render();
  });

gui
  .add(params, 'handleVisibility')
  .name('Handle visibility')
  .onChange((value) => {
    widget.set({ handleVisibility: !!value });
    widgetManager.enablePicking();
    renderWindow.render();
  });

gui.add(params, 'addWidget').name('Add widget');
gui.add(params, 'removeWidget').name('Remove widget');
