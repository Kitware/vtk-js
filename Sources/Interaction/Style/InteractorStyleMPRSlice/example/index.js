import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkInteractorStyleMPRSlice from 'vtk.js/Sources/Interaction/Style/InteractorStyleMPRSlice';

import controlPanel from './controlPanel.html';

const fullScreenRenderWindow = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderWindow = fullScreenRenderWindow.getRenderWindow();
const renderer = fullScreenRenderWindow.getRenderer();
fullScreenRenderWindow.addController(controlPanel);

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
// UI
// ----------------------------------------------------------------------------

function updateUI() {
  const range = istyle.getSliceRange();
  const slice = istyle.getSlice();
  const normal = istyle.getSliceNormal();

  const sliceSlider = document.querySelector('.slice');
  sliceSlider.min = range[0];
  sliceSlider.max = range[1];
  sliceSlider.value = slice;

  function toFixed(n) {
    return Number.parseFloat(n).toFixed(6);
  }

  document.querySelector('.sliceText').innerText = toFixed(slice);
  document.querySelector('.normal').innerText = normal.map(toFixed).join(', ');
  document.querySelector('.range').innerText = range.map(toFixed).join(', ');
}

document.querySelector('.slice').oninput = function onInput(ev) {
  istyle.setSlice(Number.parseFloat(ev.target.value));
  renderWindow.render();
};

istyle.onModified(updateUI);
updateUI();
