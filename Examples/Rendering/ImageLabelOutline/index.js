import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Volume';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkImageMapper from '@kitware/vtk.js/Rendering/Core/ImageMapper';
import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice';
import vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';

const fullScreenRenderWindow = vtkFullScreenRenderWindow.newInstance({
  background: [0.5, 0.5, 0.5],
});
const renderWindow = fullScreenRenderWindow.getRenderWindow();
const renderer = fullScreenRenderWindow.getRenderer();

const BACKGROUND = 0;
const LOW_VALUE = 80;
const HIGH_VALUE = 160;

const FIRST_SEGMENT = 1;
const SECOND_SEGMENT = 5;

function createLabelmap(backgroundImageData) {
  // Create a labelmap image the same dimensions as our background volume.
  const labelMapData = vtkImageData.newInstance(
    backgroundImageData.get('spacing', 'origin', 'direction')
  );

  labelMapData.computeTransforms();

  const dataArray = vtkDataArray.newInstance({
    numberOfComponents: 1,
    values: new Uint8Array(backgroundImageData.getNumberOfPoints()),
  });
  labelMapData.getPointData().setScalars(dataArray);

  labelMapData.setDimensions(...backgroundImageData.getDimensions());
  labelMapData.setSpacing(...backgroundImageData.getSpacing());
  labelMapData.setOrigin(...backgroundImageData.getOrigin());
  labelMapData.setDirection(...backgroundImageData.getDirection());
  const mapper = vtkImageMapper.newInstance();
  mapper.setInputData(labelMapData);

  const actor = vtkImageSlice.newInstance();

  actor.setMapper(mapper);

  const labelMap = {
    actor,
    mapper,
    imageData: labelMapData,
    cfun: vtkColorTransferFunction.newInstance(),
    ofun: vtkPiecewiseFunction.newInstance(),
  };

  // Labelmap pipeline
  labelMap.mapper.setInputData(labelMapData);
  labelMap.actor.setMapper(labelMap.mapper);

  // Set up labelMap color and opacity mapping
  labelMap.cfun.addRGBPoint(0, 0, 0, 0); // label "1" will be red
  labelMap.cfun.addRGBPoint(FIRST_SEGMENT, 1, 0, 0); // label "1" will be red
  labelMap.cfun.addRGBPoint(SECOND_SEGMENT, 0, 1, 0); // label "5" will be green
  labelMap.ofun.addPoint(0, 0);
  labelMap.ofun.addPoint(FIRST_SEGMENT, 0.1); // Red will have an opacity of 0.1.
  labelMap.ofun.addPoint(SECOND_SEGMENT, 0.1); // Green will have an opacity of 0.1.

  labelMap.actor.getProperty().setRGBTransferFunction(0, labelMap.cfun);
  labelMap.actor.getProperty().setScalarOpacity(0, labelMap.ofun);
  labelMap.actor.getProperty().setInterpolationTypeToNearest();

  labelMap.actor.getProperty().setUseLabelOutline(true);
  // Label outline thickness is for first segment -> 2 (positioned at array index 0), second segment -> 4
  // (positioned at array index 4)
  labelMap.actor.getProperty().setLabelOutlineThickness([2, 1, 1, 1, 4]);
  labelMap.actor.getProperty().setLabelOutlineOpacity(1.0);

  // This is very important to make sure the labelmap is rendered
  // correctly
  labelMap.actor.getProperty().setUseLookupTableScalarRange(true);

  const dims = labelMap.imageData.getDimensions();
  const values = labelMap.imageData.getPointData().getScalars().getData();

  const backgroundValues = backgroundImageData
    .getPointData()
    .getScalars()
    .getData();
  const size = dims[0] * dims[1] * dims[2];

  for (let i = 0; i < size; i++) {
    if (backgroundValues[i] === LOW_VALUE) {
      values[i] = FIRST_SEGMENT;
    } else if (backgroundValues[i] === HIGH_VALUE) {
      values[i] = SECOND_SEGMENT;
    }
  }

  labelMap.imageData.getPointData().getScalars().setData(values);

  return labelMap;
}

// Create a one slice vtkImageData that has four quadrants of different values
const imageData = vtkImageData.newInstance();
const dims = [10, 10, 1];
imageData.setSpacing(1, 1, 1);
imageData.setOrigin(0.1, 0.1, 0.1);
imageData.setDirection(1, 0, 0, 0, 1, 0, 0, 0, 1);
imageData.setExtent(0, dims[0] - 1, 0, dims[1] - 1, 0, dims[2] - 1);

imageData.computeTransforms();

const values = new Uint8Array(dims[0] * dims[1] * dims[2]);

let i = 0;
for (let y = 0; y < dims[1]; y++) {
  for (let x = 0; x < dims[0]; x++, i++) {
    if ((x < 3 && y < 3) || (x > 7 && y > 7)) {
      values[i] = BACKGROUND;
    } else if (x > 4 && x < 6 && y > 4 && y < 7) {
      values[i] = LOW_VALUE;
    } else {
      values[i] = HIGH_VALUE;
    }
  }
}

const dataArray = vtkDataArray.newInstance({
  numberOfComponents: 1,
  values,
});
imageData.getPointData().setScalars(dataArray);
imageData.modified();

const data = imageData;
const labelMap = createLabelmap(data);

const actor = vtkImageSlice.newInstance();
const mapper = vtkImageMapper.newInstance();
mapper.setInputData(data);
actor.setMapper(mapper);
actor.getProperty().setInterpolationTypeToNearest();

renderer.addActor(actor);
renderer.addActor(labelMap.actor);
renderer.resetCamera();
renderer.resetCameraClippingRange();
renderWindow.render();

global.fullScreen = fullScreenRenderWindow;
