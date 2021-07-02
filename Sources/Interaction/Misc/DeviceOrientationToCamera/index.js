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

function isEventValid(evt) {
  return Number.isFinite(evt.alpha);
}

function onDeviceOrientationChangeEvent(evt) {
  orientation.device = evt;
  if (!Number.isFinite(evt.alpha)) {
    orientation.supported = false;
  }
}

function onScreenOrientationChangeEvent() {
  orientation.screen =
    SCREEN_ORIENTATION_MAP[
      window.screen.orientation || window.screen.mozOrientation
    ] ||
    window.orientation ||
    0;
}

function addWindowListeners() {
  window.addEventListener(
    'orientationchange',
    onScreenOrientationChangeEvent,
    false
  );
  window.addEventListener(
    'deviceorientation',
    onDeviceOrientationChangeEvent,
    false
  );
  orientation.update = true;
  listeners
    .filter((i) => !!i)
    .forEach((i) => i.renderWindowInteractor.requestAnimation(i));
}

function removeWindowListeners() {
  window.removeEventListener(
    'orientationchange',
    onScreenOrientationChangeEvent,
    false
  );
  window.removeEventListener(
    'deviceorientation',
    onDeviceOrientationChangeEvent,
    false
  );
  orientation.update = false;
  listeners
    .filter((i) => !!i)
    .forEach((i) => i.renderWindowInteractor.cancelAnimation(i));
}

function addCameraToSynchronize(
  renderWindowInteractor,
  camera,
  onCameraUpdate
) {
  function onAnimation() {
    if (orientation.update && isEventValid(orientation.device)) {
      const { alpha, beta, gamma } = orientation.device;
      const { screen } = orientation;
      camera.setDeviceAngles(alpha, beta, gamma, screen);
      if (onCameraUpdate) {
        onCameraUpdate();
      }
    }
  }

  const subscription = renderWindowInteractor.onAnimation(onAnimation);
  const listener = { subscription, renderWindowInteractor };
  const listenerId = listeners.length;
  listeners.push(listener);

  if (orientation.update) {
    listener.renderWindowInteractor.requestAnimation(listener);
  }

  return listenerId;
}

function removeCameraToSynchronize(id, cancelAnimation = true) {
  const listener = listeners[id];
  if (listener) {
    listener.subscription.unsubscribe();
    if (cancelAnimation) {
      listener.renderWindowInteractor.cancelAnimation(listener);
    }
  }
  listeners[id] = null;
}

function isDeviceOrientationSupported() {
  return orientation.supported;
}

export default {
  addCameraToSynchronize,
  addWindowListeners,
  isDeviceOrientationSupported,
  removeCameraToSynchronize,
  removeWindowListeners,
};
