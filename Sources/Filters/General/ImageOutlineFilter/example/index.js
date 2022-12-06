import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Volume';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkImageMapper from '@kitware/vtk.js/Rendering/Core/ImageMapper';
import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData';
import vtkImageOutlineFilter from '@kitware/vtk.js/Filters/General/ImageOutlineFilter';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import controlPanel from './controlPanel.html';

const fullScreenRenderWindow = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderWindow = fullScreenRenderWindow.getRenderWindow();
const renderer = fullScreenRenderWindow.getRenderer();
fullScreenRenderWindow.addController(controlPanel);

const imageActor = vtkImageSlice.newInstance();
const imageMapper = vtkImageMapper.newInstance();
const labelmapMapper = vtkImageMapper.newInstance();
const labelmapActor = vtkImageSlice.newInstance();
const opFun = vtkPiecewiseFunction.newInstance();
opFun.addPoint(0, 0); // our background value, 0, will be invisible
opFun.addPoint(0.5, 1);
opFun.addPoint(1, 1);
const cFun = vtkColorTransferFunction.newInstance();
cFun.addRGBPoint(1, 1, 0, 0);
cFun.addRGBPoint(2, 0, 0, 1);
cFun.addRGBPoint(3, 0, 1, 0);
labelmapActor.getProperty().setPiecewiseFunction(opFun);
labelmapActor.getProperty().setRGBTransferFunction(cFun);
imageActor.getProperty().setInterpolationType(0);
labelmapActor.getProperty().setInterpolationType(0);
renderer.addActor(imageActor);
renderer.addActor(labelmapActor);
const outline = vtkImageOutlineFilter.newInstance();
const reader = vtkHttpDataSetReader.newInstance({
  fetchGzip: true,
});
reader
  .setUrl(`${__BASE_PATH__}/data/volume/headsq.vti`, { loadData: true })
  .then(() => {
    const data = reader.getOutputData();
    const extent = data.getExtent();
    const labelMap = vtkImageData.newInstance(
      data.get('spacing', 'origin', 'direction')
    );
    labelMap.setDimensions(data.getDimensions());
    labelMap.computeTransforms();

    // right now only support 256 labels
    const values = new Uint8Array(data.getNumberOfPoints());
    data
      .getPointData()
      .getScalars()
      .getData()
      .forEach((el, index) => {
        if (el > 50) {
          if (el > 100) {
            if (el > 150) {
              values[index] = 3;
            } else values[index] = 2;
          } else values[index] = 1;
        } else values[index] = 0;
      });
    const dataArray = vtkDataArray.newInstance({
      numberOfComponents: 1, // labelmap with single component
      values,
    });
    labelMap.getPointData().setScalars(dataArray);
    outline.setInputData(labelMap);
    outline.setSlicingMode(2);
    imageMapper.setInputData(data);
    imageMapper.setSlicingMode(2);
    imageMapper.setSlice(30);
    imageActor.setMapper(imageMapper);
    labelmapMapper.setInputData(outline.getOutputData());
    labelmapMapper.setSlice(30);
    imageMapper.onModified(() => {
      labelmapMapper.setSlice(imageMapper.getSlice());
    });
    labelmapActor.setMapper(labelmapMapper);
    const el = document.querySelector('.sliceK');
    el.setAttribute('min', extent[4]);
    el.setAttribute('max', extent[5]);
    el.setAttribute('value', 30);
    document.querySelector('.isFilterOn').addEventListener('change', (e) => {
      labelmapMapper.setInputData(
        e.target.checked ? outline.getOutputData() : labelMap
      );
      renderWindow.render();
    });
    renderer.resetCamera();
    renderer.resetCameraClippingRange();
    renderWindow.render();
  });
document.querySelector('.sliceK').addEventListener('input', (e) => {
  imageActor.getMapper().setSlice(Number(e.target.value));
  renderWindow.render();
});
document.querySelector('.axis').addEventListener('input', (ev) => {
  const sliceMode = 'IJKXYZ'.indexOf(ev.target.value);
  imageMapper.setSlicingMode(sliceMode);
  labelmapMapper.setSlicingMode(sliceMode);
  outline.setSlicingMode(sliceMode);
  renderWindow.render();
});

global.fullScreen = fullScreenRenderWindow;
global.imageActor = imageActor;
global.labelmapActor = labelmapActor;
