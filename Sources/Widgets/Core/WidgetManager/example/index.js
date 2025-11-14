/* eslint-disable no-use-before-define */
import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';
import WidgetManagerConstants from '@kitware/vtk.js/Widgets/Core/WidgetManager/Constants';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';

import vtkBoxWidget from 'vtk.js/Examples/Widgets/Box/BoxWidget';
import vtkImplicitPlaneWidget from '@kitware/vtk.js/Widgets/Widgets3D/ImplicitPlaneWidget';
import vtkPolyLineWidget from '@kitware/vtk.js/Widgets/Widgets3D/PolyLineWidget';

import GUI from 'lil-gui';

const { CaptureOn } = WidgetManagerConstants;

const WIDGET_BUILDERS = {
  Box(widgetManager) {
    return widgetManager.addWidget(vtkBoxWidget.newInstance({ label: 'Box' }));
  },
  PlaneWidget(widgetManager) {
    return widgetManager.addWidget(
      vtkImplicitPlaneWidget.newInstance({ label: 'Plane' })
    );
  },
  PolyLine(widgetManager) {
    const instance = widgetManager.addWidget(
      vtkPolyLineWidget.newInstance({
        label: 'Polyline',
      })
    );
    instance.setCoincidentTopologyParameters({
      Point: {
        factor: -1.0,
        offset: -1.0,
      },
      Line: {
        factor: -1.5,
        offset: -1.5,
      },
      Polygon: {
        factor: -2.0,
        offset: -2.0,
      },
    });
    instance.setActiveScaleFactor(0.9);
    instance.setGlyphResolution(60);
    return instance;
  },
  ClosedPolyLine(widgetManager) {
    const instance = widgetManager.addWidget(
      vtkPolyLineWidget.newInstance({
        label: 'Closed Polyline',
      }),
      null,
      {
        coincidentTopologyParameters: {
          Point: {
            factor: -1.0,
            offset: -1.0,
          },
          Line: {
            factor: -1.5,
            offset: -1.5,
          },
          Polygon: {
            factor: -2.0,
            offset: -2.0,
          },
        },
      }
    );
    instance.setActiveScaleFactor(1.1);
    instance.setGlyphResolution(30);
    instance.setClosePolyLine(true);
    return instance;
  },
};

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Add context to place widget
// ----------------------------------------------------------------------------

const cone = vtkConeSource.newInstance();
const mapper = vtkMapper.newInstance();
const actor = vtkActor.newInstance({ pickable: false });

actor.setMapper(mapper);
mapper.setInputConnection(cone.getOutputPort());
actor.getProperty().setOpacity(0.5);
renderer.addActor(actor);

renderer.resetCamera();
renderWindow.render();

// ----------------------------------------------------------------------------
// Widget manager
// ----------------------------------------------------------------------------

const widgetManager = vtkWidgetManager.newInstance();
widgetManager.setCaptureOn(CaptureOn.MOUSE_RELEASE); // default
widgetManager.setRenderer(renderer);

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

const gui = new GUI();
let selectedCtrl;
const params = {
  WidgetType: 'Box',
  SelectedIndex: 0,
  Pickable: true,
  Visibility: true,
  ContextVisibility: true,
  HandleVisibility: true,
  Focus: false,
  Create: () => {
    const w = WIDGET_BUILDERS[params.WidgetType](widgetManager);
    w.placeWidget(cone.getOutputData().getBounds());
    w.setPlaceFactor(2);
    widgetManager.enablePicking();
    renderWindow.render();
    updateFromActive();
  },
  Delete: () => {
    const widgets = widgetManager.getWidgets();
    const index = params.SelectedIndex;
    if (!widgets.length || index < 0 || index >= widgets.length) {
      return;
    }
    const w = widgets[index];
    widgetManager.removeWidget(w);
    widgetManager.enablePicking();
    renderWindow.render();
    params.SelectedIndex = Math.max(0, params.SelectedIndex - 1);
    selectedCtrl.max(Math.max(0, widgetManager.getWidgets().length - 1));
    selectedCtrl.updateDisplay?.();
    updateFromActive();
  },
};

gui.add(params, 'WidgetType', Object.keys(WIDGET_BUILDERS)).name('Widget type');

selectedCtrl = gui
  .add(params, 'SelectedIndex', 0, 0, 1)
  .name('Selected widget')
  .onChange(() => updateFromActive());

gui.add(params, 'Create').name('Create widget');
gui.add(params, 'Delete').name('Delete widget');

gui
  .add(params, 'Focus')
  .name('Grab focus')
  .onChange((value) => {
    const widgets = widgetManager.getWidgets();
    const index = params.SelectedIndex;
    if (!widgets.length || index < 0 || index >= widgets.length) {
      return;
    }
    const w = widgets[index];
    if (value) {
      widgetManager.grabFocus(w);
    } else {
      widgetManager.releaseFocus();
    }
    widgetManager.enablePicking();
    renderWindow.render();
  });

gui
  .add(params, 'Pickable')
  .name('Pickable')
  .onChange((value) => {
    const widgets = widgetManager.getWidgets();
    const index = params.SelectedIndex;
    if (!widgets.length || index < 0 || index >= widgets.length) {
      return;
    }
    const w = widgets[index];
    w.set({ pickable: !!value });
    widgetManager.enablePicking();
    renderWindow.render();
  });

gui
  .add(params, 'Visibility')
  .name('Visibility')
  .onChange((value) => {
    const widgets = widgetManager.getWidgets();
    const index = params.SelectedIndex;
    if (!widgets.length || index < 0 || index >= widgets.length) {
      return;
    }
    const w = widgets[index];
    w.set({ visibility: !!value });
    widgetManager.enablePicking();
    renderWindow.render();
  });

gui
  .add(params, 'ContextVisibility')
  .name('Context visibility')
  .onChange((value) => {
    const widgets = widgetManager.getWidgets();
    const index = params.SelectedIndex;
    if (!widgets.length || index < 0 || index >= widgets.length) {
      return;
    }
    const w = widgets[index];
    w.set({ contextVisibility: !!value });
    widgetManager.enablePicking();
    renderWindow.render();
  });

gui
  .add(params, 'HandleVisibility')
  .name('Handle visibility')
  .onChange((value) => {
    const widgets = widgetManager.getWidgets();
    const index = params.SelectedIndex;
    if (!widgets.length || index < 0 || index >= widgets.length) {
      return;
    }
    const w = widgets[index];
    w.set({ handleVisibility: !!value });
    widgetManager.enablePicking();
    renderWindow.render();
  });

function updateFromActive() {
  const widgets = widgetManager.getWidgets();
  const count = widgets.length;
  selectedCtrl.max(Math.max(0, count - 1));
  if (!count) {
    params.Focus = false;
    params.Pickable = false;
    params.Visibility = false;
    params.ContextVisibility = false;
    params.HandleVisibility = false;
  } else {
    const index = Math.min(params.SelectedIndex, count - 1);
    params.SelectedIndex = index;
    const w = widgets[index];
    params.Focus = w.hasFocus();
    params.Pickable = w.getPickable();
    params.Visibility = w.getVisibility();
    params.ContextVisibility = w.getContextVisibility();
    params.HandleVisibility = w.getHandleVisibility();
  }
  gui.controllers.forEach((c) => c.updateDisplay?.());
}

updateFromActive();
