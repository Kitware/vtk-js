import 'vtk.js/Sources/favicon';

import HttpDataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import macro from 'vtk.js/Sources/macro';
import vtkDeviceOrientationToCamera from 'vtk.js/Sources/Interaction/Misc/DeviceOrientationToCamera';
import vtkForwardPass from 'vtk.js/Sources/Rendering/OpenGL/ForwardPass';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkRadialDistortionPass from 'vtk.js/Sources/Rendering/OpenGL/RadialDistortionPass';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkSkybox from 'vtk.js/Sources/Rendering/Core/Skybox';
import vtkSkyboxReader from 'vtk.js/Sources/IO/Misc/SkyboxReader';
import vtkURLExtract from 'vtk.js/Sources/Common/Core/URLExtract';
// import vtkMobileVR from 'vtk.js/Sources/Common/System/MobileVR';

import style from './SkyboxViewer.module.css';

// ----------------------------------------------
// Possible URL parameters to look for:
//   - fileURL
//   - position
//   - direction
//   - up
//   - vr
//   - eye
//   - viewAngle
//   - debug
//   - autoIncrement
//   - k1
//   - k2
//   - centerY
// ----------------------------------------------
const userParams = vtkURLExtract.extractURLParameters();
let autoInit = true;
const cameraFocalPoint = userParams.direction || [0, 0, -1];
const cameraViewUp = userParams.up || [0, 1, 0];
const cameraViewAngle = userParams.viewAngle || 100;
const enableVR = !!userParams.vr;
const eyeSpacing = userParams.eye || 0.0;
const grid = userParams.debug || false;
const autoIncrementTimer = userParams.timer || 0;
const disableTouchNext = userParams.disableTouch || false;
const distk1 = userParams.k1 || 0.2;
const distk2 = userParams.k2 || 0.0;
const cameraCenterY = userParams.centerY || 0.0;

const body = document.querySelector('body');
let fullScreenMetod = null;

['requestFullscreen', 'msRequestFullscreen', 'webkitRequestFullscreen'].forEach(
  (m) => {
    if (body[m] && !fullScreenMetod) {
      fullScreenMetod = m;
    }
  }
);

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function createController(options) {
  if (options.length === 1) {
    return null;
  }
  const buffer = ['<select class="position">'];
  buffer.push(options.join(''));
  buffer.push('</select>');

  return buffer.join('');
}

function drawLine(ctx, x, y, text, delta = 10) {
  ctx.beginPath();
  ctx.moveTo(x, y - delta);
  ctx.lineTo(x, y + delta);
  ctx.stroke();
  ctx.fillText(text, x, y + delta + 10);
}

function createGrid(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = '100%';
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = '#FFFFFF';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';

  const totalWidth = width;
  const eyeCenter = width / 4;
  const y = window.screen.height / 2;
  ctx.clearRect(0, 0, width, height);

  const nbTicks = 20;
  for (let i = 0; i <= nbTicks; i++) {
    const value = (i - nbTicks / 2) / (nbTicks / 2);
    drawLine(
      ctx,
      eyeCenter + eyeCenter * (eyeSpacing + value),
      y,
      `${value}`,
      value ? 20 : 100
    );
    drawLine(
      ctx,
      totalWidth - (eyeCenter + eyeCenter * (eyeSpacing + value)),
      y,
      `${value}`,
      value ? 20 : 100
    );
  }

  ctx.fillText(
    `Current Offset ${eyeSpacing}`,
    eyeCenter + eyeCenter * eyeSpacing,
    y - 120
  );
  ctx.fillText(
    `Current Offset ${eyeSpacing}`,
    totalWidth - (eyeCenter + eyeCenter * eyeSpacing),
    y - 120
  );

  canvas.style.zIndex = 1000;
  canvas.style.position = 'fixed';
  canvas.style.top = 0;
  canvas.style.left = 0;
  body.appendChild(canvas);
}

function createVisualization(container, mapReader) {
  // Empty container
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
    rootContainer: container,
    containerStyle: { height: '100%', width: '100%', position: 'absolute' },
  });
  const renderWindow = fullScreenRenderer.getRenderWindow();
  const mainRenderer = fullScreenRenderer.getRenderer();
  const interactor = fullScreenRenderer.getInteractor();
  const actor = vtkSkybox.newInstance();
  let camera = mainRenderer.getActiveCamera();
  let leftRenderer = null;
  let rightRenderer = null;
  let updateCameraCallBack = mainRenderer.resetCameraClippingRange;

  // Connect viz pipeline
  actor.addTexture(mapReader.getOutputData());

  // Update Camera configuration
  const cameraConfiguration = {
    focalPoint: cameraFocalPoint,
    position: [0, 0, 0],
    viewAngle: cameraViewAngle,
    physicalViewNorth: cameraFocalPoint,
    viewUp: cameraViewUp,
    physicalViewUp: cameraViewUp,
  };

  function updateSkybox(position) {
    const selector = document.querySelector('.position');
    if (selector && selector.value !== position) {
      selector.value = position;
    }
    actor.removeAllTextures();
    mapReader.setPosition(`${position}`);
    mapReader.update();
    actor.addTexture(mapReader.getOutputData());
    renderWindow.render();
  }

  function nextPosition() {
    const currentPosition = mapReader.getPosition();
    const allPositions = mapReader.getPositions();
    const nextIdx =
      (allPositions.indexOf(currentPosition) + 1) % allPositions.length;
    updateSkybox(allPositions[nextIdx]);
  }

  if (enableVR && vtkDeviceOrientationToCamera.isDeviceOrientationSupported()) {
    // vtkMobileVR.getVRHeadset().then((headset) => {
    //   console.log('got headset');
    //   console.log(headset);
    //   console.log(vtkMobileVR.hardware);
    // });

    leftRenderer = vtkRenderer.newInstance();
    rightRenderer = vtkRenderer.newInstance();

    // Configure left/right renderers
    leftRenderer.setViewport(0, 0, 0.5, 1);
    leftRenderer.addActor(actor);
    const leftCamera = leftRenderer.getActiveCamera();
    leftCamera.set(cameraConfiguration);
    leftCamera.setWindowCenter(-eyeSpacing, -cameraCenterY);

    rightRenderer.setViewport(0.5, 0, 1, 1);
    rightRenderer.addActor(actor);
    const rightCamera = rightRenderer.getActiveCamera();
    rightCamera.set(cameraConfiguration);
    rightCamera.setWindowCenter(eyeSpacing, -cameraCenterY);

    // Provide custom update callback + fake camera
    updateCameraCallBack = () => {
      leftRenderer.resetCameraClippingRange();
      rightRenderer.resetCameraClippingRange();
    };
    camera = {
      setDeviceAngles(alpha, beta, gamma, screen) {
        leftCamera.setDeviceAngles(alpha, beta, gamma, screen);
        rightCamera.setDeviceAngles(alpha, beta, gamma, screen);
      },
    };

    // Reconfigure render window
    renderWindow.addRenderer(leftRenderer);
    renderWindow.addRenderer(rightRenderer);
    renderWindow.removeRenderer(mainRenderer);

    const distPass = vtkRadialDistortionPass.newInstance();
    distPass.setK1(distk1);
    distPass.setK2(distk2);
    distPass.setCameraCenterY(cameraCenterY);
    distPass.setCameraCenterX1(-eyeSpacing);
    distPass.setCameraCenterX2(eyeSpacing);
    distPass.setDelegates([vtkForwardPass.newInstance()]);
    fullScreenRenderer.getOpenGLRenderWindow().setRenderPasses([distPass]);

    // Hide any controller
    fullScreenRenderer.setControllerVisibility(false);

    // Remove window interactions
    interactor.unbindEvents();

    // Attach touch control
    if (!disableTouchNext) {
      fullScreenRenderer
        .getRootContainer()
        .addEventListener('touchstart', nextPosition, true);
      if (fullScreenMetod) {
        fullScreenRenderer.getRootContainer().addEventListener(
          'touchend',
          (e) => {
            body[fullScreenMetod]();
          },
          true
        );
      }
    }

    // Warning if browser does not support fullscreen
    /* eslint-disable */
    if (navigator.userAgent.match('CriOS')) {
      alert(
        'Chrome on iOS does not support fullscreen. Please use Safari instead.'
      );
    }
    if (navigator.userAgent.match('FxiOS')) {
      alert(
        'Firefox on iOS does not support fullscreen. Please use Safari instead.'
      );
    }
    /* eslint-enable */
  } else {
    camera.set(cameraConfiguration);
    mainRenderer.addActor(actor);

    // add vr option button if supported
    fullScreenRenderer.getOpenGLRenderWindow().onHaveVRDisplay(() => {
      if (
        fullScreenRenderer.getOpenGLRenderWindow().getVrDisplay().capabilities
          .canPresent
      ) {
        const button = document.createElement('button');
        button.style.position = 'absolute';
        button.style.left = '10px';
        button.style.bottom = '10px';
        button.style.zIndex = 10000;
        button.textContent = 'Send To VR';
        document.querySelector('body').appendChild(button);
        button.addEventListener('click', () => {
          if (button.textContent === 'Send To VR') {
            fullScreenRenderer.getOpenGLRenderWindow().startVR();
            button.textContent = 'Return From VR';
          } else {
            fullScreenRenderer.getOpenGLRenderWindow().stopVR();
            button.textContent = 'Send To VR';
          }
        });
      }
    });
  }

  renderWindow.render();

  // handle auto incrmenting position
  if (autoIncrementTimer !== 0) {
    setInterval(nextPosition, autoIncrementTimer * 1000);
  }

  // Update camera control
  if (vtkDeviceOrientationToCamera.isDeviceOrientationSupported()) {
    vtkDeviceOrientationToCamera.addWindowListeners();
    const cameraListenerId = vtkDeviceOrientationToCamera.addCameraToSynchronize(
      interactor,
      camera,
      updateCameraCallBack
    );
    interactor.requestAnimation('deviceOrientation');
    // Test again after 100ms
    setTimeout(() => {
      if (!vtkDeviceOrientationToCamera.isDeviceOrientationSupported()) {
        vtkDeviceOrientationToCamera.removeCameraToSynchronize(
          cameraListenerId
        );
        vtkDeviceOrientationToCamera.removeWindowListeners();
        interactor.cancelAnimation('deviceOrientation');
      }
    }, 100);
  }

  // Add Control UI
  const controller = createController(
    mapReader.getPositions().map((t) => `<option value="${t}">${t}</option>`)
  );
  if (controller) {
    fullScreenRenderer.addController(controller);
    document.querySelector('.position').addEventListener('change', (e) => {
      updateSkybox(e.target.value);
    });
  }

  // Apply url args to viz
  if (userParams.position) {
    updateSkybox(userParams.position);
  }

  if (grid) {
    console.log(fullScreenRenderer.getOpenGLRenderWindow().getSize());
    createGrid(...fullScreenRenderer.getOpenGLRenderWindow().getSize());
  }
}

/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */

export function initLocalFileLoader(container) {
  autoInit = false;
  const exampleContainer = document.querySelector('.content');
  const rootBody = document.querySelector('body');
  const myContainer = container || exampleContainer || rootBody;

  if (myContainer !== container) {
    myContainer.classList.add(style.fullScreen);
    rootBody.style.margin = '0';
    rootBody.style.padding = '0';
  } else {
    rootBody.style.margin = '0';
    rootBody.style.padding = '0';
  }

  const fileContainer = document.createElement('div');
  fileContainer.innerHTML = `<div class="${
    style.bigFileDrop
  }"/><input type="file" accept=".skybox,.zip" style="display: none;"/>`;
  myContainer.appendChild(fileContainer);

  const fileInput = fileContainer.querySelector('input');

  function handleFile(e) {
    preventDefaults(e);
    const dataTransfer = e.dataTransfer;
    const files = e.target.files || dataTransfer.files;
    if (files.length === 1) {
      myContainer.removeChild(fileContainer);
      const reader = vtkSkyboxReader.newInstance();
      reader.parseAsArrayBuffer(files[0]);
      reader.getReadyPromise().then(() => {
        createVisualization(myContainer, reader);
      });
    }
  }

  fileInput.addEventListener('change', handleFile);
  fileContainer.addEventListener('drop', handleFile);
  fileContainer.addEventListener('click', (e) => fileInput.click());
  fileContainer.addEventListener('dragover', preventDefaults);
}

// Look for data to download
if (userParams.fileURL) {
  autoInit = false;
  const exampleContainer = document.querySelector('.content');
  const rootBody = document.querySelector('body');
  const myContainer = exampleContainer || rootBody;
  if (myContainer) {
    myContainer.classList.add(style.fullScreen);
    rootBody.style.margin = '0';
    rootBody.style.padding = '0';
  }

  const progressContainer = document.createElement('div');
  progressContainer.setAttribute('class', style.progress);
  myContainer.appendChild(progressContainer);

  const progressCallback = (progressEvent) => {
    if (progressEvent.lengthComputable) {
      const percent = Math.floor(
        (100 * progressEvent.loaded) / progressEvent.total
      );
      progressContainer.innerHTML = `Loading ${percent}%`;
    } else {
      progressContainer.innerHTML = macro.formatBytesToProperUnit(
        progressEvent.loaded
      );
    }
  };

  HttpDataAccessHelper.fetchBinary(userParams.fileURL, {
    progressCallback,
  }).then((arrayBuffer) => {
    const reader = vtkSkyboxReader.newInstance();
    reader.parseAsArrayBuffer(arrayBuffer);
    reader.getReadyPromise().then(() => {
      createVisualization(myContainer, reader);
    });
  });
}

// Auto setup if no method get called within 100ms
setTimeout(() => {
  if (autoInit) {
    initLocalFileLoader();
  }
}, 100);
