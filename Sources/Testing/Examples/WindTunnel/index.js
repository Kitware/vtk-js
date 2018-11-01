import 'vtk.js/Sources/favicon';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkOBJReader from 'vtk.js/Sources/IO/Misc/OBJReader';
import vtkOutlineFilter from 'vtk.js/Sources/Filters/General/OutlineFilter';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

import controlPanel from './controller.html';
import style from './windtunnel.module.css';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------

const dataModel = {
  wind: {
    direction: ['x', '+'],
    orientation: ['z', '+'],
    speed: 20,
  },
  size: {
    object: [-1, 1, -1, 1, -1, 1],
    tunnel: [-1, 1, -1, 1, -1, 1],
  },
};

const tunnelPoints = Float32Array.from([-1, -1, -1, 1, 1, 1]);
const tunnelPolyData = vtkPolyData.newInstance();
tunnelPolyData.getPoints().setData(tunnelPoints, 3);
tunnelPolyData.getVerts().setData(Uint16Array.from([2, 0, 1]));

// ----------------------------------------------------------------------------

function updateUI() {
  // Update Object bounds
  const objBounds = dataModel.size.object;
  document.querySelector('.ox0').value = objBounds[0].toFixed(3);
  document.querySelector('.ox1').value = objBounds[1].toFixed(3);
  document.querySelector('.oy0').value = objBounds[2].toFixed(3);
  document.querySelector('.oy1').value = objBounds[3].toFixed(3);
  document.querySelector('.oz0').value = objBounds[4].toFixed(3);
  document.querySelector('.oz1').value = objBounds[5].toFixed(3);

  // Update tunnel bounds
  const tunnelBounds = dataModel.size.tunnel;
  for (let i = 0; i < 3; i++) {
    if (tunnelBounds[i * 2] > objBounds[i * 2]) {
      tunnelBounds[i * 2] = objBounds[i * 2];
    }
    if (tunnelBounds[i * 2 + 1] < objBounds[i * 2 + 1]) {
      tunnelBounds[i * 2 + 1] = objBounds[i * 2 + 1];
    }
  }
  document.querySelector('.tx0').value = tunnelBounds[0].toFixed(3);
  document.querySelector('.tx1').value = tunnelBounds[1].toFixed(3);
  document.querySelector('.ty0').value = tunnelBounds[2].toFixed(3);
  document.querySelector('.ty1').value = tunnelBounds[3].toFixed(3);
  document.querySelector('.tz0').value = tunnelBounds[4].toFixed(3);
  document.querySelector('.tz1').value = tunnelBounds[5].toFixed(3);

  // Update active button
  const clickNodes = document.querySelectorAll('.click');
  for (let i = 0; i < clickNodes.length; i++) {
    const el = clickNodes[i];
    const [field, index, value] = el.dataset.click.split(':');
    if (dataModel.wind[field][Number(index)] === value) {
      el.classList.add(style.active);
    } else {
      el.classList.remove(style.active);
    }
    if (field === 'orientation' && index === '0') {
      if (dataModel.wind.direction[0] === value) {
        el.classList.add(style.hidden);
      } else {
        el.classList.remove(style.hidden);
      }
    }
  }

  // Update tunnel bounds
  const boundsMapping = [0, 3, 1, 4, 2, 5];
  let changeDetected = false;
  dataModel.size.tunnel.forEach((v, i) => {
    if (tunnelPoints[boundsMapping[i]] !== Number(v)) {
      changeDetected = true;
    }
    tunnelPoints[boundsMapping[i]] = Number(v);
  });
  if (changeDetected) {
    tunnelPolyData.getPoints().setData(tunnelPoints, 3);
    tunnelPolyData.modified();
    renderer.resetCamera();
  }
  renderWindow.render();
}

// ----------------------------------------------------------------------------

function onClick(event) {
  if (event) {
    const [field, index, value] = event.target.dataset.click.split(':');
    dataModel.wind[field][Number(index)] = value;
  }

  if (dataModel.wind.direction[0] === dataModel.wind.orientation[0]) {
    if ('xyz'.indexOf(dataModel.wind.direction[0]) < 2) {
      dataModel.wind.orientation[0] = 'z';
    } else {
      dataModel.wind.orientation[0] = 'y';
    }
  }

  const camera = renderer.getActiveCamera();
  const mappingIndex = 'xyz'.indexOf(dataModel.wind.direction[0]);
  const delta = dataModel.wind.direction[1] === '+' ? 1 : -1;
  const focalPoint = camera.getFocalPoint();
  const position = focalPoint.map(
    (v, i) => (i === mappingIndex ? v + delta : v)
  );
  const viewUp = [0, 0, 0];
  viewUp['xyz'.indexOf(dataModel.wind.orientation[0])] =
    dataModel.wind.orientation[1] === '+' ? 1 : -1;
  camera.set({ focalPoint, position, viewUp });
  renderer.resetCamera();
  updateUI();
}

// ----------------------------------------------------------------------------

function onChange(event) {
  const el = event.target;
  const [name, index] = el.name.split(':');
  if (name === 'speed') {
    dataModel.wind.speed = el.value;
  } else if (name === 'bounds') {
    dataModel.size.tunnel[Number(index)] = Number(el.value);
  }
  updateUI();
}

// ----------------------------------------------------------------------------
// UI control handling
// ----------------------------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

// Apply style
const styleNodes = document.querySelectorAll('.style');
for (let i = 0; i < styleNodes.length; i++) {
  const el = styleNodes[i];
  el.classList.add(style[el.dataset.style]);
}

// Add click listeners
const clickNodes = document.querySelectorAll('.click');
for (let i = 0; i < clickNodes.length; i++) {
  const el = clickNodes[i];
  el.onclick = onClick;
}

// Add change listeners
const changeNodes = document.querySelectorAll('.change');
for (let i = 0; i < changeNodes.length; i++) {
  const el = changeNodes[i];
  el.onchange = onChange;
}

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------

const reader = vtkOBJReader.newInstance();
const mapper = vtkMapper.newInstance();
const actor = vtkActor.newInstance();
mapper.setInputConnection(reader.getOutputPort());
actor.setMapper(mapper);

reader
  .setUrl(
    'https://data.kitware.com/api/v1/file/589b535f8d777f07219fcc58/download',
    { fullpath: true, compression: 'gz' }
  )
  .then(() => {
    dataModel.size.object = reader.getOutputData().getBounds();
    updateUI();

    renderer.addActor(actor);
    renderer.resetCamera();
    renderWindow.render();
    onClick();
  });

const tunnelBounds = vtkOutlineFilter.newInstance();
const tunnelMapper = vtkMapper.newInstance();
const tunnelActor = vtkActor.newInstance();
tunnelBounds.setInputData(tunnelPolyData);
tunnelMapper.setInputConnection(tunnelBounds.getOutputPort());
tunnelActor.setMapper(tunnelMapper);
renderer.addActor(tunnelActor);

// ----------------------------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// ----------------------------------------------------------------------------

global.dataModel = dataModel;
global.source = reader;
global.mapper = mapper;
global.actor = actor;
global.tunnelBounds = tunnelBounds;
global.tunnelMapper = tunnelMapper;
global.tunnelActor = tunnelActor;
global.renderer = renderer;
global.renderWindow = renderWindow;
