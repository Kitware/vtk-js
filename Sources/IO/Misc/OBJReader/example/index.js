import 'vtk.js/Sources/favicon';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkMTLReader from 'vtk.js/Sources/IO/Misc/MTLReader';
import vtkOBJReader from 'vtk.js/Sources/IO/Misc/OBJReader';

// const objs = ['ferrari-f1-race-car', 'mini-cooper', 'space-shuttle-orbiter', 'blskes-plane'];
const fileName = 'space-shuttle-orbiter';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0.5, 0.5, 0.5],
});
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

function onClick(event) {
  const el = event.target;
  const index = Number(el.dataset.index);
  const actor = scene[index].actor;
  const visibility = actor.getVisibility();

  actor.setVisibility(!visibility);
  if (visibility) {
    el.classList.remove('visible');
  } else {
    el.classList.add('visible');
  }
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

        // Build control ui
        const htmlBuffer = [
          '<style>.visible { font-weight: bold; } .click { cursor: pointer; min-width: 150px;}</style>',
        ];
        scene.forEach((item, idx) => {
          htmlBuffer.push(
            `<div class="click visible" data-index="${idx}">${item.name}</div>`
          );
        });

        fullScreenRenderer.addController(htmlBuffer.join('\n'));
        const nodes = document.querySelectorAll('.click');
        for (let i = 0; i < nodes.length; i++) {
          const el = nodes[i];
          el.onclick = onClick;
        }
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
