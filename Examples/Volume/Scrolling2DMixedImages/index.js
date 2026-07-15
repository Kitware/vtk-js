import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Volume';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import Manipulators from '@kitware/vtk.js/Interaction/Manipulators';

// Load the itk-wasm UMD module dynamically for the example.
// Normally, this will just go in the HTML <head>.
import vtkResourceLoader from '@kitware/vtk.js/IO/Core/ResourceLoader';
// Fetch the data. Other options include `fetch`, axios.
import vtkLiteHttpDataAccessHelper from '@kitware/vtk.js/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper';

// vtk imports
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkCollection from '@kitware/vtk.js/Common/DataModel/Collection';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkITKHelper from '@kitware/vtk.js/Common/DataModel/ITKHelper';
import vtkImageMapper from '@kitware/vtk.js/Rendering/Core/ImageMapper';
import vtkImageArrayMapper from '@kitware/vtk.js/Rendering/Core/ImageArrayMapper';
import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice';
import vtkInteractorStyleManipulator from '@kitware/vtk.js/Interaction/Style/InteractorStyleManipulator';
import vtkMath from '@kitware/vtk.js/Common/Core/Math';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkPointPicker from '@kitware/vtk.js/Rendering/Core/PointPicker';
import vtkCellPicker from '@kitware/vtk.js/Rendering/Core/CellPicker';
import vtkSphereSource from '@kitware/vtk.js/Filters/Sources/SphereSource';

// to unzip data file
import { unzipSync } from 'fflate';

const rootBody = document.querySelector('body');
rootBody.style.background = 'rgba(65, 86, 122, 1)';
const labelSelector = document.createElement('label');
labelSelector.style.fontWeight = 'bold';
labelSelector.innerText = 'Loading input data, please wait ...';
const progressContainer = document.createElement('div');
progressContainer.appendChild(labelSelector);
rootBody.appendChild(progressContainer);

// ----------------------------------------------------------------------------
// Standard rendering setup for image slice
// ----------------------------------------------------------------------------
const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [65 / 255, 86 / 255, 122 / 255],
  rootContainer: rootBody,
  containerStyle: { height: '100%', width: '100%', position: 'absolute' },
});
const renderer = fullScreenRenderer.getRenderer();
renderer.getActiveCamera().setParallelProjection(true);
const renderWindow = fullScreenRenderer.getRenderWindow();
const imageActor = vtkImageSlice.newInstance();
const imageMapper = vtkImageArrayMapper.newInstance();
imageActor.setMapper(imageMapper);
renderer.addActor(imageActor);

const istyle = vtkInteractorStyleManipulator.newInstance();
const interactor = renderWindow.getInteractor();
interactor.setInteractorStyle(istyle);

const collection = vtkCollection.newInstance();

// ----------------------------------------------------------------------------
// Setup picking interaction
// ----------------------------------------------------------------------------
// Only try to pick the imageSlice points
const pointPicker = vtkPointPicker.newInstance();
pointPicker.setPickFromList(1);
pointPicker.initializePickList();
pointPicker.addPickList(imageActor);

const cellPicker = vtkCellPicker.newInstance();
cellPicker.setPickFromList(1);
cellPicker.initializePickList();
cellPicker.addPickList(imageActor);

// Pick on mouse left click
renderWindow.getInteractor().onLeftButtonPress((callData) => {
  if (renderer !== callData.pokedRenderer) {
    return;
  }

  const pos = callData.position;
  const point = [pos.x, pos.y, 0.0];
  console.log(`Mouse click at: ${point}`);
  pointPicker.pick(point, renderer);
  cellPicker.pick(point, renderer);

  if (pointPicker.getActors().length === 0) {
    const pickedPoint = pointPicker.getPickPosition();
    console.log(`No point picked, default: ${pickedPoint}`);
    const sphere = vtkSphereSource.newInstance();
    sphere.setCenter(pickedPoint);
    sphere.setRadius(10);
    const sphereMapper = vtkMapper.newInstance();
    sphereMapper.setInputData(sphere.getOutputData());
    const sphereActor = vtkActor.newInstance();
    sphereActor.setMapper(sphereMapper);
    sphereActor.getProperty().setColor(1.0, 0.0, 0.0);
    renderer.addActor(sphereActor);
  } else {
    const pickedPointIJK = pointPicker.getPointIJK();
    console.log('Picked point IJK: ', pickedPointIJK);
    const pickedCellIJK = cellPicker.getCellIJK();
    console.log('Picked cell IJK: ', pickedCellIJK);

    const pickedPoints = pointPicker.getPickedPositions();
    for (let i = 0; i < pickedPoints.length; i++) {
      const pickedPoint = pickedPoints[i];
      console.log(`Picked: ${pickedPoint}`);
      const sphere = vtkSphereSource.newInstance();
      sphere.setCenter(pickedPoint);
      sphere.setRadius(10);
      const sphereMapper = vtkMapper.newInstance();
      sphereMapper.setInputData(sphere.getOutputData());
      const sphereActor = vtkActor.newInstance();
      sphereActor.setMapper(sphereMapper);
      sphereActor.getProperty().setColor(0.0, 1.0, 0.0);
      renderer.addActor(sphereActor);
    }
  }
  renderWindow.render();
});

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
function updateWindowLevel(slice) {
  const img = imageMapper.getImage(slice);
  const range = img.getPointData().getScalars().getRange();
  const maxWidth = range[1] - range[0];
  imageActor.getProperty().setColorWindow(maxWidth);
  const center = Math.round((range[0] + range[1]) / 2);
  imageActor.getProperty().setColorLevel(center);
}

function load(slicingMode) {
  // Slice representation
  imageMapper.setInputData(collection);

  // Initial windowing
  updateWindowLevel(0);

  // Add manipulators
  const mousePanning =
    Manipulators.vtkMouseCameraTrackballPanManipulator.newInstance({
      button: 1,
    });
  istyle.addMouseManipulator(mousePanning);

  const mouseZooming =
    Manipulators.vtkMouseCameraTrackballZoomManipulator.newInstance({
      button: 3,
    });
  istyle.addMouseManipulator(mouseZooming);

  const mouseSlicing = Manipulators.vtkMouseRangeManipulator.newInstance({
    scrollEnabled: true,
  });
  istyle.addMouseManipulator(mouseSlicing);

  // Setup camera
  const firstImage = collection.getItem(0);
  const d9 = firstImage.getDirection();
  const normal = [0, 0, 1];
  const viewUp = [0, -1, 0];
  vtkMath.multiply3x3_vect3(d9, normal, normal);
  vtkMath.multiply3x3_vect3(d9, viewUp, viewUp);
  const camera = renderer.getActiveCamera();
  const focalPoint = firstImage.getCenter();
  const position = focalPoint.map((e, i) => e - normal[i]); // offset along the slicing axis
  camera.setPosition(...position);
  camera.setFocalPoint(...focalPoint);
  camera.setViewUp(viewUp);
  renderer.resetCamera(); // adjust position along normal + zoom (parallel scale)

  // Initial slice
  const minSlice = 0;
  const maxSlice = imageMapper.getTotalSlices() - 1;
  console.log(`slices range: ${minSlice}, ${maxSlice}`);
  const sliceStep = 1;
  imageMapper.setSlice(0);

  // Slicing bounds for manipulator
  mouseSlicing.setScrollListener(
    minSlice,
    maxSlice,
    sliceStep,
    () => imageMapper.getSlice(),
    (val) => {
      console.log('setSlice: ', val);
      imageMapper.setSlice(val);
      updateWindowLevel(val);
      renderer.resetCamera();
      renderWindow.render();
    }
  );

  // Render
  renderWindow.render();
}

async function update() {
  console.log('Fetching/downloading the input file, please wait...');
  const zipFileData = await vtkLiteHttpDataAccessHelper.fetchBinary(
    // data.kitware.com --> MixedImagesMultiFrameRGBGray.zip
    `https://data.kitware.com/api/v1/item/63c1c7f96d3fc641a02d7f27/download`
  );

  console.log('Fetching/downloading input file done!');

  const zipFileDataArray = new Uint8Array(zipFileData);
  const decompressedFiles = unzipSync(zipFileDataArray);
  const dcmFiles = [];
  Object.keys(decompressedFiles).forEach((relativePath) => {
    if (relativePath.endsWith('.dcm')) {
      dcmFiles.push(relativePath);
    }
  });

  console.log('dcm files:', dcmFiles);

  const imageArray = [];
  await Promise.all(
    dcmFiles.map(async (filename, index) => {
      const { image: itkImage, webWorker } =
        await window.itk.readImageArrayBuffer(
          null,
          decompressedFiles[filename].buffer,
          filename
        );
      webWorker.terminate();

      const vtkImage = vtkITKHelper.convertItkToVtkImage(itkImage);
      imageArray[index] = vtkImage;
    })
  );

  if (imageArray.length > 0) {
    imageArray.map((elem) => collection.addItem(elem));
    labelSelector.innerText = '';
    load(vtkImageMapper.SlicingMode.K);
  }
}

// After the itk-wasm UMD script has been loaded, `window.itk` provides the itk-wasm API.
vtkResourceLoader
  .loadScript(
    'https://cdn.jsdelivr.net/npm/itk-wasm@1.0.0-b.8/dist/umd/itk-wasm.js'
  )
  .then(update);

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------
global.imageMapper = imageMapper;
global.imageActor = imageActor;
global.renderer = renderer;
global.renderWindow = renderWindow;
