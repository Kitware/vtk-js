import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/All';

import 'vtk.js/Sources/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

import vtkProxyManager from 'vtk.js/Sources/Proxy/Core/ProxyManager';
import vtkHttpSceneLoader from 'vtk.js/Sources/IO/Core/HttpSceneLoader';
import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';

import proxyConfiguration from './proxyConfiguration';

import controlPanel from './controller.html';

const STYLE_CONTAINER = {
  margin: '0',
  padding: '0',
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
};

const STYLE_CONTROL_PANEL = {
  position: 'absolute',
  left: '25px',
  top: '25px',
  backgroundColor: 'white',
  borderRadius: '5px',
  listStyle: 'none',
  padding: '5px 10px',
  margin: '0',
  display: 'block',
  border: 'solid 1px black',
  maxWidth: 'calc(100% - 70px)',
  maxHeight: 'calc(100% - 60px)',
  overflow: 'auto',
  color: 'black',
  zIndex: '3',
};

function applyStyle(el, style) {
  Object.keys(style).forEach((key) => {
    el.style[key] = style[key];
  });
}

function initializePanel(animationManager, viewProxy) {
  const play = document.getElementById('play');
  play.addEventListener('click', () =>
    animationManager.play(() => viewProxy.render())
  );

  const pause = document.getElementById('pause');
  pause.addEventListener('click', () => animationManager.pause());

  const nextFrame = document.getElementById('nextFrame');
  nextFrame.addEventListener('click', () => animationManager.nextFrame());

  const previousFrame = document.getElementById('previousFrame');
  previousFrame.addEventListener('click', () =>
    animationManager.previousFrame()
  );

  const firstFrame = document.getElementById('firstFrame');
  firstFrame.addEventListener('click', () => animationManager.firstFrame());

  const lastFrame = document.getElementById('lastFrame');
  lastFrame.addEventListener('click', () => animationManager.lastFrame());

  const currentFrame = document.getElementById('currentFrame');
  currentFrame.innerHTML = `${animationManager.getCurrentFrame()}`;

  animationManager.onCurrentFrameChanged(() => {
    viewProxy.render();
    currentFrame.innerHTML = `${animationManager.getCurrentFrame()}`;
  });
}

// Create and initialize our ProxyManager
const proxyManager = vtkProxyManager.newInstance({ proxyConfiguration });
const animationManager = proxyManager.createProxy(
  'Animations',
  'AnimationManager'
);

// Create our ViewProxy
const viewProxy = proxyManager.createProxy('Views', 'View3D');

// Use a new DOM element as container for the ViewProxy
const container = document.createElement('div');
applyStyle(container, STYLE_CONTAINER);

document.body.appendChild(container);
viewProxy.setContainer(container);
viewProxy.resize();

// Add the control panel to the page
const annotation = viewProxy.getCornerAnnotation().getNorthWestContainer();
applyStyle(annotation, STYLE_CONTROL_PANEL);
annotation.innerHTML = controlPanel;

viewProxy.resetCamera();

function downloadZipFile(url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onreadystatechange = (e) => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200 || xhr.status === 0) {
          resolve(xhr.response);
        } else {
          reject(xhr, e);
        }
      }
    };

    // Make request
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.send();
  });
}

downloadZipFile(
  'https://kitware.github.io/vtk-js-datasets/data/vtkjs/timesteps.vtkjs'
).then((zipContent) => {
  const dataAccessHelper = DataAccessHelper.get('zip', {
    zipContent,
    callback() {
      const sceneImporter = vtkHttpSceneLoader.newInstance({
        dataAccessHelper,
      });

      global.sceneImporter = sceneImporter;

      sceneImporter.setUrl('index.json');
      let datasetCount = 0;
      sceneImporter.onReady(() => {
        // Wait for all datasets to be done loading
        ++datasetCount;
        if (datasetCount < sceneImporter.getScene().length) {
          return;
        }

        sceneImporter.getScene().forEach((sceneItem) => {
          const { source, mapper, actor } = sceneItem;
          const actorState = actor
            ? actor.get('origin', 'scale', 'position')
            : {};
          const propState = actor
            ? actor
                .getProperty()
                .get(
                  'representation',
                  'edgeVisibility',
                  'diffuseColor',
                  'pointSize',
                  'opacity'
                )
            : {};
          const mapperState = mapper.get(
            'colorByArrayName',
            'colorMode',
            'scalarMode'
          );

          // Create sources
          const sourceProxy = proxyManager.createProxy(
            'Sources',
            'TrivialProducer'
          );
          sourceProxy.setInputAlgorithm(
            source,
            source.getOutputData().getClassName()
          );
          sourceProxy.activate();

          const rep = proxyManager.getRepresentation(sourceProxy, viewProxy);
          rep.setRescaleOnColorBy(false);
          if (actor) {
            const actorFromRep = rep.getActors()[0];
            if (actorFromRep) {
              actorFromRep.set(actorState);
              actorFromRep.getProperty().set(propState);
              actorFromRep.getMapper().set(mapperState);
            }
          }
        });

        if (sceneImporter.getAnimationHandler()) {
          const animationHandler = sceneImporter.getAnimationHandler();
          animationHandler.addRenderer(viewProxy.getRenderer());
          global.animationHandler = animationHandler;
          const animationProxy = proxyManager.createProxy(
            'Animations',
            'TimeStepAnimation'
          );
          animationProxy.setInputAnimationHandler(animationHandler);
          animationManager.addAnimation(animationProxy);
          global.animationManager = animationManager;
        }
        initializePanel(animationManager, viewProxy);
        viewProxy.getCamera().set(sceneImporter.getMetadata().camera);
        viewProxy.renderLater();
      });
    },
  });
});

global.viewProxy = viewProxy;
global.ProxyManager = proxyManager;
global.container = container;
