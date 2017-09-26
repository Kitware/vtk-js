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

const reader = vtkHttpDataSetReader.newInstance({
  fetchGzip: true,
});
reader.setUrl(`${__BASE_PATH__}/data/volume/headsq.vti`).then(() => {
  reader.loadData().then(() => {
    const data = reader.getOutputData();
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

    document.querySelector('.sliceX').setAttribute('max', imageActorX.getMapper().getInputData().getExtent()[1]);
    document.querySelector('.sliceX').setAttribute('value', 30);
    document.querySelector('.sliceY').setAttribute('max', imageActorY.getMapper().getInputData().getExtent()[3]);
    document.querySelector('.sliceY').setAttribute('value', 30);
    document.querySelector('.sliceZ').setAttribute('max', imageActorZ.getMapper().getInputData().getExtent()[5]);
    document.querySelector('.sliceZ').setAttribute('value', 30);
  });
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

global.fullScreen = fullScreenRenderWindow;
global.imageActorX = imageActorX;
global.imageActorY = imageActorY;
global.imageActorZ = imageActorZ;
