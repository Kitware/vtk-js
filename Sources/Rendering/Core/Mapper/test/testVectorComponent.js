import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkLookupTable from 'vtk.js/Sources/Common/Core/LookupTable';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

import baseline from './testVectorComponent.png';

const { GetArray } = vtkMapper;

test.onlyIfWebGL('Test VectorComponent', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkMapper Vector Component');

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

  const actor = gc.registerResource(vtkActor.newInstance());
  renderer.addActor(actor);

  const mapper = gc.registerResource(vtkMapper.newInstance());
  actor.setMapper(mapper);

  const sphereSource = gc.registerResource(vtkSphereSource.newInstance());
  sphereSource.setThetaResolution(30);
  sphereSource.setPhiResolution(16);
  mapper.setInputConnection(sphereSource.getOutputPort());

  const lut = vtkLookupTable.newInstance();
  lut.setVectorComponent(1);
  lut.setVectorModeToComponent(); // the default
  mapper.setLookupTable(lut);
  mapper.setScalarModeToUsePointFieldData();
  mapper.setArrayAccessMode(GetArray.BY_NAME);
  mapper.setColorByArrayName('Normals');
  mapper.setScalarVisibility(true);
  mapper.setScalarRange(-1.0, 1.0);

  // now create something to view it, in this case webgl
  const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  renderWindow.render();

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baseline],
      'Rendering/Core/Mapper/testVectorComponent.js',
      t,
      5,
      gc.releaseResources
    );
  });
  renderWindow.render();
});
