import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';
import 'vtk.js/Sources/Rendering/Profiles/Molecule'; // for vtkSphereMapper

import { mat4, vec3 } from 'gl-matrix';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkSphereMapper from 'vtk.js/Sources/Rendering/Core/SphereMapper';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkPixelSpaceCallbackMapper from 'vtk.js/Sources/Rendering/Core/PixelSpaceCallbackMapper';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';
import vtk from 'vtk.js/Sources/vtk';

// Need polydata registered in the vtk factory
import 'vtk.js/Sources/Common/Core/Points';
import 'vtk.js/Sources/Common/Core/DataArray';
import 'vtk.js/Sources/Common/Core/StringArray';
import 'vtk.js/Sources/Common/DataModel/PolyData';

import style from './style.module.css';

function affine(val, inMin, inMax, outMin, outMax) {
  return ((val - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

// ----------------------------------------------------------------------------
// Create a div section to put example into
// ----------------------------------------------------------------------------

const bodyElement = document.querySelector('body');
const container = document.createElement('div');
container.classList.add(style.container);
bodyElement.appendChild(container);

let textCtx = null;
let windowWidth = 0;
let windowHeight = 0;
const enableDebugCanvas = true;
let debugHandler = null;

const renderWindow = vtkRenderWindow.newInstance();
const renderer = vtkRenderer.newInstance({ background: [0.2, 0.3, 0.4] });
renderWindow.addRenderer(renderer);

const pointPoly = vtk({
  vtkClass: 'vtkPolyData',
  points: {
    vtkClass: 'vtkPoints',
    dataType: 'Float32Array',
    numberOfComponents: 3,
    values: [0, 0, -1],
  },
  polys: {
    vtkClass: 'vtkCellArray',
    dataType: 'Uint16Array',
    values: [1, 0],
  },
  pointData: {
    vtkClass: 'vtkDataSetAttributes',
    arrays: [
      {
        data: {
          vtkClass: 'vtkStringArray',
          name: 'pointLabels',
          dataType: 'string',
          values: ['Neo'],
        },
      },
    ],
  },
});

const planePoly = vtk({
  vtkClass: 'vtkPolyData',
  points: {
    vtkClass: 'vtkPoints',
    dataType: 'Float32Array',
    numberOfComponents: 3,
    values: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0],
  },
  polys: {
    vtkClass: 'vtkCellArray',
    dataType: 'Uint16Array',
    values: [3, 0, 1, 2, 3, 0, 2, 3],
  },
});

function resetCameraPosition(doRender = false) {
  const activeCamera = renderWindow.getRenderers()[0].getActiveCamera();
  activeCamera.setPosition(0, 0, 3);
  activeCamera.setFocalPoint(0, 0, 0);
  activeCamera.setViewUp(0, 1, 0);
  activeCamera.setClippingRange(3.49999, 4.50001);

  if (doRender) {
    renderWindow.render();
  }
}

function initializeDebugHandler() {
  const debugCanvas = document.createElement('canvas');
  const debugCtx = debugCanvas.getContext('2d');

  const debugCanvasSize = 1 / 4;
  let dbgWidth = 0;
  let dbgHeight = 0;
  let lastDepthBuffer = null;

  debugCanvas.addEventListener('click', (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    const x = (evt.pageX - debugCanvas.offsetLeft) / debugCanvasSize;
    const y = (evt.pageY - debugCanvas.offsetTop) / debugCanvasSize;

    if (lastDepthBuffer && dbgWidth > 0 && dbgHeight > 0) {
      const dIdx =
        ((dbgHeight - 1 - Math.floor(y)) * dbgWidth + Math.floor(x)) * 4;
      const r = lastDepthBuffer[dIdx] / 255;
      const g = lastDepthBuffer[dIdx + 1] / 255;
      let z = (r * 256 + g) / 257;
      z = z * 2 - 1; // scale depths from [0, 1] into [-1, 1]
      console.log(`depth at (${x}, ${y}) is ${z}`);

      const activeCamera = renderWindow.getRenderers()[0].getActiveCamera();
      const crange = activeCamera.getClippingRange();
      console.log(`current clipping range: [${crange[0]}, ${crange[1]}]`);
    } else {
      console.log(`click(${x}, ${y})`);
    }
  });

  debugCanvas.classList.add(style.debugCanvas, 'debugCanvas');
  bodyElement.appendChild(debugCanvas);

  return {
    update: (coordsList, depthBuffer) => {
      debugCtx.fillStyle = 'rgba(255, 255, 255, 1.0)';
      debugCtx.clearRect(0, 0, dbgWidth, dbgHeight);

      if (!depthBuffer) {
        console.error('Expected a depthBuffer!');
        return;
      }

      lastDepthBuffer = depthBuffer;

      if (dbgWidth === 0 || dbgHeight === 0) {
        console.log('No size yet, cannot draw debug canvas');
        return;
      }

      const depthRange = [10000000, -10000000];

      const imageData = debugCtx.getImageData(0, 0, dbgWidth, dbgHeight);
      const data = imageData.data;
      for (let y = 0; y < imageData.height; y += 1) {
        for (let x = 0; x < imageData.width; x += 1) {
          // Going back to the raw pixels again here, so they need to be
          // flipped in y as the Core/PixelSpaceCallbackMapper already did.
          const dIdx = ((imageData.height - 1 - y) * imageData.width + x) * 4;

          const r = depthBuffer[dIdx] / 255;
          const g = depthBuffer[dIdx + 1] / 255;
          const z = (r * 256 + g) / 257;
          // z = (z * 2) - 1;   // scale depths from [0, 1] into [-1, 1]
          const zColor = affine(z, 0, 1, 0, 255);
          const pIdx = (y * imageData.width + x) * 4;
          data[pIdx] = zColor;
          data[pIdx + 1] = zColor;
          data[pIdx + 2] = zColor;
          data[pIdx + 3] = 255;

          if (z < depthRange[0]) {
            depthRange[0] = z;
          }

          if (z > depthRange[1]) {
            depthRange[1] = z;
          }

          // z = (z * 2) - 1;   // scale depths from [0, 1] into [-1, 1]

          // const pdepth = depthValues[dIdx] * 255;
          // const pdepth = affine(depthValues[dIdx], depthRange.min, depthRange.max, 0, 255);
          // const pIdx = ((y * imageData.width) + x) * 4;
          // data[pIdx] = pdepth;
          // data[pIdx + 1] = pdepth;
          // data[pIdx + 2] = pdepth;
          // data[pIdx + 3] = 255;
        }
      }
      debugCtx.putImageData(imageData, 0, 0);

      // console.log(`depth range: [${depthRange[0]}, ${depthRange[1]}], delta: ${depthRange[1] - depthRange[0]}`);
    },
    resize: (w, h) => {
      console.log(`Debug canvas resize: [${w}, ${h}]`);
      const aspect = w / h;
      const sw = w * debugCanvasSize;
      const sh = sw / aspect;
      debugCanvas.setAttribute('width', w);
      debugCanvas.setAttribute('height', h);
      debugCanvas.setAttribute('style', `width: ${sw}px; height: ${sh}px;`);
      dbgWidth = w;
      dbgHeight = h;
    },
  };
}

const pointMapper = vtkSphereMapper.newInstance({ radius: 0.5 });
const pointActor = vtkActor.newInstance();
pointMapper.setInputData(pointPoly);
pointActor.setMapper(pointMapper);

const planeMapper = vtkMapper.newInstance();
const planeActor = vtkActor.newInstance();
planeMapper.setInputData(planePoly);
planeActor.setMapper(planeMapper);

const psMapper = vtkPixelSpaceCallbackMapper.newInstance();
psMapper.setInputData(pointPoly);
psMapper.setUseZValues(true);
psMapper.setCallback((coordsList, camera, aspect, depthBuffer) => {
  if (textCtx && windowWidth > 0 && windowHeight > 0) {
    const dataPoints = psMapper.getInputData().getPoints();

    const viewMatrix = camera.getViewMatrix();
    mat4.transpose(viewMatrix, viewMatrix);
    const projMatrix = camera.getProjectionMatrix(aspect, -1, 1);
    mat4.transpose(projMatrix, projMatrix);

    textCtx.clearRect(0, 0, windowWidth, windowHeight);
    coordsList.forEach((xy, idx) => {
      const pdPoint = dataPoints.getPoint(idx);
      const vc = vec3.fromValues(pdPoint[0], pdPoint[1], pdPoint[2]);
      vec3.transformMat4(vc, vc, viewMatrix);
      vc[2] += 0.5; // sphere mapper's radius
      vec3.transformMat4(vc, vc, projMatrix);

      console.log(
        `Distance to camera: point = ${xy[2]}, depth buffer = ${xy[3]}`
      );
      if (vc[2] - 0.001 < xy[3]) {
        textCtx.font = '12px serif';
        textCtx.textAlign = 'center';
        textCtx.textBaseline = 'middle';
        textCtx.fillText(`p ${idx}`, xy[0], windowHeight - xy[1]);
      }
    });
    const activeCamera = renderWindow.getRenderers()[0].getActiveCamera();
    const crange = activeCamera.getClippingRange();
    console.log(`current clipping range: [${crange[0]}, ${crange[1]}]`);
  }

  if (enableDebugCanvas && depthBuffer) {
    if (!debugHandler) {
      debugHandler = initializeDebugHandler();
    }
    debugHandler.update(coordsList, depthBuffer);
  }
});

const textActor = vtkActor.newInstance();
textActor.setMapper(psMapper);

// ----------------------------------------------------------------------------
// Add the actor to the renderer and set the camera based on it
// ----------------------------------------------------------------------------

renderer.addActor(pointActor);
renderer.addActor(textActor);
renderer.addActor(planeActor);

resetCameraPosition();

// renderer.resetCamera();

// const cp = activeCamera.getPosition();
// const cf = activeCamera.getFocalPoint();
// console.log(`new cam pos: [${cp[0]}, ${cp[1]}, ${cp[2]}], new cam fp: [${cf[0]}, ${cf[1]}, ${cf[2]}]`);

// ----------------------------------------------------------------------------
// Use OpenGL as the backend to view the all this
// ----------------------------------------------------------------------------

const openglRenderWindow = vtkOpenGLRenderWindow.newInstance();
renderWindow.addView(openglRenderWindow);
openglRenderWindow.setContainer(container);

const textCanvas = document.createElement('canvas');
textCanvas.classList.add(style.container, 'textCanvas');
container.appendChild(textCanvas);

textCtx = textCanvas.getContext('2d');

// ----------------------------------------------------------------------------
// Setup an interactor to handle mouse events
// ----------------------------------------------------------------------------

const interactor = vtkRenderWindowInteractor.newInstance();
interactor.setView(openglRenderWindow);
interactor.initialize();
interactor.bindEvents(container);

interactor.setInteractorStyle(vtkInteractorStyleTrackballCamera.newInstance());

// Handle window resize
function resize() {
  const dims = container.getBoundingClientRect();
  windowWidth = Math.floor(dims.width);
  windowHeight = Math.floor(dims.height);
  openglRenderWindow.setSize(windowWidth, windowHeight);
  textCanvas.setAttribute('width', windowWidth);
  textCanvas.setAttribute('height', windowHeight);
  if (debugHandler) {
    debugHandler.resize(windowWidth, windowHeight);
  }
  renderWindow.render();
}

window.addEventListener('resize', resize);

resize();

bodyElement.addEventListener('keypress', (e) => {
  if (String.fromCharCode(e.charCode) === 'm') {
    renderWindow.render();
  } else if (String.fromCharCode(e.charCode) === 'n') {
    resetCameraPosition(true);
  }
});
