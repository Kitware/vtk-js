import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Volume';

// use full HttpDataAccessHelper
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';
import vtkInteractorStyleMPRSlice from '@kitware/vtk.js/Interaction/Style/InteractorStyleMPRSlice';

import GUI from 'lil-gui';

const fullScreenRenderWindow = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderWindow = fullScreenRenderWindow.getRenderWindow();
const renderer = fullScreenRenderWindow.getRenderer();

const istyle = vtkInteractorStyleMPRSlice.newInstance();
renderWindow.getInteractor().setInteractorStyle(istyle);

global.fullScreen = fullScreenRenderWindow;
global.renderWindow = renderWindow;

// ----------------------------------------------------------------------------
// Volume rendering
// ----------------------------------------------------------------------------

const actor = vtkVolume.newInstance();
const mapper = vtkVolumeMapper.newInstance();
actor.setMapper(mapper);

const reader = vtkHttpDataSetReader.newInstance({
  fetchGzip: true,
});
reader
  .setUrl(`${__BASE_PATH__}/data/volume/headsq.vti`, { loadData: true })
  .then(() => {
    const data = reader.getOutputData();

    mapper.setInputData(data);

    // set interactor style volume mapper after mapper sets input data
    istyle.setVolumeMapper(mapper);
    istyle.setSliceNormal(0, 0, 1);

    const range = istyle.getSliceRange();
    istyle.setSlice((range[0] + range[1]) / 2);

    renderer.addVolume(actor);
    renderWindow.render();
  });

// ----------------------------------------------------------------------------
// UI (lil-gui)
// ----------------------------------------------------------------------------

const gui = new GUI();
const params = {
  Slice: 0,
  SliceRange: '',
  SliceNormal: '',
};

const sliceCtrl = gui
  .add(params, 'Slice')
  .name('Slice')
  .onChange((value) => {
    istyle.setSlice(Number(value));
    renderWindow.render();
  });

gui.add(params, 'SliceRange').name('Slice Range').listen();
gui.add(params, 'SliceNormal').name('Slice Normal').listen();

function updateUI() {
  const range = istyle.getSliceRange();
  const slice = istyle.getSlice();
  const normal = istyle.getSliceNormal();

  sliceCtrl.min(range[0]);
  sliceCtrl.max(range[1]);
  sliceCtrl.setValue(slice);

  function toFixed(n) {
    return Number.parseFloat(n).toFixed(6);
  }

  params.SliceRange = range.map(toFixed).join(', ');
  params.SliceNormal = normal.map(toFixed).join(', ');
  sliceCtrl.updateDisplay?.();
}

istyle.onModified(updateUI);
updateUI();
