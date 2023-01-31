import '@kitware/vtk.js/favicon';

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
// Create DOM elements for the views
// ----------------------------------------------------------------------------

const mainContainer = document.createElement('div');
document.body.appendChild(mainContainer);

const view3DContainer = document.createElement('div');
mainContainer.appendChild(view3DContainer);

const view2DContainer = document.createElement('div');
mainContainer.appendChild(view2DContainer);

// Full screen main container
document.documentElement.style.height = '100%';
document.body.style.height = '100%';
document.body.style.margin = '0';
mainContainer.style.height = '100%';
mainContainer.style.display = 'flex';

// Half the screen for each container
const viewContainerStyle = document.createElement('style');
viewContainerStyle.innerHTML = `
.viewContainer {
  display: flex;
  position: relative;
  width: 50%;
  padding: 5px;
}
`;
document.head.appendChild(viewContainerStyle);

view3DContainer.className = 'viewContainer';
view2DContainer.className = 'viewContainer';

// ----------------------------------------------------------------------------
// Create view proxy for 3D
// ----------------------------------------------------------------------------

const view3DProxy = proxyManager.createProxy('Views', 'View3D');
view3DProxy.setContainer(view3DContainer);
view3DProxy
  .getOpenGLRenderWindow()
  .setSize([view3DContainer.clientWidth, view3DContainer.clientHeight]);

// ----------------------------------------------------------------------------
// Create view proxy for 2D
// ----------------------------------------------------------------------------

const view2DProxy = proxyManager.createProxy('Views', 'View2D', { axis: 2 });
view2DProxy.setContainer(view2DContainer);
view2DProxy
  .getOpenGLRenderWindow()
  .setSize([view2DContainer.clientWidth, view2DContainer.clientHeight]);

// ----------------------------------------------------------------------------
// Create source proxy
// ----------------------------------------------------------------------------

let representation3DProxy;
let representation2DProxy;
const sourceProxy = proxyManager.createProxy('Sources', 'TrivialProducer');
imageDataPromise.then((imageData) => {
  sourceProxy.setInputData(imageData);

  // ----------------------------------------------------------------------------
  // Create representation proxies for 2D and 3D views
  // ----------------------------------------------------------------------------
  // The representationProxy can be used to change properties, color by an array, set LUTs, etc...

  representation3DProxy = proxyManager.getRepresentation(
    sourceProxy,
    view3DProxy
  );
  view3DProxy.resetCamera();

  representation2DProxy = proxyManager.getRepresentation(
    sourceProxy,
    view2DProxy
  );
  view2DProxy.resetCamera();
});

global.mainContainer = mainContainer;
global.view3DContainer = view3DContainer;
global.view2DContainer = view2DContainer;
global.proxyManager = proxyManager;
global.sourceProxy = sourceProxy;
global.view3DProxy = view3DProxy;
global.view2DProxy = view2DProxy;
global.representation3DProxy = representation3DProxy;
global.representation2DProxy = representation2DProxy;
