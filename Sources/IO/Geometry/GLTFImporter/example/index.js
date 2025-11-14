/* eslint-disable no-unused-expressions */
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

// Enable data soure for DataAccessHelper
import '@kitware/vtk.js/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper'; // Just need HTTP
// import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper'; // HTTP + zip
// import '@kitware/vtk.js/IO/Core/DataAccessHelper/HtmlDataAccessHelper'; // html + base64 + zip
// import '@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper'; // zip

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkTexture from '@kitware/vtk.js/Rendering/Core/Texture';
import vtkURLExtract from '@kitware/vtk.js/Common/Core/URLExtract';
import vtkResourceLoader from '@kitware/vtk.js/IO/Core/ResourceLoader';

import vtkGLTFImporter from '@kitware/vtk.js/IO/Geometry/GLTFImporter';
import GUI from 'lil-gui';

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
let mixer;
let selectedModel;
let selectedFlavor;
const userParms = vtkURLExtract.extractURLParameters();
const selectedScene = userParms.scene || 0;
const viewAPI = userParms.viewAPI || 'WebGL';

const baseUrl =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main';
const modelsFolder = 'Models';
const modelsDictionary = {};

function createTextureWithMipmap(src, level) {
  const tex = vtkTexture.newInstance();
  tex.setMipLevel(level);

  fetch(src)
    .then((response) => response.blob())
    .then((blob) => createImageBitmap(blob))
    .then((imageBitmap) => {
      tex.setInterpolate(true);
      tex.setEdgeClamp(true);
      tex.setImageBitmap(imageBitmap);
    });

  return tex;
}

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();

const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// Workaround for the variant switch
const modelsWithEnvironmentTex = ['DamagedHelmet', 'FlightHelmet'];

const environmentTex = createTextureWithMipmap(
  `${__BASE_PATH__}/data/pbr/kiara_dawn_4k.jpg`,
  8
);
renderer.setUseEnvironmentTextureAsBackground(false);

if (!modelsWithEnvironmentTex.includes(userParms.model)) {
  renderer.setEnvironmentTexture(environmentTex);
  renderer.setEnvironmentTextureDiffuseStrength(0);
  renderer.setEnvironmentTextureSpecularStrength(0.8);
} else {
  renderer.setEnvironmentTexture(environmentTex);
  renderer.setEnvironmentTextureDiffuseStrength(1);
  renderer.setEnvironmentTextureSpecularStrength(1);
}

const reader = vtkGLTFImporter.newInstance({
  renderer,
});

const rootContainer = document.querySelector('body');
const gui = new GUI();
const params = {
  viewAPI,
  Model: '',
  Flavor: '',
  Scene: selectedScene,
  Camera: '',
  Animation: '',
  Variant: 0,
  UseBackground: false,
  Specular: renderer.getEnvironmentTextureSpecularStrength?.() ?? 1.0,
  Diffuse: renderer.getEnvironmentTextureDiffuseStrength?.() ?? 1.0,
  FOV: renderer.getActiveCamera().getViewAngle(),
};
const controllers = {};

// add a loading svg to the container and remove once the reader is ready
const loading = document.createElement('div');
loading.innerHTML = `
  <style>
    .loader-svg{
      position: absolute;
      left: 0; right: 0; top: 0; bottom: 0;
      fill: none;
      stroke-width: 5px;
      stroke-linecap: round;
      stroke: #bbb;
    }

    .loader-svg.bg{
      stroke-width: 4px;
      stroke: #333;
    }

    .animate{
      stroke-dasharray: 242.6;
      animation: fill-animation 1s cubic-bezier(1,1,1,1) 0s infinite;
    }

    @keyframes fill-animation{
      0%{
        stroke-dasharray: 40 242.6;
        stroke-dashoffset: 0;
      }
      50%{
        stroke-dasharray: 141.3;
        stroke-dashoffset: 141.3;
      }
      100%{
        stroke-dasharray: 40 242.6;
        stroke-dashoffset: 282.6;
      }
    }
  </style>
  <svg class="svg-container" height="100" width="100" viewBox="0 0 100 100">
    <circle class="loader-svg bg" cx="50" cy="50" r="45"></circle>
    <circle class="loader-svg animate" cx="50" cy="50" r="45"></circle>
  </svg>
`;
// loading message should center in the window
loading.style.position = 'absolute';
loading.style.left = '50%';
loading.style.top = '50%';
loading.style.transform = 'translate(-50%, -50%)';

// ----------------------------------------------------------------------------
function animateScene(lastTime = 0) {
  const currentTime = performance.now();
  const dt = (currentTime - lastTime) / 1000;

  mixer.update(dt);

  renderWindow.render();
  requestAnimationFrame(() => animateScene(currentTime));
}

function ready() {
  console.log('Ready');
  // remove loading message
  loading.remove();

  reader.importActors();
  reader.importCameras();
  reader.importLights();
  reader.importAnimations();

  renderer.resetCamera();
  renderWindow.render();

  // Play animations and expose GUI selectors
  const animations = reader.getAnimations();
  if (animations.length > 0) {
    mixer = reader.getAnimationMixer();
    const names = animations.map((a) => a.id);
    params.Animation = names[0];
    controllers.Animation && gui.remove(controllers.Animation);
    controllers.Animation = gui
      .add(params, 'Animation', names)
      .name('Animation')
      .onChange((id) => {
        mixer.play(id);
        animateScene();
      });
    mixer.play(names[0]);
    animateScene();
  }

  const cameras = reader.getCameras();
  if (cameras.length) {
    params.Camera = cameras[0];
    controllers.Camera && gui.remove(controllers.Camera);
    controllers.Camera = gui
      .add(params, 'Camera', cameras)
      .name('Camera')
      .onChange((name) => {
        reader.setCamera(name);
        renderWindow.render();
      });
  }

  const scenes = reader.getScenes();
  if (scenes.length > 1) {
    controllers.Scene && gui.remove(controllers.Scene);
    controllers.Scene = gui
      .add(params, 'Scene', [...Array(scenes.length).keys()])
      .name('Scene')
      .onChange((idx) => {
        window.location = `?model=${selectedModel}&flavor=${selectedFlavor}&scene=${idx}&viewAPI=${params.viewAPI}`;
      });
  }

  const variants = reader.getVariants();
  if (variants.length > 1) {
    controllers.Variant && gui.remove(controllers.Variant);
    controllers.Variant = gui
      .add(params, 'Variant', [...Array(variants.length).keys()])
      .name('Variant')
      .onChange(async (i) => {
        await reader.switchToVariant(Number(i));
        renderWindow.render();
      });
  }
}

// Convert the await fetch to a promise chain
fetch(`${baseUrl}/${modelsFolder}/model-index.json`)
  .then((response) => response.json())
  .then((modelsJson) => {
    modelsJson.forEach((entry) => {
      if (entry.variants !== undefined && entry.name !== undefined) {
        const variants = [];

        Object.keys(entry.variants).forEach((variant) => {
          const fileName = entry.variants[variant];
          variants[
            variant
          ] = `${modelsFolder}/${entry.name}/${variant}/${fileName}`;
        });

        modelsDictionary[entry.name] = variants;
      }
    });

    const modelsNames = Object.keys(modelsDictionary);
    const dhModelIdx = modelsNames.indexOf('DamagedHelmet');
    selectedModel = userParms.model || modelsNames[dhModelIdx];
    params.Model = selectedModel;
    controllers.Model && gui.remove(controllers.Model);
    controllers.Model = gui
      .add(params, 'Model', modelsNames)
      .name('Model')
      .onChange((modelName) => {
        window.location = `?model=${modelName}&viewAPI=${params.viewAPI}`;
      });

    const variants = Object.keys(modelsDictionary[selectedModel]).sort();

    selectedFlavor = userParms.flavor || variants[0];
    params.Flavor = selectedFlavor;
    controllers.Flavor && gui.remove(controllers.Flavor);
    controllers.Flavor = gui
      .add(params, 'Flavor', variants)
      .name('Flavor')
      .onChange((variant) => {
        window.location = `?model=${selectedModel}&flavor=${variant}&scene=${selectedScene}&viewAPI=${params.viewAPI}`;
      });

    const path = modelsDictionary[selectedModel][selectedFlavor];
    const url = `${baseUrl}/${path}`;

    if (
      selectedFlavor === 'glTF-Draco' ||
      selectedFlavor === 'glTF-Binary-KTX-ETC1S-Draco'
    ) {
      vtkResourceLoader
        .loadScript(
          'https://unpkg.com/draco3dgltf@1.5.7/draco_decoder_gltf_nodejs.js'
        )
        .then(async () => {
          // Set decoder function to the vtk reader
          // eslint-disable-next-line no-undef
          await reader.setDracoDecoder(DracoDecoderModule);
          reader
            .setUrl(url, { binary: true, sceneId: selectedScene })
            .then(reader.onReady(ready));
        });
    } else {
      reader
        .setUrl(url, { binary: true, sceneId: selectedScene })
        .then(reader.onReady(ready));
    }
  })
  .catch((error) => {
    console.error('Error fetching the model index:', error);
  });

// ----------------------------------------------------------------------------
// Use a file reader to load a local file
// ----------------------------------------------------------------------------

// View API dropdown
gui
  .add(params, 'viewAPI', ['WebGL', 'WebGPU'])
  .name('Renderer')
  .onChange((api) => {
    window.location = `?model=${selectedModel || ''}&viewAPI=${api}`;
  });

// Environment controls
gui
  .add(params, 'UseBackground')
  .name('Use Textured Background')
  .onChange((v) => {
    renderer.setUseEnvironmentTextureAsBackground(Boolean(v));
    renderWindow.render();
  });
gui
  .add(params, 'Specular', 0.0, 2.0, 0.01)
  .name('Specular Strength')
  .onChange((v) => {
    renderer.setEnvironmentTextureSpecularStrength(Number(v));
    renderWindow.render();
  });
gui
  .add(params, 'Diffuse', 0.0, 2.0, 0.01)
  .name('Diffuse Strength')
  .onChange((v) => {
    renderer.setEnvironmentTextureDiffuseStrength(Number(v));
    renderWindow.render();
  });
gui
  .add(params, 'FOV', 30, 120, 1)
  .name('FOV')
  .onChange((v) => {
    renderer.getActiveCamera().setViewAngle(Number(v));
    renderWindow.render();
  });

rootContainer.appendChild(loading);
