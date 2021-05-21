import { vec3, quat, mat4 } from 'gl-matrix';

import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';
import 'vtk.js/Sources/Rendering/Profiles/Volume';
import 'vtk.js/Sources/Rendering/Profiles/Glyph';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkWidgetManager from 'vtk.js/Sources/Widgets/Core/WidgetManager';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkImageCroppingWidget from 'vtk.js/Sources/Widgets/Widgets3D/ImageCroppingWidget';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';

// Force the loading of HttpDataAccessHelper to support gzip decompression
import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper';

import controlPanel from './controlPanel.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
const apiRenderWindow = fullScreenRenderer.getApiSpecificRenderWindow();

global.renderer = renderer;
global.renderWindow = renderWindow;

// ----------------------------------------------------------------------------
// 2D overlay rendering
// ----------------------------------------------------------------------------

const overlaySize = 15;
const overlayBorder = 2;
const overlay = document.createElement('div');
overlay.style.position = 'absolute';
overlay.style.width = `${overlaySize}px`;
overlay.style.height = `${overlaySize}px`;
overlay.style.border = `solid ${overlayBorder}px red`;
overlay.style.borderRadius = '50%';
overlay.style.left = '-100px';
overlay.style.pointerEvents = 'none';
document.querySelector('body').appendChild(overlay);

// ----------------------------------------------------------------------------
// Widget manager
// ----------------------------------------------------------------------------

const widgetManager = vtkWidgetManager.newInstance();
widgetManager.setRenderer(renderer);

const widget = vtkImageCroppingWidget.newInstance();

function widgetRegistration(e) {
  const action = e ? e.currentTarget.dataset.action : 'addWidget';
  const viewWidget = widgetManager[action](widget);
  if (viewWidget) {
    viewWidget.setDisplayCallback((coords) => {
      overlay.style.left = '-100px';
      if (coords) {
        const [w, h] = apiRenderWindow.getSize();
        overlay.style.left = `${Math.round(
          (coords[0][0] / w) * window.innerWidth -
            overlaySize * 0.5 -
            overlayBorder
        )}px`;
        overlay.style.top = `${Math.round(
          ((h - coords[0][1]) / h) * window.innerHeight -
            overlaySize * 0.5 -
            overlayBorder
        )}px`;
      }
    });

    renderer.resetCamera();
    renderer.resetCameraClippingRange();
  }
  widgetManager.enablePicking();
  renderWindow.render();
}

// Initial widget register
widgetRegistration();

// ----------------------------------------------------------------------------
// Volume rendering
// ----------------------------------------------------------------------------

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });

const actor = vtkVolume.newInstance();
const mapper = vtkVolumeMapper.newInstance();
mapper.setSampleDistance(1.1);
actor.setMapper(mapper);

// create color and opacity transfer functions
const ctfun = vtkColorTransferFunction.newInstance();
ctfun.addRGBPoint(0, 85 / 255.0, 0, 0);
ctfun.addRGBPoint(95, 1.0, 1.0, 1.0);
ctfun.addRGBPoint(225, 0.66, 0.66, 0.5);
ctfun.addRGBPoint(255, 0.3, 1.0, 0.5);
const ofun = vtkPiecewiseFunction.newInstance();
ofun.addPoint(0.0, 0.0);
ofun.addPoint(255.0, 1.0);
actor.getProperty().setRGBTransferFunction(0, ctfun);
actor.getProperty().setScalarOpacity(0, ofun);
actor.getProperty().setScalarOpacityUnitDistance(0, 3.0);
actor.getProperty().setInterpolationTypeToLinear();
actor.getProperty().setUseGradientOpacity(0, true);
actor.getProperty().setGradientOpacityMinimumValue(0, 2);
actor.getProperty().setGradientOpacityMinimumOpacity(0, 0.0);
actor.getProperty().setGradientOpacityMaximumValue(0, 20);
actor.getProperty().setGradientOpacityMaximumOpacity(0, 1.0);
actor.getProperty().setShade(true);
actor.getProperty().setAmbient(0.2);
actor.getProperty().setDiffuse(0.7);
actor.getProperty().setSpecular(0.3);
actor.getProperty().setSpecularPower(8.0);

mapper.setInputConnection(reader.getOutputPort());

// -----------------------------------------------------------
// Get data
// -----------------------------------------------------------

function getCroppingPlanes(imageData, ijkPlanes) {
  const rotation = quat.create();
  mat4.getRotation(rotation, imageData.getIndexToWorld());

  const rotateVec = (vec) => {
    const out = [0, 0, 0];
    vec3.transformQuat(out, vec, rotation);
    return out;
  };

  const [iMin, iMax, jMin, jMax, kMin, kMax] = ijkPlanes;
  const origin = imageData.indexToWorld([iMin, jMin, kMin]);
  // opposite corner from origin
  const corner = imageData.indexToWorld([iMax, jMax, kMax]);
  return [
    // X min/max
    vtkPlane.newInstance({ normal: rotateVec([1, 0, 0]), origin }),
    vtkPlane.newInstance({ normal: rotateVec([-1, 0, 0]), origin: corner }),
    // Y min/max
    vtkPlane.newInstance({ normal: rotateVec([0, 1, 0]), origin }),
    vtkPlane.newInstance({ normal: rotateVec([0, -1, 0]), origin: corner }),
    // X min/max
    vtkPlane.newInstance({ normal: rotateVec([0, 0, 1]), origin }),
    vtkPlane.newInstance({ normal: rotateVec([0, 0, -1]), origin: corner }),
  ];
}

reader.setUrl(`${__BASE_PATH__}/data/volume/LIDC2.vti`).then(() => {
  reader.loadData().then(() => {
    const image = reader.getOutputData();

    // update crop widget
    widget.copyImageDataDescription(image);
    const cropState = widget.getWidgetState().getCroppingPlanes();
    cropState.onModified(() => {
      const planes = getCroppingPlanes(image, cropState.getPlanes());
      mapper.removeAllClippingPlanes();
      planes.forEach((plane) => {
        mapper.addClippingPlane(plane);
      });
      mapper.modified();
    });

    // add volume to renderer
    renderer.addVolume(actor);
    renderer.resetCamera();
    renderer.resetCameraClippingRange();
    renderWindow.render();
  });
});

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

function updateFlag(e) {
  const value = !!e.target.checked;
  const name = e.currentTarget.dataset.name;
  widget.set({ [name]: value }); // can be called on either viewWidget or parentWidget

  widgetManager.enablePicking();
  renderWindow.render();
}

const elems = document.querySelectorAll('.flag');
for (let i = 0; i < elems.length; i++) {
  elems[i].addEventListener('change', updateFlag);
}

const buttons = document.querySelectorAll('button');
for (let i = 0; i < buttons.length; i++) {
  buttons[i].addEventListener('click', widgetRegistration);
}
