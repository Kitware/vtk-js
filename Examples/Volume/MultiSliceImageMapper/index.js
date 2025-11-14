import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Volume';

// Force DataAccessHelper to have access to various data source
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkImageMapper from '@kitware/vtk.js/Rendering/Core/ImageMapper';
import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice';

import GUI from 'lil-gui';

const fullScreenRenderWindow = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderWindow = fullScreenRenderWindow.getRenderWindow();
const renderer = fullScreenRenderWindow.getRenderer();

const imageActorI = vtkImageSlice.newInstance();
const imageActorJ = vtkImageSlice.newInstance();
const imageActorK = vtkImageSlice.newInstance();

renderer.addActor(imageActorK);
renderer.addActor(imageActorJ);
renderer.addActor(imageActorI);

const gui = new GUI();
const params = {
  sliceI: 30,
  sliceJ: 30,
  sliceK: 30,
  colorLevel: 0,
  colorWindow: 0,
};

let sliceICtrl;
let sliceJCtrl;
let sliceKCtrl;
let colorLevelCtrl;
let colorWindowCtrl;

function updateColorLevel(value) {
  const colorLevel = Number(value);
  imageActorI.getProperty().setColorLevel(colorLevel);
  imageActorJ.getProperty().setColorLevel(colorLevel);
  imageActorK.getProperty().setColorLevel(colorLevel);
  renderWindow.render();
}

function updateColorWindow(value) {
  const colorWindow = Number(value);
  imageActorI.getProperty().setColorWindow(colorWindow);
  imageActorJ.getProperty().setColorWindow(colorWindow);
  imageActorK.getProperty().setColorWindow(colorWindow);
  renderWindow.render();
}

const reader = vtkHttpDataSetReader.newInstance({
  fetchGzip: true,
});
reader
  .setUrl(`${__BASE_PATH__}/data/volume/headsq.vti`, { loadData: true })
  .then(() => {
    const data = reader.getOutputData();
    const dataRange = data.getPointData().getScalars().getRange();
    const extent = data.getExtent();

    const imageMapperK = vtkImageMapper.newInstance();
    imageMapperK.setInputData(data);
    imageMapperK.setKSlice(params.sliceK);
    imageActorK.setMapper(imageMapperK);

    const imageMapperJ = vtkImageMapper.newInstance();
    imageMapperJ.setInputData(data);
    imageMapperJ.setJSlice(params.sliceJ);
    imageActorJ.setMapper(imageMapperJ);

    const imageMapperI = vtkImageMapper.newInstance();
    imageMapperI.setInputData(data);
    imageMapperI.setISlice(params.sliceI);
    imageActorI.setMapper(imageMapperI);

    renderer.resetCamera();
    renderer.resetCameraClippingRange();
    renderWindow.render();

    sliceICtrl.min(extent[0]);
    sliceICtrl.max(extent[1]);
    sliceICtrl.setValue(params.sliceI);
    sliceICtrl.updateDisplay?.();

    sliceJCtrl.min(extent[2]);
    sliceJCtrl.max(extent[3]);
    sliceJCtrl.setValue(params.sliceJ);
    sliceJCtrl.updateDisplay?.();

    sliceKCtrl.min(extent[4]);
    sliceKCtrl.max(extent[5]);
    sliceKCtrl.setValue(params.sliceK);
    sliceKCtrl.updateDisplay?.();

    colorLevelCtrl.min(dataRange[0]);
    colorLevelCtrl.max(dataRange[1]);
    params.colorLevel = (dataRange[0] + dataRange[1]) / 2;
    colorLevelCtrl.setValue(params.colorLevel);
    colorLevelCtrl.updateDisplay?.();

    colorWindowCtrl.min(0);
    colorWindowCtrl.max(dataRange[1]);
    params.colorWindow = dataRange[1];
    colorWindowCtrl.setValue(params.colorWindow);
    colorWindowCtrl.updateDisplay?.();

    updateColorLevel(params.colorLevel);
    updateColorWindow(params.colorWindow);
  });

sliceICtrl = gui
  .add(params, 'sliceI')
  .name('Slice I')
  .onChange((value) => {
    const mapper = imageActorI.getMapper();
    if (mapper) {
      mapper.setISlice(Number(value));
      renderWindow.render();
    }
  });

sliceJCtrl = gui
  .add(params, 'sliceJ')
  .name('Slice J')
  .onChange((value) => {
    const mapper = imageActorJ.getMapper();
    if (mapper) {
      mapper.setJSlice(Number(value));
      renderWindow.render();
    }
  });

sliceKCtrl = gui
  .add(params, 'sliceK')
  .name('Slice K')
  .onChange((value) => {
    const mapper = imageActorK.getMapper();
    if (mapper) {
      mapper.setKSlice(Number(value));
      renderWindow.render();
    }
  });

colorLevelCtrl = gui
  .add(params, 'colorLevel')
  .name('Color level')
  .onChange((value) => {
    updateColorLevel(value);
  });

colorWindowCtrl = gui
  .add(params, 'colorWindow')
  .name('Color window')
  .onChange((value) => {
    updateColorWindow(value);
  });

global.fullScreen = fullScreenRenderWindow;
global.imageActorI = imageActorI;
global.imageActorJ = imageActorJ;
global.imageActorK = imageActorK;
