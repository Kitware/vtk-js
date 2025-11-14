import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkAxesActor from '@kitware/vtk.js/Rendering/Core/AxesActor';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkInteractorStyleUnicam from '@kitware/vtk.js/Interaction/Style/InteractorStyleUnicam';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkMouseCameraTrackballZoomToMouseManipulator from '@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballZoomToMouseManipulator';
import vtkOrientationMarkerWidget from '@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget';

import GUI from 'lil-gui';

// ----------------------------------------------------------------------------
// Renderer setup
// ----------------------------------------------------------------------------

const fullScreenRenderWindow = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderWindow = fullScreenRenderWindow.getRenderWindow();
const renderer = fullScreenRenderWindow.getRenderer();

// ----------------------------------------------------------------------------
// Interactor style setup
// ----------------------------------------------------------------------------

const interactorStyle = vtkInteractorStyleUnicam.newInstance();
interactorStyle.setWorldUpVec([0, 1, 0]);
interactorStyle.addMouseManipulator(
  vtkMouseCameraTrackballZoomToMouseManipulator.newInstance({
    scrollEnabled: true,
  })
);
interactorStyle.setRotationFactor(2);
interactorStyle.setFocusSphereColor(1, 0, 0);
interactorStyle.setFocusSphereRadiusFactor(1.2);
renderWindow.getInteractor().setInteractorStyle(interactorStyle);

// ----------------------------------------------------------------------------
// Basic actor setup
// ----------------------------------------------------------------------------

const coneSource = vtkConeSource.newInstance({ height: 1.0 });
const mapper = vtkMapper.newInstance();
mapper.setInputConnection(coneSource.getOutputPort());

const actor = vtkActor.newInstance();
actor.rotateZ(90);
actor.setMapper(mapper);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

// ----------------------------------------------------------------------------
// Orientation widget setup
// ----------------------------------------------------------------------------
const axes = vtkAxesActor.newInstance({ pickable: false });
const orientationWidget = vtkOrientationMarkerWidget.newInstance({
  actor: axes,
  interactor: renderWindow.getInteractor(),
});
orientationWidget.setViewportCorner(
  vtkOrientationMarkerWidget.Corners.BOTTOM_RIGHT
);
orientationWidget.setMinPixelSize(100);
orientationWidget.setMaxPixelSize(300);

// ----------------------------------------------------------------------------
// UI setup (lil-gui)
// ----------------------------------------------------------------------------

const gui = new GUI();
const params = {
  UseWorldUpVec: false,
  WorldUpX: 0,
  WorldUpY: 1,
  WorldUpZ: 0,
  OrientationMarker: false,
  ParallelCamera: false,
};

function applyWorldUpVec() {
  let useWorldUpVec = params.UseWorldUpVec;
  const coordinates = [params.WorldUpX, params.WorldUpY, params.WorldUpZ].map(
    (v) => Number.parseFloat(v)
  );
  const validCoordinates = !coordinates.some(Number.isNaN);

  if (useWorldUpVec && validCoordinates) {
    interactorStyle.setWorldUpVec(...coordinates);
  } else if (useWorldUpVec && !validCoordinates) {
    useWorldUpVec = false;
  }

  interactorStyle.setUseWorldUpVec(useWorldUpVec);
  renderWindow.render();
}

gui
  .add(params, 'UseWorldUpVec')
  .name('Use World Up Vector')
  .onChange(() => applyWorldUpVec());

['WorldUpX', 'WorldUpY', 'WorldUpZ'].forEach((key, index) => {
  gui
    .add(params, key, -1, 1, 0.1)
    .name(['Up X', 'Up Y', 'Up Z'][index])
    .onChange(() => applyWorldUpVec());
});

gui
  .add(params, 'OrientationMarker')
  .name('Orientation Marker')
  .onChange((value) => {
    orientationWidget.setEnabled(!!value);
  });

gui
  .add(params, 'ParallelCamera')
  .name('Parallel Projection')
  .onChange((value) => {
    renderer.getActiveCamera().setParallelProjection(!!value);
    renderWindow.render();
  });

renderer
  .getActiveCamera()
  .onModified(orientationWidget.updateMarkerOrientation);

applyWorldUpVec();
