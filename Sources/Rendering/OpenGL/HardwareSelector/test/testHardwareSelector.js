import test from 'tape-catch';

import vtkOpenGLRenderWindow      from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkOpenGLHardwareSelector  from 'vtk.js/Sources/Rendering/OpenGL/HardwareSelector';
import vtkRenderWindow            from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer                from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkActor                   from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper                  from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPlaneSource             from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkSphereSource            from 'vtk.js/Sources/Filters/Sources/SphereSource';
import { FieldAssociations }      from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';

test.onlyIfWebGL('Test HardwareSelector', (tapeContext) => {
  tapeContext.ok('rendering', 'vtkOpenGLHardwareSelector TestHardwareSelector');

  // Create some control UI
  const container = document.querySelector('body');
  const renderWindowContainer = document.createElement('div');
  container.appendChild(renderWindowContainer);

  // create what we will view
  const renderWindow = vtkRenderWindow.newInstance();
  const renderer = vtkRenderer.newInstance();
  renderWindow.addRenderer(renderer);
  renderer.setBackground(0.32, 0.34, 0.43);

  const actor = vtkActor.newInstance();
  renderer.addActor(actor);

  const mapper = vtkMapper.newInstance();
  actor.setMapper(mapper);

  const PlaneSource = vtkPlaneSource.newInstance({ xResolution: 5, yResolution: 10 });
  mapper.setInputConnection(PlaneSource.getOutputPort());

  const actor2 = vtkActor.newInstance();
  renderer.addActor(actor2);

  const mapper2 = vtkMapper.newInstance();
  actor2.setMapper(mapper2);

  const SphereSource = vtkSphereSource.newInstance();
  mapper2.setInputConnection(SphereSource.getOutputPort());

  const actor3 = vtkActor.newInstance();
  actor3.getProperty().setEdgeVisibility(true);
  actor3.getProperty().setEdgeColor(1.0, 0.5, 0.5);
  actor3.getProperty().setDiffuseColor(0.5, 1.0, 0.5);
  actor3.setPosition(1.0, 1.0, 1.0);
  renderer.addActor(actor3);
  const mapper3 = vtkMapper.newInstance();
  actor3.setMapper(mapper3);
  mapper3.setInputConnection(SphereSource.getOutputPort());

  // now create something to view it, in this case webgl
  const glwindow = vtkOpenGLRenderWindow.newInstance();
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);
  glwindow.traverseAllPasses();

  const sel = vtkOpenGLHardwareSelector.newInstance();
  sel.setFieldAssociation(FieldAssociations.FIELD_ASSOCIATION_POINTS);
  sel.attach(glwindow, renderer);

  sel.setArea(200, 200, 300, 300);
  const res = sel.select();
  const allGood = (res.length === 2 &&
    res[0].getProperties().prop === actor &&
    res[1].getProperties().prop === actor3);

  tapeContext.ok(res.length === 2, 'Two props selected');
  tapeContext.ok(allGood, 'Correct props were selected');

  // Free memory
  // glwindow.delete();
  // renderWindow.delete();
  // renderer.delete();
  // mapper.delete();
  // actor.delete();
  container.removeChild(renderWindowContainer);

  tapeContext.end();
});
