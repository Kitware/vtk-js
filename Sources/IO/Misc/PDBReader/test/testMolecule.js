import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMoleculeToRepresentation from 'vtk.js/Sources/Filters/General/MoleculeToRepresentation';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkPDBReader from 'vtk.js/Sources/IO/Misc/PDBReader';
import vtkSphereMapper from 'vtk.js/Sources/Rendering/Core/SphereMapper';
import vtkStickMapper from 'vtk.js/Sources/Rendering/Core/StickMapper';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';

import baseline from './testMolecule_with_bonds.png';

test.onlyIfWebGL('Test MoleculeMapper', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('IO: PDBReader', 'Filter: MoleculeToRepresentation');

  // Create some control UI
  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(
    document.createElement('div')
  );
  container.appendChild(renderWindowContainer);

  // create what we will view
  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  const renderer = gc.registerResource(vtkRenderer.newInstance());
  renderWindow.addRenderer(renderer);
  renderer.setBackground(0.32, 0.34, 0.43);

  // ----------------------------------------------------------------------------
  // Test code
  // ----------------------------------------------------------------------------

  const reader = gc.registerResource(vtkPDBReader.newInstance());
  const filter = gc.registerResource(vtkMoleculeToRepresentation.newInstance());
  const sphereMapper = gc.registerResource(vtkSphereMapper.newInstance());
  const stickMapper = gc.registerResource(vtkStickMapper.newInstance());
  const sphereActor = gc.registerResource(vtkActor.newInstance());
  const stickActor = gc.registerResource(vtkActor.newInstance());

  filter.setInputConnection(reader.getOutputPort());
  filter.setRadiusType('radiusCovalent');

  // render sphere
  sphereMapper.setInputConnection(filter.getOutputPort(0));
  sphereMapper.setScaleArray(filter.getSphereScaleArrayName());
  sphereActor.setMapper(sphereMapper);

  // render sticks
  stickMapper.setInputConnection(filter.getOutputPort(1));
  stickMapper.setScaleArray('stickScales');
  stickMapper.setOrientationArray('orientation');
  stickActor.setMapper(stickMapper);

  renderer.addActor(sphereActor);
  renderer.addActor(stickActor);
  renderer.resetCamera();
  renderWindow.render();

  // -----------------------------------------------------------
  // Make some variables global so that you can inspect and
  // modify objects in your browser's developer console:
  // -----------------------------------------------------------

  // create something to view it, in this case webgl
  const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  // fetch caffeine.pdb file from Girder
  t.ok('waiting for download');
  reader.setUrl(`${__BASE_PATH__}/Data/molecule/pdb/caffeine.pdb`).then(() => {
    t.ok('download complete');

    // once data upload, render
    renderer.resetCamera();
    renderWindow.render();

    // the data have to be uploaded before capturing and comparing the images
    glwindow.captureNextImage().then((image) => {
      testUtils.compareImages(
        image,
        [baseline],
        'IO/Misc/PDBReader',
        t,
        1,
        gc.releaseResources
      );
    });
    renderWindow.render();
  });
});
