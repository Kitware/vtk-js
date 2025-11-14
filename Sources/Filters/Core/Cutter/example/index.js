import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkCutter from '@kitware/vtk.js/Filters/Core/Cutter';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import HttpDataAccessHelper from '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import DataAccessHelper from '@kitware/vtk.js/IO/Core/DataAccessHelper';

import vtkHttpSceneLoader from '@kitware/vtk.js/IO/Core/HttpSceneLoader';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkPlane from '@kitware/vtk.js/Common/DataModel/Plane';
import vtkProperty from '@kitware/vtk.js/Rendering/Core/Property';

import GUI from 'lil-gui';

// Force DataAccessHelper to have access to various data source
import '@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const plane = vtkPlane.newInstance();

const cutter = vtkCutter.newInstance();
cutter.setCutFunction(plane);

const cutMapper = vtkMapper.newInstance();
cutMapper.setInputConnection(cutter.getOutputPort());
const cutActor = vtkActor.newInstance();
cutActor.setMapper(cutMapper);
const cutProperty = cutActor.getProperty();
cutProperty.setRepresentation(vtkProperty.Representation.WIREFRAME);
cutProperty.setLighting(false);
cutProperty.setColor(0, 1, 0);
renderer.addActor(cutActor);

const cubeMapper = vtkMapper.newInstance();
cubeMapper.setScalarVisibility(false);
const cubeActor = vtkActor.newInstance();
cubeActor.setMapper(cubeMapper);
const cubeProperty = cubeActor.getProperty();
cubeProperty.setRepresentation(vtkProperty.Representation.WIREFRAME);
cubeProperty.setLighting(false);
cubeProperty.setOpacity(0.1);
renderer.addActor(cubeActor);

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

const state = {
  originX: 0,
  originY: 0,
  originZ: 0,
  normalX: 1,
  normalY: 0,
  normalZ: 0,
};

const updatePlaneFunction = () => {
  plane.setOrigin(state.originX, state.originY, state.originZ);
  plane.setNormal(state.normalX, state.normalY, state.normalZ);
  renderWindow.render();
};

const gui = new GUI();

const originFolder = gui.addFolder('Origin');
originFolder
  .add(state, 'originX', -6, 6, 0.01)
  .name('X')
  .onChange((value) => {
    state.originX = Number(value);
    updatePlaneFunction();
  });
originFolder
  .add(state, 'originY', -0.5, 0.5, 0.01)
  .name('Y')
  .onChange((value) => {
    state.originY = Number(value);
    updatePlaneFunction();
  });
originFolder
  .add(state, 'originZ', -0.5, 0.5, 0.01)
  .name('Z')
  .onChange((value) => {
    state.originZ = Number(value);
    updatePlaneFunction();
  });

const normalFolder = gui.addFolder('Normal');
normalFolder
  .add(state, 'normalX', -1, 1, 0.01)
  .name('X')
  .onChange((value) => {
    state.normalX = Number(value);
    updatePlaneFunction();
  });
normalFolder
  .add(state, 'normalY', -1, 1, 0.01)
  .name('Y')
  .onChange((value) => {
    state.normalY = Number(value);
    updatePlaneFunction();
  });
normalFolder
  .add(state, 'normalZ', -1, 1, 0.01)
  .name('Z')
  .onChange((value) => {
    state.normalZ = Number(value);
    updatePlaneFunction();
  });

HttpDataAccessHelper.fetchBinary(
  `${__BASE_PATH__}/data/StanfordDragon.vtkjs`,
  {}
).then((zipContent) => {
  const dataAccessHelper = DataAccessHelper.get('zip', {
    zipContent,
    callback: (zip) => {
      const sceneImporter = vtkHttpSceneLoader.newInstance({
        renderer,
        dataAccessHelper,
      });
      sceneImporter.setUrl('index.json');
      sceneImporter.onReady(() => {
        console.log(sceneImporter.getScene());
        sceneImporter.getScene()[0].actor.setVisibility(false);

        const source = sceneImporter.getScene()[0].source;
        cutter.setInputConnection(source.getOutputPort());
        cubeMapper.setInputConnection(source.getOutputPort());
        renderer.resetCamera();
        updatePlaneFunction();
      });
    },
  });
});
