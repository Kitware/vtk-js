import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMolecule from 'vtk.js/Sources/Common/DataModel/Molecule';
import vtkMoleculeToRepresentation from 'vtk.js/Sources/Filters/General/MoleculeToRepresentation';
import vtkSphereMapper from 'vtk.js/Sources/Rendering/Core/SphereMapper';
import vtkStickMapper from 'vtk.js/Sources/Rendering/Core/StickMapper';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';

import testMolecule from 'vtk.js/Data/molecule/test-multiple-bonds.cjson';
import baseline from './testMolecule_multiple_bonds.png';

test.onlyIfWebGL('Test MultipleBonds', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('Filter: MoleculeToRepresentation');

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

  const molecule = gc.registerResource(vtkMolecule.newInstance(testMolecule));
  const filter = gc.registerResource(vtkMoleculeToRepresentation.newInstance());
  const sphereMapper = gc.registerResource(vtkSphereMapper.newInstance());
  const stickMapper = gc.registerResource(vtkStickMapper.newInstance());
  const sphereActor = gc.registerResource(vtkActor.newInstance());
  const stickActor = gc.registerResource(vtkActor.newInstance());

  filter.setInputData(molecule);

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
  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  // capturing and comparing the images
  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baseline],
      'Filters/General/MoleculeToRepresentation/testMultipleBonds',
      t,
      1,
      gc.releaseResources
    );
  });
  renderWindow.render();
});
