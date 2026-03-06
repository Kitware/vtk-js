// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkImageMarchingCubes from '@kitware/vtk.js/Filters/General/ImageMarchingCubes';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import vtkBFSConnectivityFilter from '@kitware/vtk.js/Filters/General/BFSConnectivityFilter';
import Constants from '@kitware/vtk.js/Filters/General/BFSConnectivityFilter/Constants';

import GUI from 'lil-gui';

const { ExtractionMode } = Constants;

function createVTKImageData(typedArray, dims, dataType, spacing) {
  const data = vtkImageData.newInstance();
  const [width, height, depth] = dims;
  data.setDimensions(width, height, depth);
  data.setSpacing(...spacing);

  const scalars = vtkDataArray.newInstance({
    values: typedArray,
    numberOfComponents: 1,
    dataType,
  });
  data.getPointData().setScalars(scalars);

  return data;
}

// Create three spheres for testing
function generateTestVolumeData(size) {
  const WIDTH = size[0];
  const HEIGHT = size[1];
  const DEPTH = size[2];
  const TOTAL_COUNT = WIDTH * HEIGHT * DEPTH;
  const data = new Uint8Array(TOTAL_COUNT);

  const centerX1 = WIDTH / 3;
  const centerY1 = HEIGHT / 3;
  const centerZ1 = DEPTH / 3;
  const radius = Math.min(WIDTH, HEIGHT, DEPTH) / 4;

  const centerX2 = (WIDTH / 3) * 2;
  const centerY2 = (HEIGHT / 3) * 2;
  const centerZ2 = (DEPTH / 3) * 2;
  const radius2 = radius / 2;

  const centerX3 = WIDTH / 4;
  const centerY3 = HEIGHT / 1.2;
  const centerZ3 = DEPTH / 3;
  const radius3 = radius / 3;

  for (let z = 0; z < DEPTH; z++) {
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const index = z * WIDTH * HEIGHT + y * WIDTH + x;
        const distance = Math.sqrt(
          (x - centerX1) ** 2 + (y - centerY1) ** 2 + (z - centerZ1) ** 2
        );
        const distance2 = Math.sqrt(
          (x - centerX2) ** 2 + (y - centerY2) ** 2 + (z - centerZ2) ** 2
        );
        const distance3 = Math.sqrt(
          (x - centerX3) ** 2 + (y - centerY3) ** 2 + (z - centerZ3) ** 2
        );
        if (distance2 < radius2) {
          data[index] = 200;
        } else if (distance3 < radius3) {
          data[index] = 200;
        } else if (distance < radius) {
          data[index] = 200;
        } else {
          data[index] = 0;
        }
      }
    }
  }

  return data;
}

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const extractionModeOptions = [
  'ExtractionMode_ALL',
  'ExtractionMode_LARGEST',
  'ExtractionMode_SMALLEST',
  'ExtractionMode_CUSTOM',
];
const params = {
  IsoValue: 100.0,
  ExtractionMode: extractionModeOptions[0],
  CustomRegionIndex: 0,
};

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
const actor = vtkActor.newInstance();
renderer.addActor(actor);

const mapper = vtkMapper.newInstance();
actor.setMapper(mapper);

const dataSize = [64, 64, 64];
// eslint-disable-next-line no-use-before-define
const testData = generateTestVolumeData(dataSize);
const imageData = createVTKImageData(
  testData,
  dataSize,
  'Uint8Array',
  [1, 1, 1]
);

const mCubes = vtkImageMarchingCubes.newInstance({
  contourValue: 100.0,
  computeNormals: true,
  mergePoints: true, // if false, Unable to locate the connectivity regions
});
mCubes.setInputData(imageData);

const bfsFilter = vtkBFSConnectivityFilter.newInstance();
bfsFilter.setInputConnection(mCubes.getOutputPort());
bfsFilter.setExtractionModeToAll();

mapper.setInputConnection(bfsFilter.getOutputPort());

// ----------------------------------------------------------------------------
// UI control handling
// ----------------------------------------------------------------------------
const gui = new GUI({ width: 300 });

gui
  .add(params, 'IsoValue', 0, 255, 1)
  .name('Iso value')
  .onChange((v) => {
    mCubes.setContourValue(Number(v));
    renderWindow.render();
  });

let customIndexController;

gui
  .add(params, 'ExtractionMode', extractionModeOptions)
  .name('Mode')
  .onChange((value) => {
    if (bfsFilter) {
      const mode = ExtractionMode[value];
      bfsFilter.set({ extractionMode: mode });
      if (mode === ExtractionMode.ExtractionMode_CUSTOM) {
        const count = bfsFilter.getRegionsCount();
        console.log(`Total regions count: ${count}`);
        customIndexController.max(count - 1);
        customIndexController.show(true);
      } else {
        customIndexController.show(false);
      }
    }
    renderWindow.render();
  });

customIndexController = gui
  .add(params, 'CustomRegionIndex', 0, 1, 1)
  .name('Custom Region Index')
  .onChange((v) => {
    if (bfsFilter) {
      bfsFilter.setExtractionIndex(Number(v));
      renderWindow.render();
    }
  });
customIndexController.show(false);

// -----------------------------------------------------------
const camera = renderer.getActiveCamera();
camera.setPosition(1, 1, -1);
camera.setViewUp(0, 1, 0);
camera.setFocalPoint(0, 0, 0);

renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.filter = bfsFilter;
global.mapper = mapper;
global.actor = actor;
