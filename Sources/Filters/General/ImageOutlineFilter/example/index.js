import 'vtk.js/Sources/favicon';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkImageOutlineFilter from 'vtk.js/Sources/Filters/General/ImageOutlineFilter';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import controlPanel from './controlPanel.html';

const fullScreenRenderWindow = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderWindow = fullScreenRenderWindow.getRenderWindow();
const renderer = fullScreenRenderWindow.getRenderer();
fullScreenRenderWindow.addController(controlPanel);

const imageActorK = vtkImageSlice.newInstance();
const labelmapActorK = vtkImageSlice.newInstance();
const opFun = vtkPiecewiseFunction.newInstance();
opFun.addPoint(0, 0); // our background value, 0, will be invisible
opFun.addPoint(0.5, 1);
opFun.addPoint(1, 1);
const cFun = vtkColorTransferFunction.newInstance();
cFun.addRGBPoint(1, 1, 0, 0);
labelmapActorK.getProperty().setScalarOpacity(opFun);
labelmapActorK.getProperty().setRGBTransferFunction(cFun);
imageActorK.getProperty().setInterpolationType(0);
labelmapActorK.getProperty().setInterpolationType(0);
renderer.addActor(imageActorK);
renderer.addActor(labelmapActorK);

const reader = vtkHttpDataSetReader.newInstance({
  fetchGzip: true,
});
reader
  .setUrl(`${__BASE_PATH__}/data/volume/headsq.vti`, { loadData: true })
  .then(() => {
    const data = reader.getOutputData();
    const extent = data.getExtent();
    const outline = vtkImageOutlineFilter.newInstance();
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
        values[index] = el > 100 ? 1 : 0;
      });
    const dataArray = vtkDataArray.newInstance({
      numberOfComponents: 1, // labelmap with single component
      values,
    });
    labelMap.getPointData().setScalars(dataArray);
    outline.setInputData(labelMap);
    const imageMapperK = vtkImageMapper.newInstance();
    imageMapperK.setInputData(data);
    imageMapperK.setKSlice(30);
    imageActorK.setMapper(imageMapperK);
    const labelmapMapperK = vtkImageMapper.newInstance();
    labelmapMapperK.setInputData(outline.getOutputData());
    labelmapMapperK.setKSlice(30);
    imageMapperK.onModified(() => {
      labelmapMapperK.setKSlice(imageMapperK.getSlice());
    });
    labelmapActorK.setMapper(labelmapMapperK);
    const el = document.querySelector('.sliceK');
    el.setAttribute('min', extent[4]);
    el.setAttribute('max', extent[5]);
    el.setAttribute('value', 30);
    document.querySelector('.isFilterOn').addEventListener('change', (e) => {
      labelmapMapperK.setInputData(
        e.target.checked ? outline.getOutputData() : labelMap
      );
      renderWindow.render();
    });
    renderer.resetCamera();
    renderer.resetCameraClippingRange();
    renderWindow.render();
  });
document.querySelector('.sliceK').addEventListener('input', (e) => {
  imageActorK.getMapper().setKSlice(Number(e.target.value));
  renderWindow.render();
});

global.fullScreen = fullScreenRenderWindow;
global.imageActorK = imageActorK;
global.labelmapActorK = labelmapActorK;
