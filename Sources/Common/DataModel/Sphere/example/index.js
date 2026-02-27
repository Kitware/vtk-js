import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkSphere from 'vtk.js/Sources/Common/DataModel/Sphere';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkSphereSource from '@kitware/vtk.js/Filters/Sources/SphereSource';

import GUI from 'lil-gui';

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

function makeSphereActor(
  center,
  radius,
  color,
  wireframe = false,
  opacity = 1.0
) {
  const source = vtkSphereSource.newInstance({
    center,
    radius,
    thetaResolution: 50,
    phiResolution: 50,
  });
  const mapper = vtkMapper.newInstance();
  mapper.setInputConnection(source.getOutputPort());

  const actor = vtkActor.newInstance();
  actor.setMapper(mapper);
  actor.getProperty().setColor(color[0], color[1], color[2]);
  actor.getProperty().setOpacity(opacity);
  if (wireframe) {
    actor.getProperty().setRepresentationToWireframe();
    actor.getProperty().setLineWidth(2);
  }
  return actor;
}

// ----------------------------------------------------------------------------
// Scene 1: bounding sphere from points (left side)
// ----------------------------------------------------------------------------
const points = [0.0, 0.0, 0.0, 2.0, 0.0, 0.0, 1.0, 1.0, 0.0, -1.0, 0.0, 0.0];
const pointBoundingSphere = vtkSphere.computeBoundingSphere(points);

for (let i = 0; i < points.length; i += 3) {
  const point = [points[i], points[i + 1], points[i + 2]];
  renderer.addActor(makeSphereActor(point, 0.08, [0.1, 0.7, 1.0]));
}

renderer.addActor(
  makeSphereActor(
    [pointBoundingSphere[0], pointBoundingSphere[1], pointBoundingSphere[2]],
    pointBoundingSphere[3],
    [1.0, 0.2, 0.2],
    true
  )
);

// ----------------------------------------------------------------------------
// Scene 2: bounding sphere from spheres (right side)
// ----------------------------------------------------------------------------
const xOffset = 8.0;
const spheres = [
  [0.0 + xOffset, 0.0, 0.0, 1.0],
  [4.0 + xOffset, 0.0, 0.0, 1.0],
  [2.0 + xOffset, 0.0, 0.0, 0.5],
];
const spheresBoundingSphere =
  vtkSphere.computeBoundingSphereFromSpheres(spheres);

spheres.forEach((sphere) => {
  renderer.addActor(
    makeSphereActor(
      [sphere[0], sphere[1], sphere[2]],
      sphere[3],
      [0.2, 1.0, 0.5],
      false,
      0.35
    )
  );
});

renderer.addActor(
  makeSphereActor(
    [
      spheresBoundingSphere[0],
      spheresBoundingSphere[1],
      spheresBoundingSphere[2],
    ],
    spheresBoundingSphere[3],
    [1.0, 0.75, 0.2],
    true
  )
);

renderer.setBackground(0.12, 0.14, 0.18);
renderer.resetCamera();
renderWindow.render();

const sceneGuide = {
  scene1: `Input: cyan points represented as small spheres
Result: red wireframe sphere
API: vtkSphere.computeBoundingSphere(points)`,
  scene2: `Input: green spheres
Result: orange wireframe sphere
API: vtkSphere.computeBoundingSphereFromSpheres(spheres)`,
};

const gui = new GUI({ title: 'Controls' });

function addReadOnlyTextArea(folder, object, key, label) {
  const controller = folder.add(object, key).name(label).listen().disable();
  controller.domElement.style.display = 'block';
  controller.domElement.style.minHeight = 'auto';
  const nameEl = controller.domElement.querySelector('.name');
  const widgetEl = controller.domElement.querySelector('.widget');
  if (nameEl) {
    nameEl.style.width = '100%';
    nameEl.style.paddingBottom = '4px';
  }
  if (widgetEl) {
    widgetEl.style.width = '100%';
  }
  const input = controller.domElement.querySelector('input');
  if (input && input.parentElement) {
    const textArea = document.createElement('textarea');
    textArea.value = String(object[key]);
    textArea.readOnly = true;
    textArea.rows = 5;
    textArea.style.width = '100%';
    textArea.style.resize = 'none';
    textArea.style.fontFamily = 'monospace';
    textArea.style.fontSize = '11px';
    input.parentElement.replaceChild(textArea, input);
  }
  return controller;
}

addReadOnlyTextArea(gui, sceneGuide, 'scene1', 'Left scene');
addReadOnlyTextArea(gui, sceneGuide, 'scene2', 'Right scene');
