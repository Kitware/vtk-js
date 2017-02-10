import vtkFullScreenRenderWindow  from '../../../../../Sources/Rendering/Misc/FullScreenRenderWindow';

import vtkOBJReader         from '../../../../../Sources/IO/Misc/OBJReader';
import vtkMTLReader         from '../../../../../Sources/IO/Misc/MTLReader';
import vtkOBJRepresentation from '../../../../../Sources/Representation/Geometry/OBJRepresentation';

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

representation.setOBJReader(reader);
representation.setMaterialsReader(materialsReader);

materialsReader.setUrl(`${__BASE_PATH__}/data/obj/starwars-millennium-falcon.mtl`);
reader.setUrl(`${__BASE_PATH__}/data/obj/starwars-millennium-falcon.obj`).then(() => {
  representation.update();
  fullScreenRenderer.addRepresentation(representation);
  fullScreenRenderer.getRenderer().resetCamera();
  fullScreenRenderer.getRenderWindow().render();
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.reader = reader;
global.materialsReader = materialsReader;
global.representation = representation;
global.fullScreenRenderer = fullScreenRenderer;
