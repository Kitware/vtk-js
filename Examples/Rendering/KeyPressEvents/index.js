import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkGenericRenderWindow from '@kitware/vtk.js/Rendering/Misc/GenericRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import GUI from 'lil-gui';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const container = document.querySelector('body');
const logs = document.createElement('pre');
logs.style.padding = '4px';

// lil-gui panel for controls
const gui = new GUI();
const guiParams = {
  translation: true,
  slider: 255,
  select: 'Three',
  reset: () => {
    // Placeholder for reset action
    logs.textContent += 'Reset button clicked\n';
    logs.scrollTop = logs.scrollHeight;
  },
};
gui.add(guiParams, 'translation').name('Click with mouse then press space key');
gui.add(guiParams, 'slider', 0, 255, 1).name('Click then key up and down');
gui
  .add(guiParams, 'select', ['One', 'Two', 'Three', 'Four'])
  .name('Browse with up/down');
gui.add(guiParams, 'reset').name('Click and press space key');

gui.domElement.appendChild(logs);

global.RWIs = [];

const cone = vtkConeSource.newInstance();

for (let i = 0; i < 3; ++i) {
  const elementParent = document.createElement('div');
  elementParent.style.width = '33%';
  elementParent.style.height = '300px';
  elementParent.style.display = 'inline-block';

  const element = document.createElement('div');
  element.setAttribute('id', `view-${i}`);
  element.style.width = '100%';
  element.style.height = '100%';
  element.tabIndex = 0;
  elementParent.appendChild(element);

  container.appendChild(elementParent);

  const grw = vtkGenericRenderWindow.newInstance();

  const color = [0, 0, 0];
  color[i % 3] = 1;
  grw.getRenderer().setBackground(color);

  const mapper = vtkMapper.newInstance();
  mapper.setInputConnection(cone.getOutputPort());
  const actor = vtkActor.newInstance();
  actor.setMapper(mapper);
  grw.getRenderer().addActor(actor);
  grw.getRenderer().resetCamera();

  grw.setContainer(element);
  grw.resize();

  global.RWIs.push(grw.getInteractor());
  grw.getInteractor().onKeyDown((callData) => {
    logs.textContent += `Pressed ${callData.key} on RWI #${i}\n`;
    logs.scrollTop = logs.scrollHeight;
  });
}

// Move the GUI to the top of the body
container.insertBefore(gui.domElement, container.firstChild);

// Optionally, add a heading as in the original HTML
const heading = document.createElement('h3');
heading.textContent =
  'Click or press tab until you "focus" a render window, then type keys (e.g. r, w, s)';
container.insertBefore(heading, gui.domElement);
