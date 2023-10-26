import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Volume';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

// Force the loading of HttpDataAccessHelper to support gzip decompression
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';

import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';

import vtkProxyManager from '@kitware/vtk.js/Proxy/Core/ProxyManager';

import vtkPlaneWidget from '@kitware/vtk.js/Widgets/Widgets3D/ImplicitPlaneWidget';
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';
import { SlabTypes } from 'vtk.js/Sources/Rendering/Core/ImageResliceMapper/Constants';

import proxyConfiguration from './proxy';

// ----------------------------------------------------------------------------
// Use a vtkHttpDataSetReader to get a promise of vtkImageData
// ----------------------------------------------------------------------------

const imageDataPromise = vtkHttpDataSetReader
  .newInstance({ fetchGzip: true })
  .setUrl(`${__BASE_PATH__}/data/volume/LIDC2.vti`)
  .then((reader) => reader.loadData())
  .then((reader) => reader.getOutputData());

// ----------------------------------------------------------------------------
// Create proxy manager
// ----------------------------------------------------------------------------

const proxyManager = vtkProxyManager.newInstance({ proxyConfiguration });

// ----------------------------------------------------------------------------
// Create DOM elements to use as container and a button
// ----------------------------------------------------------------------------

const mainContainer = document.createElement('div');
document.body.appendChild(mainContainer);

// Full screen main container
document.documentElement.style.height = '100%';
document.body.style.height = '100%';
document.body.style.margin = '0';
mainContainer.style.height = '100%';
mainContainer.style.display = 'flex';

const fitCameraButton = document.createElement('button');
fitCameraButton.innerText = 'Toggle camera fitting';
fitCameraButton.style.position = 'absolute';
fitCameraButton.style.top = '10px';
fitCameraButton.style.left = '10px';
fitCameraButton.style.zIndex = '100';
document.body.appendChild(fitCameraButton);

const resetCameraButton = document.createElement('button');
resetCameraButton.innerText = 'Reset Camera';
resetCameraButton.style.position = 'absolute';
resetCameraButton.style.top = '50px';
resetCameraButton.style.left = '10px';
resetCameraButton.style.zIndex = '100';
document.body.appendChild(resetCameraButton);

// ----------------------------------------------------------------------------
// Create a 2D view proxy
// ----------------------------------------------------------------------------

const view2DProxy = proxyManager.createProxy('Views', 'View2D', {
  axis: 2,
  fitProps: true,
});
view2DProxy.setContainer(mainContainer);
view2DProxy
  .getApiSpecificRenderWindow()
  .setSize(mainContainer.clientWidth, mainContainer.clientHeight);

fitCameraButton.addEventListener('click', () => {
  view2DProxy.setFitProps(!view2DProxy.getFitProps());
  view2DProxy.resetCamera();
});

resetCameraButton.addEventListener('click', view2DProxy.resetCamera);

view2DProxy.getRenderer().setBackground([65 / 255, 85 / 255, 122 / 255]);

const widgetManager = vtkWidgetManager.newInstance();
widgetManager.setRenderer(view2DProxy.getRenderer());

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

// ----------------------------------------------------------------------------
// Define widget setup
// ----------------------------------------------------------------------------
function setupWidget(im, rep) {
  const bds = im.getBounds();
  const imc = im.getCenter();
  const slicePlane = rep.getSlicePlane();
  slicePlane.setOrigin(imc);
  slicePlane.setNormal(0, 1, 0);
  widget.placeWidget(bds);

  const renderer = view2DProxy.getRenderer();
  renderer.getActiveCamera().setFocalPoint(...imc);
  renderer.getActiveCamera().setViewUp([0, 0, -1]);
  const planeState = widget.getWidgetState();
  planeState.setOrigin(slicePlane.getOrigin());
  planeState.setNormal(slicePlane.getNormal());
  planeState.onModified(() => {
    slicePlane.setOrigin(planeState.getOrigin());
    slicePlane.setNormal(planeState.getNormal());
  });
  const renderWindow = view2DProxy.getRenderWindow();
  renderWindow.render();
}

// ----------------------------------------------------------------------------
// Create source proxy
// ----------------------------------------------------------------------------

let representation2DProxy;
const sourceProxy = proxyManager.createProxy('Sources', 'TrivialProducer');
imageDataPromise.then((imageData) => {
  sourceProxy.setInputData(imageData);

  // ----------------------------------------------------------------------------
  // Create representation proxy
  // ----------------------------------------------------------------------------
  // The representationProxy can be used to change properties, color by an array, set LUTs, etc...

  representation2DProxy = proxyManager.getRepresentation(
    sourceProxy,
    view2DProxy
  );

  setupWidget(imageData, representation2DProxy);
  representation2DProxy.setSlicePolyData(null);
  representation2DProxy.setSlabThickness(30);
  representation2DProxy.setSlabTrapezoidIntegration(1.5);
  representation2DProxy.setSlabType(SlabTypes.MAX);
  representation2DProxy.setOutlineVisibility(true);
  representation2DProxy.setOutlineColor([1, 0, 0]);
  representation2DProxy.setOutlineLineWidth(4.0);

  view2DProxy.setFitProps(false);
  view2DProxy.resetCamera();
});

global.mainContainer = mainContainer;
global.proxyManager = proxyManager;
global.sourceProxy = sourceProxy;
global.view2DProxy = view2DProxy;
global.representation2DProxy = representation2DProxy;
global.widget = w;
