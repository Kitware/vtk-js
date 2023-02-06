import '@kitware/vtk.js/favicon';
import { mat3 } from 'gl-matrix';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Volume';

// Force the loading of HttpDataAccessHelper to support gzip decompression
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';

import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';

import vtkProxyManager from '@kitware/vtk.js/Proxy/Core/ProxyManager';
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
  .getOpenGLRenderWindow()
  .setSize([mainContainer.clientWidth, mainContainer.clientHeight]);

fitCameraButton.addEventListener('click', () => {
  view2DProxy.setFitProps(!view2DProxy.getFitProps());
  view2DProxy.resetCamera();
});

resetCameraButton.addEventListener('click', view2DProxy.resetCamera);

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

  // Scrolling through the slices shows that the bounding box of the volume fits perfectly in the view

  // Rotate the prop
  const prop = representation2DProxy.getActors()[0];
  prop.rotateY(40);
  prop.rotateX(25);
  prop.rotateZ(10);

  // Rotate the imageData
  imageData.setDirection(mat3.fromRotation([], 0.6));

  view2DProxy.resetCamera();
});

global.mainContainer = mainContainer;
global.proxyManager = proxyManager;
global.sourceProxy = sourceProxy;
global.view2DProxy = view2DProxy;
global.representation2DProxy = representation2DProxy;
