import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow  from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader       from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkImageMapper             from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice              from 'vtk.js/Sources/Rendering/Core/ImageSlice';

import controlPanel from './controlPanel.html';


const fullScreenRenderWindow = vtkFullScreenRenderWindow.newInstance({ background: [0, 0, 0] });
const renderWindow = fullScreenRenderWindow.getRenderWindow();
const renderer = fullScreenRenderWindow.getRenderer();
fullScreenRenderWindow.addController(controlPanel);

const imageActorX = vtkImageSlice.newInstance();
const imageActorY = vtkImageSlice.newInstance();
const imageActorZ = vtkImageSlice.newInstance();

renderer.addActor(imageActorZ);
renderer.addActor(imageActorY);
renderer.addActor(imageActorX);

function updateColorLevel(e) {
  const colorLevel = Number((e ? e.target : document.querySelector('.colorLevel')).value);
  imageActorX.getProperty().setColorLevel(colorLevel);
  imageActorY.getProperty().setColorLevel(colorLevel);
  imageActorZ.getProperty().setColorLevel(colorLevel);
  renderWindow.render();
}

function updateColorWindow(e) {
  const colorLevel = Number((e ? e.target : document.querySelector('.colorWindow')).value);
  imageActorX.getProperty().setColorWindow(colorLevel);
  imageActorY.getProperty().setColorWindow(colorLevel);
  imageActorZ.getProperty().setColorWindow(colorLevel);
  renderWindow.render();
}

const reader = vtkHttpDataSetReader.newInstance({
  fetchGzip: true,
});
reader.setUrl(`${__BASE_PATH__}/data/volume/headsq.vti`, { loadData: true }).then(() => {
  const data = reader.getOutputData();
  const dataRange = data.getPointData().getScalars().getRange();
  const extent = data.getExtent();

  const imageMapperZ = vtkImageMapper.newInstance();
  imageMapperZ.setInputData(data);
  imageMapperZ.setZSliceIndex(30);
  imageActorZ.setMapper(imageMapperZ);

  const imageMapperY = vtkImageMapper.newInstance();
  imageMapperY.setInputData(data);
  imageMapperY.setYSliceIndex(30);
  imageActorY.setMapper(imageMapperY);

  const imageMapperX = vtkImageMapper.newInstance();
  imageMapperX.setInputData(data);
  imageMapperX.setXSliceIndex(30);
  imageActorX.setMapper(imageMapperX);

  renderer.resetCamera();
  renderer.resetCameraClippingRange();
  renderWindow.render();

  ['.sliceX', '.sliceY', '.sliceZ'].forEach((selector, idx) => {
    const el = document.querySelector(selector);
    el.setAttribute('min', extent[(idx * 2) + 0]);
    el.setAttribute('max', extent[(idx * 2) + 1]);
    el.setAttribute('value', 30);
  });

  ['.colorLevel', '.colorWindow'].forEach((selector) => {
    document.querySelector(selector).setAttribute('max', dataRange[1]);
    document.querySelector(selector).setAttribute('value', dataRange[1]);
  });
  document.querySelector('.colorLevel').setAttribute('value', (dataRange[0] + dataRange[1]) / 2);
  updateColorLevel();
  updateColorWindow();
});

document.querySelector('.sliceX').addEventListener('input', (e) => {
  imageActorX.getMapper().setXSliceIndex(Number(e.target.value));
  renderWindow.render();
});

document.querySelector('.sliceY').addEventListener('input', (e) => {
  imageActorY.getMapper().setYSliceIndex(Number(e.target.value));
  renderWindow.render();
});

document.querySelector('.sliceZ').addEventListener('input', (e) => {
  imageActorZ.getMapper().setZSliceIndex(Number(e.target.value));
  renderWindow.render();
});

document.querySelector('.colorLevel').addEventListener('input', updateColorLevel);
document.querySelector('.colorWindow').addEventListener('input', updateColorWindow);

global.fullScreen = fullScreenRenderWindow;
global.imageActorX = imageActorX;
global.imageActorY = imageActorY;
global.imageActorZ = imageActorZ;
