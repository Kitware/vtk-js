import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkMTLReader from '@kitware/vtk.js/IO/Misc/MTLReader';
import vtkOBJReader from '@kitware/vtk.js/IO/Misc/OBJReader';
import GUI from 'lil-gui';

// const objs = ['ferrari-f1-race-car', 'mini-cooper', 'space-shuttle-orbiter', 'blskes-plane'];
const fileName = 'space-shuttle-orbiter';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const resetCamera = renderer.resetCamera;
const render = renderWindow.render;

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const reader = vtkOBJReader.newInstance({ splitMode: 'usemtl' });
const materialsReader = vtkMTLReader.newInstance();
const scene = [];

const gui = new GUI();

function updateVisibility(idx, value) {
  const actor = scene[idx].actor;
  actor.setVisibility(value);
  render();
}

materialsReader
  .setUrl(`${__BASE_PATH__}/data/obj/${fileName}/${fileName}.mtl`)
  .then(() => {
    reader
      .setUrl(`${__BASE_PATH__}/data/obj/${fileName}/${fileName}.obj`)
      .then(() => {
        const size = reader.getNumberOfOutputPorts();
        for (let i = 0; i < size; i++) {
          const polydata = reader.getOutputData(i);
          const name = polydata.get('name').name;
          const mapper = vtkMapper.newInstance();
          const actor = vtkActor.newInstance();

          actor.setMapper(mapper);
          mapper.setInputData(polydata);

          materialsReader.applyMaterialToActor(name, actor);
          renderer.addActor(actor);

          scene.push({ name, polydata, mapper, actor });
        }
        resetCamera();
        render();

        scene.forEach((item, idx) => {
          const param = { visible: true };
          gui
            .add(param, 'visible')
            .name(item.name)
            .onChange((value) => updateVisibility(idx, value));
        });
      });
  });

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.reader = reader;
global.materialsReader = materialsReader;
global.scene = scene;
global.fullScreenRenderer = fullScreenRenderer;
