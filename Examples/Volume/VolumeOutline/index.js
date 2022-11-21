import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Volume';

// Force DataAccessHelper to have access to various data source
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';
import vtkInteractorStyleMPRSlice from '@kitware/vtk.js/Interaction/Style/InteractorStyleMPRSlice';
import vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';

const fullScreenRenderWindow = vtkFullScreenRenderWindow.newInstance({
  background: [0.3, 0.3, 0.3],
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

const ofun = vtkPiecewiseFunction.newInstance();
ofun.addPoint(0, 0);
ofun.addPoint(1, 1.0);
actor.getProperty().setScalarOpacity(0, ofun);

function createLabelPipeline(backgroundImageData) {
  // Create a labelmap image the same dimensions as our background volume.
  const labelMapData = vtkImageData.newInstance(
    backgroundImageData.get('spacing', 'origin', 'direction')
  );

  labelMapData.computeTransforms();

  const values = new Uint8Array(backgroundImageData.getNumberOfPoints());
  const dataArray = vtkDataArray.newInstance({
    numberOfComponents: 1, // labelmap with single component
    values,
  });
  labelMapData.getPointData().setScalars(dataArray);

  labelMapData.setDimensions(...backgroundImageData.getDimensions());
  labelMapData.setSpacing(...backgroundImageData.getSpacing());
  labelMapData.setOrigin(...backgroundImageData.getOrigin());
  labelMapData.setDirection(...backgroundImageData.getDirection());

  const labelMap = {
    actor: vtkVolume.newInstance(),
    mapper: vtkVolumeMapper.newInstance(),
    imageData: labelMapData,
    cfun: vtkColorTransferFunction.newInstance(),
    ofun: vtkPiecewiseFunction.newInstance(),
  };

  // Labelmap pipeline
  labelMap.mapper.setInputData(labelMapData);
  labelMap.actor.setMapper(labelMap.mapper);

  // Set up labelMap color and opacity mapping
  labelMap.cfun.addRGBPoint(1, 1, 0, 0); // label "1" will be red
  labelMap.cfun.addRGBPoint(2, 0, 1, 0); // label "2" will be green
  labelMap.ofun.addPoint(0, 0);
  labelMap.ofun.addPoint(1, 0.5, 0.5, 1.0); // Red will have an opacity of 0.2.
  labelMap.ofun.addPoint(2, 0.5, 0.5, 1.0); // Green will have an opacity of 0.2.
  labelMap.ofun.setClamping(false);

  labelMap.actor.getProperty().setRGBTransferFunction(0, labelMap.cfun);
  labelMap.actor.getProperty().setScalarOpacity(0, labelMap.ofun);
  labelMap.actor.getProperty().setInterpolationTypeToNearest();
  labelMap.actor.getProperty().setUseLabelOutline(true);
  labelMap.actor.getProperty().setLabelOutlineThickness(3);
  labelMap.actor.getProperty().setLabelOutlineOpacity(1.0);

  return labelMap;
}

function fillBlobForThreshold(imageData, backgroundImageData) {
  const dims = imageData.getDimensions();
  const values = imageData.getPointData().getScalars().getData();

  const backgroundValues = backgroundImageData
    .getPointData()
    .getScalars()
    .getData();
  const size = dims[0] * dims[1] * dims[2];

  // Head
  const headThreshold = [324, 1524];
  for (let i = 0; i < size; i++) {
    if (
      backgroundValues[i] >= headThreshold[0] &&
      backgroundValues[i] < headThreshold[1]
    ) {
      values[i] = 1;
    }
  }

  // Bone
  const boneThreshold = [1200, 2324];
  for (let i = 0; i < size; i++) {
    if (
      backgroundValues[i] >= boneThreshold[0] &&
      backgroundValues[i] < boneThreshold[1]
    ) {
      values[i] = 2;
    }
  }

  imageData.getPointData().getScalars().setData(values);
}

const reader = vtkHttpDataSetReader.newInstance({
  fetchGzip: true,
});
reader
  .setUrl(`${__BASE_PATH__}/data/volume/headsq.vti`, { loadData: true })
  .then(() => {
    const data = reader.getOutputData();

    mapper.setInputData(data);

    const labelMap = createLabelPipeline(data);

    const sourceDataRGBTransferFunction = actor
      .getProperty()
      .getRGBTransferFunction(0);
    sourceDataRGBTransferFunction.setMappingRange(324, 2324);

    fillBlobForThreshold(labelMap.imageData, data);

    // Set interactor style volume mapper after mapper sets input data
    istyle.setVolumeMapper(mapper);

    renderer.addVolume(actor);
    renderer.addVolume(labelMap.actor);
    renderer.getActiveCamera().setViewUp(1, 0, 0);
    renderWindow.render();
  });
