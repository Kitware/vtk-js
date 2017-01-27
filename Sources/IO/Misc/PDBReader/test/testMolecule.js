import test from 'tape-catch';

import vtkActor                         from '../../../../../Sources/Rendering/Core/Actor';
import vtkMoleculeToRepresentation      from '../../../../../Sources/Filters/General/MoleculeToRepresentation';
import vtkOpenGLRenderWindow            from '../../../../Rendering/OpenGL/RenderWindow';
import vtkPDBReader                     from '../../../../../Sources/IO/Misc/PDBReader';
import vtkSphereMapper                  from '../../../../../Sources/Rendering/Core/SphereMapper';
import vtkStickMapper                   from '../../../../../Sources/Rendering/Core/StickMapper';
import vtkRenderer                      from '../../../../Rendering/Core/Renderer';
import vtkRenderWindow                  from '../../../../Rendering/Core/RenderWindow';

import { AttributeTypes }               from '../../../../../Sources/Common/DataModel/DataSetAttributes/Constants';
import { FieldDataTypes }               from '../../../../../Sources/Common/DataModel/DataSet/Constants';
import { Representation }               from '../../../../../Sources/Rendering/Core/Property/Constants';

// import baseline                         from './testMolecule.png';
import baseline                         from './testMolecule_with_bonds.png';
import testUtils                        from '../../../../Testing/testUtils';


test.onlyIfWebGL('Test MoleculeMapper', (t) => {
  t.ok('IO: PDBReader', 'Filter: MoleculeToRepresentation');

  // Create some control UI
  const container = document.querySelector('body');
  const renderWindowContainer = document.createElement('div');
  container.appendChild(renderWindowContainer);

  // create what we will view
  const renderWindow = vtkRenderWindow.newInstance();
  const renderer = vtkRenderer.newInstance();
  renderWindow.addRenderer(renderer);
  renderer.setBackground(0.32, 0.34, 0.43);

  // ----------------------------------------------------------------------------
  // Test code
  // ----------------------------------------------------------------------------

  const reader = vtkPDBReader.newInstance();
  const filter = vtkMoleculeToRepresentation.newInstance();
  const sphereMapper = vtkSphereMapper.newInstance();
  const stickMapper = vtkStickMapper.newInstance();
  const sphereActor = vtkActor.newInstance();
  const stickActor = vtkActor.newInstance();

  reader.setHideHydrogen(false);

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
  const glwindow = vtkOpenGLRenderWindow.newInstance();
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  // fetch caffeine.pdb file from Girder
  reader.setUrl('https://data.kitware.com/api/v1/item/588652298d777f4f3f30849e/download').then(() => {
    // once data uplaod, render
    renderer.resetCamera();
    renderWindow.render();

    // the data have to be uploaded before capturing and comparing the images
    const image = glwindow.captureImage();
    testUtils.compareImages(image, [baseline], 'IO/Misc/PDBReader', t);
  });
});
