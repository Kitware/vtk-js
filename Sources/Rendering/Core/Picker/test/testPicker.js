import test from 'tape';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPicker from 'vtk.js/Sources/Rendering/Core/Picker';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRTAnalyticSource from 'vtk.js/Sources/Filters/Sources/RTAnalyticSource';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import 'vtk.js/Sources/Rendering/Profiles/Volume';

function setupRenderingComponents(gc) {
  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(
    document.createElement('div')
  );
  container.appendChild(renderWindowContainer);

  // create what we will view
  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  const renderer = gc.registerResource(vtkRenderer.newInstance());
  renderWindow.addRenderer(renderer);

  // now create something to view the scene, in this case webgl
  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  renderWindow.render();

  return renderer;
}

function createRenderingPipeline(filter) {
  const mapper = vtkMapper.newInstance();
  mapper.setInputConnection(filter.getOutputPort());
  const actor = vtkActor.newInstance();
  actor.setMapper(mapper);

  return actor;
}

test.onlyIfWebGL('vtkPicker.pick3DPoint - cone picking', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  const renderer = setupRenderingComponents(gc);

  const coneSource = vtkConeSource.newInstance({
    center: [0, 0, 0],
    radius: 1,
    height: 2,
    direction: [1, 0, 0],
  });

  const coneActor = createRenderingPipeline(coneSource);
  renderer.addActor(coneActor);

  const picker = vtkPicker.newInstance();

  const selectionPoint = [-1, 0, 0, 1.0];
  const focalPoint = [2, 0, 0, 1.0];
  picker.pick3DPoint(selectionPoint, focalPoint, renderer);

  const pickedActors = picker.getActors();
  t.equal(pickedActors[0], coneActor);

  gc.releaseResources();
});

test.onlyIfWebGL(
  'vtkPicker.pick3DPoint - non pickable actor is not picked',
  (t) => {
    const gc = testUtils.createGarbageCollector(t);
    const renderer = setupRenderingComponents(gc);

    const coneSource = vtkConeSource.newInstance({
      center: [0, 0, 0],
      radius: 1,
      height: 2,
      direction: [1, 0, 0],
    });

    const coneActor = createRenderingPipeline(coneSource);
    renderer.addActor(coneActor);

    const picker = vtkPicker.newInstance();

    const selectionPoint = [-1, 0, 0, 1.0];
    const focalPoint = [2, 0, 0, 1.0];
    picker.pick3DPoint(selectionPoint, focalPoint, renderer);

    let pickedActors = picker.getActors();
    t.equal(pickedActors[0], coneActor);

    coneActor.setPickable(false);
    picker.pick3DPoint(selectionPoint, focalPoint, renderer);
    pickedActors = picker.getActors();
    t.equal(pickedActors.length, 0);

    gc.releaseResources();
  }
);

test.onlyIfWebGL('vtkPicker.pick3DPoint - multiple actors', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  const renderer = setupRenderingComponents(gc);

  // create what we will view
  const coneSource1 = vtkConeSource.newInstance({
    center: [0, 0, 0],
    radius: 1,
    height: 2,
    direction: [1, 0, 0],
  });

  const coneSource2 = vtkConeSource.newInstance({
    center: [0, 1, 0],
    radius: 1,
    height: 2,
    direction: [0, 1, 0],
  });

  const coneActor1 = createRenderingPipeline(coneSource1);
  renderer.addActor(coneActor1);

  const coneActor2 = createRenderingPipeline(coneSource2);
  renderer.addActor(coneActor2);

  const picker = vtkPicker.newInstance();

  const selectionPoint = [-1, 0, 0, 1.0];
  const focalPoint = [2, 0, 0, 1.0];
  picker.pick3DPoint(selectionPoint, focalPoint, renderer);

  const pickedActors = picker.getActors();
  t.equal(pickedActors.length, 2);

  gc.releaseResources();
});

test.onlyIfWebGL('vtkPicker.pick - volume', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  const renderer = setupRenderingComponents(gc);

  const source = vtkRTAnalyticSource.newInstance();
  const size = 50;
  source.setWholeExtent([0, size, 0, size, 0, size]);
  source.update();

  const volumeMapper = vtkVolumeMapper.newInstance();
  volumeMapper.setInputConnection(source.getOutputPort());
  const volume = vtkVolume.newInstance();
  volume.setMapper(volumeMapper);
  renderer.addVolume(volume);

  const picker = vtkPicker.newInstance();

  picker.setPickFromList(1);
  picker.initializePickList();
  picker.addPickList(volume);

  picker.pick([200, 200, 1.0], renderer);

  const pickedActors = picker.getActors();
  t.equal(pickedActors.length, 1);
  t.ok(pickedActors[0] === volume);

  gc.releaseResources();
});

test('Test vtkPicker instance', (t) => {
  t.ok(vtkPicker, 'Make sure the class definition exists');
  const instance = vtkPicker.newInstance();
  t.ok(instance);
  t.end();
});
