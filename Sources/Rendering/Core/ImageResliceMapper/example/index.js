import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/All';

import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkCylinderSource from '@kitware/vtk.js/Filters/Sources/CylinderSource';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
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

import controlPanel from './controlPanel.html';
// ----------------------------------------------------------------------------
const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0.3, 0.3, 0.34],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const ppty = vtkImageProperty.newInstance();
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

function setImage(im) {
  const bds = im.getBounds();
  mapper.setInputData(im);
  const imc = im.getCenter();
  slicePlane.setOrigin(imc);
  slicePolyDataSource.setCenter(imc);
  widget.placeWidget(bds);

  renderer.getActiveCamera().elevation(90);
  renderer.resetCamera();
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

const rgb = vtkColorTransferFunction.newInstance();
rgb.addRGBPoint(0, 0, 0, 0);
rgb.addRGBPoint(3926, 1, 1, 1);
ppty.setRGBTransferFunction(rgb);

const ofun = vtkPiecewiseFunction.newInstance();
ofun.addPoint(0, 1);
ofun.addPoint(3926, 1);
ppty.setPiecewiseFunction(ofun);

ppty.setColorWindow(1400);
ppty.setColorLevel(-500);
actor.setProperty(ppty);

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------
fullScreenRenderer.addController(controlPanel);
const slabThicknessSlider = document.querySelector('.slabThickness');
const enableSlab = document.querySelector('.enableSlab');
enableSlab.addEventListener('click', () => {
  const slabFieldSet = document.querySelector('.slab');
  if (slabFieldSet.disabled) {
    slabFieldSet.disabled = false;
    enableSlab.innerHTML = 'Disable slab mode';
    mapper.setSlabThickness(Number(slabThicknessSlider.value));
    renderWindow.render();
  } else {
    slabFieldSet.disabled = true;
    enableSlab.innerHTML = 'Enable slab mode';
    mapper.setSlabThickness(0);
    renderWindow.render();
  }
});

const slabTypes = document.querySelectorAll('.slabType');
for (let idx = 0; idx < slabTypes.length; ++idx) {
  const st = slabTypes[idx];
  st.onchange = (e) => {
    if (e.target.value === 'min') {
      mapper.setSlabType(SlabTypes.MIN);
    } else if (e.target.value === 'max') {
      mapper.setSlabType(SlabTypes.MAX);
    } else if (e.target.value === 'sum') {
      mapper.setSlabType(SlabTypes.SUM);
    } else {
      mapper.setSlabType(SlabTypes.MEAN);
    }
    renderWindow.render();
  };
}
const sliceFunction = document.querySelectorAll('.spd');
for (let idx = 0; idx < sliceFunction.length; ++idx) {
  const st = sliceFunction[idx];
  st.onchange = (e) => {
    if (e.target.value === 'plane') {
      mapper.setSlicePolyData(null);
    } else {
      slicePolyDataSource.update();
      mapper.setSlicePolyData(slicePolyDataSource.getOutputData());
    }
    renderWindow.render();
  };
}
const interpTypes = document.querySelectorAll('.interp');
for (let idx = 0; idx < interpTypes.length; ++idx) {
  const st = interpTypes[idx];
  st.onchange = (e) => {
    if (e.target.value === 'linear') {
      actor.getProperty().setInterpolationType(InterpolationType.LINEAR);
    } else {
      actor.getProperty().setInterpolationType(InterpolationType.NEAREST);
    }
    renderWindow.render();
  };
}
document.querySelector('.slabThickness').addEventListener('change', (e) => {
  const value = Number(e.target.value);
  mapper.setSlabThickness(value);
  renderWindow.render();
});

// After the itk-wasm UMD script has been loaded, `window.itk` provides the itk-wasm API.
vtkResourceLoader
  .loadScript(
    'https://cdn.jsdelivr.net/npm/itk-wasm@1.0.0-b.8/dist/umd/itk-wasm.js'
  )
  .then(update)
  .then(enableSlab.click());

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------
global.actor = actor;
global.mapper = mapper;
global.property = ppty;
global.rgb = rgb;
global.ofun = ofun;
global.renderer = renderer;
global.renderWindow = renderWindow;
global.widget = w;
