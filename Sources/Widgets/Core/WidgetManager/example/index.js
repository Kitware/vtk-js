import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkWidgetManager from 'vtk.js/Sources/Widgets/Core/WidgetManager';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

import vtkBoxWidget from 'vtk.js/Sources/Widgets/Widgets3D/BoxWidget';
import vtkImplicitPlaneWidget from 'vtk.js/Sources/Widgets/Widgets3D/ImplicitPlaneWidget';
import vtkPolyLineWidget from 'vtk.js/Sources/Widgets/Widgets3D/PolyLineWidget';

import controlPanel from './controlPanel.html';

const WIDGET_BUILDERS = {
  vtkBoxWidget,
  vtkImplicitPlaneWidget,
  vtkPolyLineWidget,
};

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
const openGLRenderWindow = fullScreenRenderer.getOpenGLRenderWindow();

// ----------------------------------------------------------------------------
// Add context to place widget
// ----------------------------------------------------------------------------

const cone = vtkConeSource.newInstance();
const mapper = vtkMapper.newInstance();
const actor = vtkActor.newInstance();

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
widgetManager.setRenderingContext(openGLRenderWindow, renderer);

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
  const widget = WIDGET_BUILDERS[selectElem.value].newInstance();
  widgetManager.registerWidget(widget);

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
  // FIXME
  console.log('toggle', index, name, value);
}

// Delete widget
function deleteWidget(e) {
  const index = Number(
    e.currentTarget.parentElement.parentElement.dataset.index
  );
  const w = widgetManager.getWidgets()[index];
  widgetManager.unregisterWidget(w);
  updateUI();
}

// UI generation -------------------
function toHTML(w, index) {
  return `<tr data-index="${index}">
    <td>
      <input
        type="checkbox"
        data-name="focus"
        ${w.focus ? 'checked' : ''}
      />
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
      name: w.getClassName(),
      focus: w.hasFocus(),
      pickable: w.getActive(),
      visibility: w.getVisible(),
      contextVisibility: w.getVisibleContext(),
      handleVisibility: w.getVisibleHandle(),
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
}
