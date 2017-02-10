import vtkFullScreenRenderWindow  from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkOBJReader               from 'vtk.js/Sources/IO/Misc/OBJReader';
import vtkMTLReader               from 'vtk.js/Sources/IO/Misc/MTLReader';
import vtkOBJRepresentation       from 'vtk.js/Sources/Representation/Geometry/OBJRepresentation';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({ background: [0, 0, 0] });

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const reader = vtkOBJReader.newInstance({ splitMode: 'usemtl' });
const materialsReader = vtkMTLReader.newInstance();
const representation = vtkOBJRepresentation.newInstance();

function onClick(event) {
  const el = event.target;
  const index = Number(el.dataset.index);
  const actor = representation.getActors()[index];
  const visibility = actor.getVisibility();

  actor.setVisibility(!visibility);
  if (visibility) {
    el.classList.remove('visible');
  } else {
    el.classList.add('visible');
  }
  fullScreenRenderer.getRenderWindow().render();
}

representation.setOBJReader(reader);
representation.setMaterialsReader(materialsReader);

materialsReader.setUrl(`${__BASE_PATH__}/data/obj/starwars-millennium-falcon.mtl`);
reader.setUrl(`${__BASE_PATH__}/data/obj/starwars-millennium-falcon.obj`).then(() => {
  representation.update();
  fullScreenRenderer.addRepresentation(representation);
  fullScreenRenderer.getRenderer().resetCamera();
  fullScreenRenderer.getRenderWindow().render();

  // Build control ui
  const size = reader.getNumberOfOutputPorts();
  const htmlBuffer = ['<style>.visible { font-weight: bold; } .click { cursor: pointer; min-width: 150px;}</style>'];
  for (let i = 0; i < size; i++) {
    const name = reader.getOutputData(i).get('name').name;
    htmlBuffer.push(`<div class="click visible" data-index="${i}">${name}</div>`);
  }
  fullScreenRenderer.addController(htmlBuffer.join('\n'));
  const nodes = document.querySelectorAll('.click');
  for (let i = 0; i < nodes.length; i++) {
    const el = nodes[i];
    el.onclick = onClick;
  }
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.reader = reader;
global.materialsReader = materialsReader;
global.representation = representation;
global.fullScreenRenderer = fullScreenRenderer;
