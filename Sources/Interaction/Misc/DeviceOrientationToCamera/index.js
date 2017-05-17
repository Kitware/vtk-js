const listeners = [];
const orientation = {
  device: {},
  screen: window.orientation || 0,
  supported: !!window.DeviceMotionEvent,
  update: false,
};

const SCREEN_ORIENTATION_MAP = {
  'landscape-primary': 90,
  'landscape-secondary': -90,
  'portrait-secondary': 180,
  'portrait-primary': 0,
};

function noOp() {}

function updateListeners() {
  if (orientation.update && orientation.supported) {
    requestAnimationFrame(updateListeners);
  }

  const { alpha, beta, gamma } = orientation.device;
  const screen = orientation.screen;

  listeners.forEach((listener) => {
    if (listener) {
      const { camera, render } = listener;
      camera.setViewAngle(80.0);
      camera.setDeviceAngles(alpha, beta, gamma, screen);
      render();
    }
  });
}

function onDeviceOrientationChangeEvent(evt) {
  orientation.device = evt;
  if (!Number.isFinite(evt.alpha)) {
    orientation.supported = false;
  }
}

function onScreenOrientationChangeEvent() {
  orientation.screen = SCREEN_ORIENTATION_MAP[window.screen.orientation || window.screen.mozOrientation] || window.orientation || 0;
}

function addWindowListeners() {
  window.addEventListener('orientationchange', onScreenOrientationChangeEvent, false);
  window.addEventListener('deviceorientation', onDeviceOrientationChangeEvent, false);
  orientation.update = true;
  updateListeners();
}

function removeWindowListeners() {
  window.removeEventListener('orientationchange', onScreenOrientationChangeEvent, false);
  window.removeEventListener('deviceorientation', onDeviceOrientationChangeEvent, false);
  orientation.update = false;
}

function addCameraToSynchronize(camera, render = noOp) {
  const id = listeners.length;
  listeners.push({ id, camera, render });
  return id;
}

function removeCameraToSynchronize(id) {
  listeners[id] = null;
}

function isDeviceOrientationSupported() {
  return orientation.supported;
}

export default {
  addWindowListeners,
  removeWindowListeners,
  addCameraToSynchronize,
  removeCameraToSynchronize,
  isDeviceOrientationSupported,
};
