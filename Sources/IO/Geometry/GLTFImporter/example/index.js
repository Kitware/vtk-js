/* eslint-disable no-unused-expressions */
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

// Enable data soure for DataAccessHelper
import '@kitware/vtk.js/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper'; // Just need HTTP
// import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper'; // HTTP + zip
// import '@kitware/vtk.js/IO/Core/DataAccessHelper/HtmlDataAccessHelper'; // html + base64 + zip
// import '@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper'; // zip

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer';
import vtkTexture from '@kitware/vtk.js/Rendering/Core/Texture';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkURLExtract from '@kitware/vtk.js/Common/Core/URLExtract';
import vtkResourceLoader from '@kitware/vtk.js/IO/Core/ResourceLoader';

import vtkGLTFImporter from '@kitware/vtk.js/IO/Geometry/GLTFImporter';
import vtkAnimationMixer from '@kitware/vtk.js/Common/Core/AnimationMixer';
import vtkArmatureSource from '@kitware/vtk.js/Filters/Sources/ArmatureSource';
import GUI from 'lil-gui';

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
let mixer;
let selectedModel;
let selectedFlavor;
let armatureSource = null;
let armatureActor = null;
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
const armatureRenderer = vtkRenderer.newInstance();
renderWindow.setNumberOfLayers(2);
renderer.setLayer(0);
armatureRenderer.setLayer(1);
armatureRenderer.setPreserveColorBuffer(true);
armatureRenderer.setPreserveDepthBuffer(false);
armatureRenderer.setInteractive(false);
armatureRenderer.setActiveCamera(renderer.getActiveCamera());
renderWindow.addRenderer(armatureRenderer);

const environmentTex = createTextureWithMipmap(
  `${__BASE_PATH__}/data/pbr/kiara_dawn_4k.jpg`,
  8
);
// Enable environment texture as background and for IBL reflections
renderer.setUseEnvironmentTextureAsBackground(true);
renderer.setEnvironmentTexture(environmentTex);
renderer.setEnvironmentTextureDiffuseStrength(1);
renderer.setEnvironmentTextureSpecularStrength(1);

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
  Playing: true,
  Variant: 0,
  ShowModel: true,
  ShowArmature: true,
  UseBackground: true,
  Specular: renderer.getEnvironmentTextureSpecularStrength?.() ?? 1.0,
  Diffuse: renderer.getEnvironmentTextureDiffuseStrength?.() ?? 1.0,
  FOV: renderer.getActiveCamera().getViewAngle(),
};
const controllers = {};

function setModelVisibility(visible) {
  reader.getActors()?.forEach((actor) => actor.setVisibility(Boolean(visible)));
  renderWindow.render();
}

function setArmatureVisibility(visible) {
  armatureActor?.setVisibility(Boolean(visible));
  renderWindow.render();
}

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
let animationFrameId = null;

function animateScene() {
  let lastTime = performance.now();

  function tick() {
    const currentTime = performance.now();
    const dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    if (mixer && mixer.tick) {
      mixer.tick(dt);
      if (armatureSource) {
        armatureSource.modified();
      }
    }

    renderWindow.render();
    animationFrameId = requestAnimationFrame(tick);
  }

  // Cancel any existing loop to avoid duplicates
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  animationFrameId = requestAnimationFrame(tick);
}

function stopAnimation() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

function ready() {
  console.log('Ready');
  // remove loading message
  loading.remove();

  reader.importActors();
  reader.importCameras();
  reader.importLights();
  setModelVisibility(params.ShowModel);

  // Create animation mixer (handles skeletal, node-transform, and morph animations)
  mixer = vtkAnimationMixer.newInstance();

  // Provide scene graph data to mixer for node/morph/pointer animations
  mixer.setScene({
    actors: reader.getActors(),
    nodeTransforms: reader.getNodeTransforms(),
    nodeChildren: reader.getNodeChildren(),
    morphTargets: reader.getMorphTargets(),
    materialProperties: reader.getMaterialProperties(),
    nodeLights: reader.getNodeLights(),
  });

  // Skeletal animation setup
  const skeletons = reader.getSkeletons();
  const animationClips = reader.getAnimationClips();

  if (skeletons.length > 0) {
    // Build skin index → skeleton lookup
    const skinIndexToSkeleton = new Map();
    skeletons.forEach((entry) => {
      skinIndexToSkeleton.set(entry.gltfSkinIndex, entry.skeleton);
    });

    // Use the first skeleton as the default for animation playback
    const primarySkeleton = skeletons[0].skeleton;
    mixer.setSkeleton(primarySkeleton);

    armatureSource = vtkArmatureSource.newInstance({
      skeleton: primarySkeleton,
    });
    const armatureMapper = vtkMapper.newInstance();
    armatureMapper.setInputConnection(armatureSource.getOutputPort());
    armatureActor = vtkActor.newInstance();
    armatureActor.setMapper(armatureMapper);
    armatureActor.getProperty().setColor(1.0, 1.0, 1.0);
    armatureActor.getProperty().setPointSize(8);
    armatureActor.getProperty().setLineWidth(3);
    armatureActor.setVisibility(params.ShowArmature);
    armatureRenderer.addActor(armatureActor);

    // Register per skeleton animation clips so each skeleton
    // can be evaluated with tracks mapped to its own bone indices
    skeletons.forEach((entry) => {
      if (entry.clips && entry.clips.length > 0) {
        mixer.setSkeletonClips(entry.skeleton, entry.clips);
      }
      // Register parent child skeleton relationships for root transform updates
      if (entry.parentSkeletonIdx !== undefined) {
        const parentEntry = skeletons[entry.parentSkeletonIdx];
        mixer.setSkeletonParent(
          entry.skeleton,
          parentEntry.skeleton,
          entry.parentBoneIdx
        );
      }
    });

    // Bind each actor to its specific skeleton based on glTF skin mapping
    const actorMap = reader.getActors();
    const skinsMap = reader.getSkins();
    if (actorMap) {
      actorMap.forEach((actor, actorKey) => {
        // Actor keys are either "node-X" (node actor) or "node-X_primitive-Y"
        const nodeId = actorKey.split('_')[0];
        const skinInfo = skinsMap ? skinsMap.get(nodeId) : null;
        if (skinInfo) {
          // Extract the numeric skin index from skinId (e.g., "skin-0" → 0)
          const match = skinInfo.skinId.match(/(\d+)/);
          const skinIdx = match ? parseInt(match[1], 10) : -1;
          const actorSkeleton = skinIndexToSkeleton.get(skinIdx);
          mixer.bindActor(actor, actorSkeleton || primarySkeleton);
        }
      });
    }

    // Push rest pose skinning data even if no animation clips
    mixer.tick(0);

    if (animationClips.length > 0) {
      animationClips.forEach((clip) => mixer.addClip(clip));

      const clipNames = mixer.getClipNames();
      if (clipNames.length > 0) {
        params.Animation = clipNames[0];
        controllers.Animation && controllers.Animation.destroy();
        controllers.Animation = gui
          .add(params, 'Animation', clipNames)
          .name('Animation')
          .onChange((name) => {
            mixer.stop();
            mixer.playClip(name);
            animateScene();
          });
        mixer.playClip(clipNames[0]);
        mixer.tick(0);
      }
    }
  }

  // Node transform + morph target animations
  const nodeAnims = reader.getNodeAnimations();
  if (nodeAnims.length > 0) {
    mixer.setNodeAnimations(nodeAnims);

    if (!params.Animation) {
      const animNames = nodeAnims.map((a) => a.name);
      params.Animation = animNames[0];
      controllers.Animation && controllers.Animation.destroy();
      controllers.Animation = gui
        .add(params, 'Animation', animNames)
        .name('Animation')
        .onChange((name) => {
          mixer.playNodeAnimation(name);
          animateScene();
        });
    }
  }

  // KHR_animation_pointer animations (texture transform animations)
  const pointerAnims = reader.getPointerAnimations();
  if (pointerAnims.length > 0) {
    mixer.setPointerAnimations(pointerAnims);

    if (!params.Animation) {
      const animNames = pointerAnims.map((a) => a.name);
      params.Animation = animNames[0];
      controllers.Animation && controllers.Animation.destroy();
      controllers.Animation = gui
        .add(params, 'Animation', animNames)
        .name('Animation')
        .onChange((name) => {
          mixer.playPointerAnimation(name);
          animateScene();
        });
    }
  }

  requestAnimationFrame(() => {
    const bounds = reader.getSceneBounds(params.Scene);
    if (bounds) {
      renderer.resetCamera(bounds);
      renderer.resetCameraClippingRange(bounds);
    } else {
      renderer.resetCamera();
    }
    renderWindow.render();
  });

  const cameras = reader.getCameras();
  if (cameras.length) {
    params.Camera = cameras[0];
    controllers.Camera && controllers.Camera.destroy();
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
    controllers.Scene && controllers.Scene.destroy();
    controllers.Scene = gui
      .add(params, 'Scene', [...Array(scenes.length).keys()])
      .name('Scene')
      .onChange((idx) => {
        window.location = `?model=${selectedModel}&flavor=${selectedFlavor}&scene=${idx}&viewAPI=${params.viewAPI}`;
      });
  }

  const variants = reader.getVariants();
  if (variants.length > 1) {
    const variantOptions = {};
    variants.forEach((name, index) => {
      const label = name || `Variant ${index}`;
      variantOptions[label] = index;
    });
    params.Variant = 0;
    controllers.Variant && controllers.Variant.destroy();
    controllers.Variant = gui
      .add(params, 'Variant', variantOptions)
      .name('Variant')
      .onChange(async (i) => {
        await reader.switchToVariant(Number(i));
        renderWindow.render();
      });
  }

  // Start animation loop
  if (mixer.hasAnimations()) {
    animateScene();

    params.Playing = true;
    controllers.Playing && controllers.Playing.destroy();
    controllers.Playing = gui
      .add(params, 'Playing')
      .name('Play')
      .onChange((playing) => {
        if (playing) {
          animateScene();
        } else {
          stopAnimation();
        }
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
          variants[variant] =
            `${modelsFolder}/${entry.name}/${variant}/${fileName}`;
        });

        modelsDictionary[entry.name] = variants;
      }
    });

    const modelsNames = Object.keys(modelsDictionary);
    const dhModelIdx = modelsNames.indexOf('DamagedHelmet');
    selectedModel = userParms.model || modelsNames[dhModelIdx];
    params.Model = selectedModel;
    controllers.Model && controllers.Model.destroy();
    controllers.Model = gui
      .add(params, 'Model', modelsNames)
      .name('Model')
      .onChange((modelName) => {
        window.location = `?model=${modelName}&viewAPI=${params.viewAPI}`;
      });

    const variants = Object.keys(modelsDictionary[selectedModel]).sort();

    selectedFlavor = userParms.flavor || variants[0];
    params.Flavor = selectedFlavor;
    controllers.Flavor && controllers.Flavor.destroy();
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

gui.add(params, 'ShowModel').name('Show Model').onChange(setModelVisibility);
gui
  .add(params, 'ShowArmature')
  .name('Show Armature')
  .onChange(setArmatureVisibility);

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
