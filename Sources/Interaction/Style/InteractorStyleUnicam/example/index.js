import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkAxesActor from 'vtk.js/Sources/Rendering/Core/AxesActor';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkInteractorStyleUnicam from 'vtk.js/Sources/Interaction/Style/InteractorStyleUnicam';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkMouseCameraTrackballZoomToMouseManipulator from 'vtk.js/Sources/Interaction/Manipulators/MouseCameraTrackballZoomToMouseManipulator';
import vtkOrientationMarkerWidget from 'vtk.js/Sources/Interaction/Widgets/OrientationMarkerWidget';

import controlPanel from './controlPanel.html';

// ----------------------------------------------------------------------------
// Renderer setup
// ----------------------------------------------------------------------------

const fullScreenRenderWindow = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderWindow = fullScreenRenderWindow.getRenderWindow();
const renderer = fullScreenRenderWindow.getRenderer();
fullScreenRenderWindow.addController(controlPanel);

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
// UI setup
// ----------------------------------------------------------------------------

function updateWorldUpVec() {
  let useWorldUpVec = document.querySelector('.useWorldUpVec').checked;

  const coordinateElements = Array.from(
    document.querySelector('.coordinates').children
  );
  coordinateElements.forEach((element) => {
    element.disabled = !useWorldUpVec;
  });

  if (useWorldUpVec) {
    const coordinates = coordinateElements.map((item) =>
      Number.parseFloat(item.value)
    );
    const validCoordinates = !coordinates.some(Number.isNaN);

    if (validCoordinates) {
      interactorStyle.setWorldUpVec(...coordinates);
    } else {
      useWorldUpVec = false;
    }
  }

  interactorStyle.setUseWorldUpVec(useWorldUpVec);
  renderWindow.render();
}

document.querySelector('.useWorldUpVec').oninput = updateWorldUpVec;
document.querySelector('.coordinates').oninput = updateWorldUpVec;

document.querySelector('.useOrientationMarker').oninput = (ev) => {
  orientationWidget.setEnabled(ev.target.checked);
};

document.querySelector('.useParallelCamera').oninput = (ev) => {
  renderer.getActiveCamera().setParallelProjection(ev.target.checked);
  renderWindow.render();
};

renderer
  .getActiveCamera()
  .onModified(orientationWidget.updateMarkerOrientation);

updateWorldUpVec();
