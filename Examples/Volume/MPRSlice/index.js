import 'vtk.js/Sources/favicon';
/* eslint-disable */

import 'vtk.js/Sources/Rendering/Profiles/Volume';

// Force DataAccessHelper to have access to various data source
import 'vtk.js/Sources/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import 'vtk.js/Sources/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

global.fullScreen = fullScreenRenderer;
global.renderWindow = renderWindow;

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
const actor = vtkVolume.newInstance();
const mapper = vtkVolumeMapper.newInstance();
mapper.setSampleDistance(1.1);
actor.setMapper(mapper);
mapper.setInputConnection(reader.getOutputPort());

const mprSlice = vtkVolumeMapper.vtkSliceHelper.newInstance({ thickness: 3 });
mprSlice.registerClipPlanesToMapper(mapper);

reader.setUrl(`${__BASE_PATH__}/data/volume/headsq.vti`).then(() => {
  reader.loadData().then(() => {
    const data = reader.getOutputData();
    renderer.addVolume(actor);
    const [xMin, xMax, yMin, yMax, zMin, zMax] = data.getBounds();
    mprSlice.setOrigin((xMin + xMax) / 2, (yMin + yMax) / 2, (zMin + zMax) / 2);

    renderer.resetCamera();
    renderWindow.render();
  });
});

// Set MPR slice to follow camera orientation
const camera = renderer.getActiveCamera();
camera.onModified(() => {
  const direction = camera.getDirectionOfProjection();
  mprSlice.setNormal(direction);
});
