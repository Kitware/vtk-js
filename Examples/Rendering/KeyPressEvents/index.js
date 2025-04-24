import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkGenericRenderWindow from '@kitware/vtk.js/Rendering/Misc/GenericRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';

import controlPanel from './controlPanel.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const container = document.querySelector('body');
const controlContainer = document.createElement('div');
controlContainer.innerHTML = controlPanel;
container.appendChild(controlContainer);

global.RWIs = [];

const logs = document.createElement('pre');

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
  // Pick on mouse right click
  grw.getInteractor().onKeyDown((callData) => {
    logs.textContent += `Pressed ${callData.key} on RWI #${i}\n`;
  });
}
container.appendChild(logs);
