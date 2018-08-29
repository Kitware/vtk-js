import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkWidgetManager from 'vtk.js/Sources/Widgets/Core/WidgetManager';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

import vtkBoxWidget from 'vtk.js/Examples/Widgets/Box/BoxWidget';
import vtkImplicitPlaneWidget from 'vtk.js/Sources/Widgets/Widgets3D/ImplicitPlaneWidget';
import vtkPolyLineWidget from 'vtk.js/Sources/Widgets/Widgets3D/PolyLineWidget';

import controlPanel from './controlPanel.html';

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
    instance.setActiveScaleFactor(0.9);
    instance.setGlyphResolution(60);
    return instance;
  },
  ClosedPolyLine(widgetManager) {
    const instance = widgetManager.addWidget(
      vtkPolyLineWidget.newInstance({
        label: 'Closed Polyline',
      })
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
widgetManager.setRenderer(renderer);

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------
/* eslint-disable */
fullScreenRenderer.addController(controlPanel);

const widgetListElem = document.querySelector('.widgetList');
const selectElem = document.querySelector('select');
const buttonCreate = document.querySelector('button.create');

// Create Widget
buttonCreate.addEventListener('click', () => {
  const w = WIDGET_BUILDERS[selectElem.value](widgetManager);
  w.placeWidget(cone.getOutputData().getBounds());
  w.setPlaceFactor(2);

  // w.onWidgetChange((state) =>
  //   console.log(JSON.stringify(state.get(), null, 2))
  // );

  widgetManager.enablePicking();
  renderWindow.render();
  updateUI();
});

// Toggle flag
function toggle(e) {
  const value = !!e.target.checked;
  const name = e.currentTarget.dataset.name;
  const index = Number(
    e.currentTarget.parentElement.parentElement.dataset.index
  );
  if (name === 'focus') {
    if (value) {
      widgetManager.grabFocus(widgetManager.getWidgets()[index]);
    } else {
      widgetManager.releaseFocus();
    }
  } else {
    const w = widgetManager.getWidgets()[index];
    w.set({ [name]: value });
  }
  widgetManager.enablePicking();
  renderWindow.render();
}

function grabFocus(e) {
  const index = Number(
    e.currentTarget.parentElement.parentElement.dataset.index
  );
  const w = widgetManager.getWidgets()[index];

  if (!w.hasFocus()) {
    widgetManager.grabFocus(w);
  } else {
    widgetManager.releaseFocus();
  }
  widgetManager.enablePicking();
  renderWindow.render();
  updateUI();
}

// Delete widget
function deleteWidget(e) {
  const index = Number(
    e.currentTarget.parentElement.parentElement.dataset.index
  );
  const w = widgetManager.getWidgets()[index];
  widgetManager.removeWidget(w);
  updateUI();
  widgetManager.enablePicking();
  renderWindow.render();
}

// UI generation -------------------
function toHTML(w, index) {
  return `<tr data-index="${index}">
    <td>
      <button class="focus">${!w.focus ? 'Grab' : 'Release'}</button>
    </td>
    <td>${w.name}</td>
    <td>
      <input
        type="checkbox"
        data-name="pickable"
        ${w.pickable ? 'checked' : ''}
      />
    </td>
    <td>
      <input
        type="checkbox"
        data-name="visibility"
        ${w.visibility ? 'checked' : ''}
      />
    </td>
    <td>
      <input
        type="checkbox"
        data-name="contextVisibility"
        ${w.contextVisibility ? 'checked' : ''}
      />
    </td>
    <td>
      <input
        type="checkbox"
        data-name="handleVisibility"
        ${w.handleVisibility ? 'checked' : ''}
      />
    </td>
    <td>
      <button class='delete'>x</button>
    </td>
  </tr>`;
}

function updateUI() {
  const widgets = widgetManager.getWidgets();
  widgetListElem.innerHTML = widgets
    .map((w) => ({
      name: w.getReferenceByName('label'),
      focus: w.hasFocus(),
      pickable: w.getPickable(),
      visibility: w.getVisibility(),
      contextVisibility: w.getContextVisibility(),
      handleVisibility: w.getHandleVisibility(),
    }))
    .map(toHTML)
    .join('\n');
  const toggleElems = document.querySelectorAll('input[type="checkbox"]');
  for (let i = 0; i < toggleElems.length; i++) {
    toggleElems[i].addEventListener('change', toggle);
  }
  const deleteElems = document.querySelectorAll('button.delete');
  for (let i = 0; i < deleteElems.length; i++) {
    deleteElems[i].addEventListener('click', deleteWidget);
  }
  const grabElems = document.querySelectorAll('button.focus');
  for (let i = 0; i < grabElems.length; i++) {
    grabElems[i].addEventListener('click', grabFocus);
  }
}
