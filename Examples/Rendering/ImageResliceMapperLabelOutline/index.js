import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/All';

import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkCylinderSource from '@kitware/vtk.js/Filters/Sources/CylinderSource';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import vtkImageProperty from '@kitware/vtk.js/Rendering/Core/ImageProperty';
import vtkImageResliceMapper from '@kitware/vtk.js/Rendering/Core/ImageResliceMapper';
import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice';
import vtkInteractorStyleImage from '@kitware/vtk.js/Interaction/Style/InteractorStyleImage';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import vtkPlane from '@kitware/vtk.js/Common/DataModel/Plane';
import vtkPlaneWidget from '@kitware/vtk.js/Widgets/Widgets3D/ImplicitPlaneWidget';
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';
import { InterpolationType } from '@kitware/vtk.js/Rendering/Core/ImageProperty/Constants';
import { SlabTypes } from '@kitware/vtk.js/Rendering/Core/ImageResliceMapper/Constants';

// Load the itk-wasm UMD module dynamically for the example.
import vtkResourceLoader from '@kitware/vtk.js/IO/Core/ResourceLoader';
import vtkLiteHttpDataAccessHelper from '@kitware/vtk.js/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper';
import vtkITKHelper from '@kitware/vtk.js/Common/DataModel/ITKHelper';
// to unzip data file
import { unzipSync } from 'fflate';

import GUI from 'lil-gui';
// ----------------------------------------------------------------------------
const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0.3, 0.3, 0.34],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

// Background image property (input 0)
const bgPpty = vtkImageProperty.newInstance();

// Labelmap property (input 1)
const labelPpty = vtkImageProperty.newInstance();

const mapper = vtkImageResliceMapper.newInstance();
const slicePlane = vtkPlane.newInstance();
slicePlane.setNormal(0, 1, 0);
mapper.setSlicePlane(slicePlane);
mapper.setSlabType(SlabTypes.MAX);

const slicePolyDataSource = vtkCylinderSource.newInstance({
  height: 100,
  radius: 100,
  resolution: 20,
  capping: 1,
  center: [100, 100, 100],
});

const actor = vtkImageSlice.newInstance();
actor.setMapper(mapper);
renderer.addActor(actor);

const iStyle = vtkInteractorStyleImage.newInstance();
iStyle.setInteractionMode('IMAGE3D');
renderWindow.getInteractor().setInteractorStyle(iStyle);

const widgetManager = vtkWidgetManager.newInstance();
widgetManager.setRenderer(renderer);

const repStyle = {
  active: {
    plane: {
      opacity: 0.05,
      color: [1, 1, 1],
    },
    normal: {
      opacity: 0.6,
      color: [0, 1, 0],
    },
    origin: {
      opacity: 0.6,
      color: [0, 1, 0],
    },
  },
  inactive: {
    plane: {
      opacity: 0.0,
      color: [1, 1, 1],
    },
    normal: {
      opacity: 0.3,
      color: [0.5, 0, 0],
    },
    origin: {
      opacity: 0.3,
      color: [0.5, 0, 0],
    },
  },
};

const widget = vtkPlaneWidget.newInstance();
widget.getWidgetState().setNormal(0, 0, 1);
widget.setPlaceFactor(1);
const w = widgetManager.addWidget(widget);
w.setRepresentationStyle(repStyle);

// Store references for later
let labelMapImage = null;
let sourceImage = null;

function createLabelMapFromImage(srcImage, resolutionFactor = 1) {
  const srcDims = srcImage.getDimensions();
  const srcSpacing = srcImage.getSpacing();
  const origin = srcImage.getOrigin();
  const direction = srcImage.getDirection();

  // Create labelmap with different resolution
  const dims = [
    Math.max(1, Math.floor(srcDims[0] / resolutionFactor)),
    Math.max(1, Math.floor(srcDims[1] / resolutionFactor)),
    Math.max(1, Math.floor(srcDims[2] / resolutionFactor)),
  ];
  const spacing = [
    srcSpacing[0] * resolutionFactor,
    srcSpacing[1] * resolutionFactor,
    srcSpacing[2] * resolutionFactor,
  ];

  const labelMap = vtkImageData.newInstance();
  labelMap.setDimensions(dims);
  labelMap.setSpacing(spacing);
  labelMap.setOrigin(origin);
  labelMap.setDirection(direction);

  const numVoxels = dims[0] * dims[1] * dims[2];
  const labelValues = new Uint8Array(numVoxels);

  // Calculate center and size for geometric shapes
  const centerI = Math.floor(dims[0] / 2);
  const centerJ = Math.floor(dims[1] / 2);
  const centerK = Math.floor(dims[2] / 2);
  const minDim = Math.min(dims[0], dims[1], dims[2]);

  // Shape sizes relative to volume
  const sphereRadius = minDim * 0.35;
  const cubeHalfSize = minDim * 0.2;
  const cylinderRadius = minDim * 0.15;
  const cylinderHalfHeight = minDim * 0.3;

  // Offset shapes so they don't all overlap at center
  const sphereCenter = [centerI, centerJ, centerK];
  const cubeCenter = [
    centerI - minDim * 0.25,
    centerJ - minDim * 0.25,
    centerK,
  ];
  const cylinderCenter = [
    centerI + minDim * 0.25,
    centerJ + minDim * 0.25,
    centerK,
  ];

  for (let k = 0; k < dims[2]; k++) {
    for (let j = 0; j < dims[1]; j++) {
      for (let i = 0; i < dims[0]; i++) {
        const idx = i + j * dims[0] + k * dims[0] * dims[1];
        let label = 0;

        // Segment 1: Sphere
        const dx = i - sphereCenter[0];
        const dy = j - sphereCenter[1];
        const dz = k - sphereCenter[2];
        const distSq = dx * dx + dy * dy + dz * dz;
        if (distSq <= sphereRadius * sphereRadius) {
          label = 1;
        } else {
          // Segment 2: Cube (axis-aligned box)
          const cubeX = Math.abs(i - cubeCenter[0]);
          const cubeY = Math.abs(j - cubeCenter[1]);
          const cubeZ = Math.abs(k - cubeCenter[2]);
          if (
            cubeX <= cubeHalfSize &&
            cubeY <= cubeHalfSize &&
            cubeZ <= cubeHalfSize
          ) {
            label = 2;
          } else {
            // Segment 3: Cylinder (along Z axis)
            const cylX = i - cylinderCenter[0];
            const cylY = j - cylinderCenter[1];
            const cylZ = Math.abs(k - cylinderCenter[2]);
            const cylDistSq = cylX * cylX + cylY * cylY;
            if (
              cylDistSq <= cylinderRadius * cylinderRadius &&
              cylZ <= cylinderHalfHeight
            ) {
              label = 3;
            }
          }
        }

        labelValues[idx] = label;
      }
    }
  }

  const dataArray = vtkDataArray.newInstance({
    numberOfComponents: 1,
    values: labelValues,
    name: 'LabelMap',
  });
  labelMap.getPointData().setScalars(dataArray);

  return labelMap;
}

function updateLabelmap(resolutionFactor = 2) {
  if (!sourceImage) return;

  // Create labelmap with specified resolution factor
  labelMapImage = createLabelMapFromImage(sourceImage, resolutionFactor);

  // Update mapper input at port 1
  mapper.setInputData(labelMapImage, 1);

  console.log(
    `Labelmap resolution: ${labelMapImage.getDimensions().join('x')} ` +
      `(${resolutionFactor}x downsampled from source)`
  );

  renderWindow.render();
}

function setImage(im, resolutionFactor = 2) {
  sourceImage = im;
  const bds = im.getBounds();
  const imc = im.getCenter();

  // Set background image as input 0
  mapper.setInputData(im);

  // Create and add labelmap as input 1 with different resolution
  labelMapImage = createLabelMapFromImage(im, resolutionFactor);
  mapper.addInputData(labelMapImage);

  console.log(
    `Source image resolution: ${im.getDimensions().join('x')}, ` +
      `Labelmap resolution: ${labelMapImage.getDimensions().join('x')}`
  );

  slicePlane.setOrigin(imc);
  slicePolyDataSource.setCenter(imc);
  widget.placeWidget(bds);

  renderer.getActiveCamera().elevation(90);
  renderer.resetCamera();
  renderer.getActiveCamera().dolly(1.5);
  renderer.resetCameraClippingRange();
  const planeState = widget.getWidgetState();
  planeState.setOrigin(slicePlane.getOrigin());
  planeState.setNormal(slicePlane.getNormal());
  planeState.onModified(() => {
    slicePlane.setOrigin(planeState.getOrigin());
    slicePlane.setNormal(planeState.getNormal());
    slicePolyDataSource.setCenter(planeState.getOrigin());
    slicePolyDataSource.setDirection(planeState.getNormal());
    if (mapper.getSlicePolyData()) {
      slicePolyDataSource.update();
      mapper.setSlicePolyData(slicePolyDataSource.getOutputData());
    }
  });
  renderWindow.render();
}

async function update() {
  console.log('Fetching/downloading the input file, please wait...');
  const zipFileData = await vtkLiteHttpDataAccessHelper.fetchBinary(
    // data.kitware.com --> covid-lungs.zip
    `https://data.kitware.com/api/v1/item/6462789f546d74240b93fab3/download`
  );

  console.log('Fetching/downloading input file done!');

  const zipFileDataArray = new Uint8Array(zipFileData);
  const decompressedFiles = unzipSync(zipFileDataArray);
  const arrayBuffers = [];
  Object.keys(decompressedFiles).forEach((relativePath) => {
    if (relativePath.endsWith('.dcm')) {
      arrayBuffers.push(decompressedFiles[relativePath].buffer);
    }
  });

  const { image: itkImage } = await window.itk.readImageDICOMArrayBufferSeries(
    arrayBuffers
  );

  const vtkImage = vtkITKHelper.convertItkToVtkImage(itkImage);
  setImage(vtkImage);
}

// Background image color/opacity (grayscale CT)
const bgRgb = vtkColorTransferFunction.newInstance();
bgRgb.addRGBPoint(0, 0, 0, 0);
bgRgb.addRGBPoint(3926, 1, 1, 1);
bgPpty.setRGBTransferFunction(bgRgb);

const bgOfun = vtkPiecewiseFunction.newInstance();
bgOfun.addPoint(0, 1);
bgOfun.addPoint(3926, 1);
bgPpty.setPiecewiseFunction(bgOfun);

bgPpty.setColorWindow(1400);
bgPpty.setColorLevel(-500);
bgPpty.setIndependentComponents(true);

// Labelmap color/opacity - use actual scalar values (1, 2, 3), not normalized
const labelRgb = vtkColorTransferFunction.newInstance();
labelRgb.addRGBPoint(0, 0, 0, 0); // Background - transparent
labelRgb.addRGBPoint(1, 1, 0.5, 0); // Segment 1 - orange
labelRgb.addRGBPoint(2, 0, 0.8, 0.2); // Segment 2 - green
labelRgb.addRGBPoint(3, 0.2, 0.5, 1); // Segment 3 - blue
labelPpty.setRGBTransferFunction(labelRgb);

const labelOfun = vtkPiecewiseFunction.newInstance();
labelOfun.addPoint(0, 0); // Background transparent
labelOfun.addPoint(1, 0.2); // Segment 1 fill opacity
labelOfun.addPoint(2, 0.2); // Segment 2 fill opacity
labelOfun.addPoint(3, 0.2); // Segment 3 fill opacity
labelPpty.setPiecewiseFunction(labelOfun);

// Enable label outline for the labelmap
labelPpty.setUseLabelOutline(true);
labelPpty.setLabelOutlineThickness([3, 3, 3, 3]);
labelPpty.setLabelOutlineOpacity(1.0);
labelPpty.setInterpolationType(InterpolationType.NEAREST);
labelPpty.setIndependentComponents(true);
labelPpty.setUseLookupTableScalarRange(true);

// Set properties on actor (index 0 for background, index 1 for labelmap)
// setProperty signature: (mapperInputPort, property) when first arg is integer
actor.setProperty(0, bgPpty);
actor.setProperty(1, labelPpty);

const gui = new GUI();
const params = {
  slabEnabled: false,
  slabType: 'MAX',
  slabThickness: 20,
  sliceFunction: 'plane',
  interpolation: 'linear',
  showLabelmap: true,
  useLabelOutline: true,
  outlineThickness: 3,
  outlineOpacity: 1.0,
  fillOpacity: 0.2,
  labelmapResolution: 2,
};

function applySlabEnabled() {
  if (params.slabEnabled) {
    mapper.setSlabThickness(Number(params.slabThickness));
  } else {
    mapper.setSlabThickness(0);
  }
  renderWindow.render();
}

function applySlabType() {
  if (params.slabType === 'MIN') {
    mapper.setSlabType(SlabTypes.MIN);
  } else if (params.slabType === 'SUM') {
    mapper.setSlabType(SlabTypes.SUM);
  } else if (params.slabType === 'MEAN') {
    mapper.setSlabType(SlabTypes.MEAN);
  } else {
    mapper.setSlabType(SlabTypes.MAX);
  }
  renderWindow.render();
}

function applySliceFunction() {
  if (params.sliceFunction === 'plane') {
    mapper.setSlicePolyData(null);
  } else {
    slicePolyDataSource.update();
    mapper.setSlicePolyData(slicePolyDataSource.getOutputData());
  }
  renderWindow.render();
}

function applyInterpolation() {
  if (params.interpolation === 'linear') {
    bgPpty.setInterpolationType(InterpolationType.LINEAR);
  } else {
    bgPpty.setInterpolationType(InterpolationType.NEAREST);
  }
  renderWindow.render();
}

gui
  .add(params, 'sliceFunction', ['plane', 'cylinder'])
  .name('Slice function')
  .onChange((value) => {
    params.sliceFunction = value;
    applySliceFunction();
  });

gui
  .add(params, 'interpolation', ['linear', 'nearest'])
  .name('Interpolation')
  .onChange((value) => {
    params.interpolation = value;
    applyInterpolation();
  });

const slabModeCtrl = gui
  .add(params, 'slabEnabled')
  .name('Slab mode')
  .onChange((value) => {
    params.slabEnabled = value;
    applySlabEnabled();
  });

gui
  .add(params, 'slabType', ['MIN', 'MAX', 'MEAN', 'SUM'])
  .name('Slab type')
  .onChange((value) => {
    params.slabType = value;
    applySlabType();
  });

gui
  .add(params, 'slabThickness', 1, 40, 1)
  .name('Slab thickness')
  .onChange((value) => {
    params.slabThickness = Number(value);
    applySlabEnabled();
  });

// Labelmap controls
const labelmapFolder = gui.addFolder('Labelmap');

labelmapFolder
  .add(params, 'showLabelmap')
  .name('Show Labelmap')
  .onChange((value) => {
    labelOfun.removeAllPoints();
    labelOfun.addPoint(0, 0);
    if (value) {
      labelOfun.addPoint(1, params.fillOpacity);
      labelOfun.addPoint(2, params.fillOpacity);
      labelOfun.addPoint(3, params.fillOpacity);
    } else {
      labelOfun.addPoint(1, 0);
      labelOfun.addPoint(2, 0);
      labelOfun.addPoint(3, 0);
    }
    labelPpty.setUseLabelOutline(value && params.useLabelOutline);
    renderWindow.render();
  });

labelmapFolder
  .add(params, 'fillOpacity', 0, 1, 0.1)
  .name('Fill Opacity')
  .onChange((value) => {
    labelOfun.removeAllPoints();
    labelOfun.addPoint(0, 0);
    labelOfun.addPoint(1, value);
    labelOfun.addPoint(2, value);
    labelOfun.addPoint(3, value);
    renderWindow.render();
  });

labelmapFolder
  .add(params, 'useLabelOutline')
  .name('Enable Outline')
  .onChange((value) => {
    labelPpty.setUseLabelOutline(value);
    renderWindow.render();
  });

labelmapFolder
  .add(params, 'outlineThickness', 1, 10, 1)
  .name('Outline Thickness')
  .onChange((value) => {
    labelPpty.setLabelOutlineThickness([value, value, value, value]);
    renderWindow.render();
  });

labelmapFolder
  .add(params, 'outlineOpacity', 0, 1, 0.1)
  .name('Outline Opacity')
  .onChange((value) => {
    labelPpty.setLabelOutlineOpacity(value);
    renderWindow.render();
  });

labelmapFolder
  .add(params, 'labelmapResolution', 1, 4, 1)
  .name('Resolution Factor')
  .onChange((value) => {
    updateLabelmap(value);
  });

applySliceFunction();
applyInterpolation();
applySlabType();
applySlabEnabled();

// After the itk-wasm UMD script has been loaded, `window.itk` provides the itk-wasm API.
vtkResourceLoader
  .loadScript(
    'https://cdn.jsdelivr.net/npm/itk-wasm@1.0.0-b.8/dist/umd/itk-wasm.js'
  )
  .then(update)
  .then(() => slabModeCtrl.setValue(true));

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------
global.actor = actor;
global.mapper = mapper;
global.bgProperty = bgPpty;
global.labelProperty = labelPpty;
global.bgRgb = bgRgb;
global.labelRgb = labelRgb;
global.bgOfun = bgOfun;
global.labelOfun = labelOfun;
global.renderer = renderer;
global.renderWindow = renderWindow;
global.widget = w;
