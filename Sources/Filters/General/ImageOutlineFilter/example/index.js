import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Volume';

// Force the loading of HttpDataAccessHelper to support gzip decompression
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkImageMapper from '@kitware/vtk.js/Rendering/Core/ImageMapper';
import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData';
import vtkImageOutlineFilter from '@kitware/vtk.js/Filters/General/ImageOutlineFilter';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';

import GUI from 'lil-gui';

const fullScreenRenderWindow = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderWindow = fullScreenRenderWindow.getRenderWindow();
const renderer = fullScreenRenderWindow.getRenderer();

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
    const gui = new GUI();
    const params = {
      slice: 30,
      axis: 'K',
      contoursOnly: true,
    };

    gui
      .add(params, 'contoursOnly')
      .name('Contours only')
      .onChange((value) => {
        labelmapMapper.setInputData(value ? outline.getOutputData() : labelMap);
        renderWindow.render();
      });

    gui
      .add(params, 'slice', extent[4], extent[5], 1)
      .name('Slice')
      .onChange((value) => {
        imageActor.getMapper().setSlice(Number(value));
        renderWindow.render();
      });

    gui
      .add(params, 'axis', ['I', 'J', 'K'])
      .name('Slice axis')
      .onChange((value) => {
        const sliceMode = 'IJKXYZ'.indexOf(value);
        imageMapper.setSlicingMode(sliceMode);
        labelmapMapper.setSlicingMode(sliceMode);
        outline.setSlicingMode(sliceMode);
        renderWindow.render();
      });
    renderer.resetCamera();
    renderer.resetCameraClippingRange();
    renderWindow.render();
  });

global.fullScreen = fullScreenRenderWindow;
global.imageActor = imageActor;
global.labelmapActor = labelmapActor;
