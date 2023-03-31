import vtkCameraSynchronizer from './CameraSynchronizer';

const BEHAVIORS = {};

class CameraSync {
  constructor(ctx, config) {
    this.ctx = ctx;
    this.behavior = vtkCameraSynchronizer.newInstance(
      this.getProperties(config)
    );
    this.behavior.update();
  }

  getProperties({ actorBounds, srcRenderer, dstRenderer }) {
    const distance =
      3.4 *
      Math.max(
        actorBounds[1] - actorBounds[0],
        actorBounds[3] - actorBounds[2],
        actorBounds[5] - actorBounds[4]
      );
    const focalPoint = [
      0.5 * (actorBounds[0] + actorBounds[1]),
      0.5 * (actorBounds[2] + actorBounds[3]),
      0.5 * (actorBounds[4] + actorBounds[5]),
    ];
    const mode = vtkCameraSynchronizer.SynchronizationMode.MODE_ORIENTATION;
    return {
      distance,
      focalPoint,
      mode,
      srcRenderer: this.ctx.getInstance(srcRenderer),
      dstRenderer: this.ctx.getInstance(dstRenderer),
    };
  }

  update(config) {
    this.behavior.set(this.getProperties(config));
    this.behavior.update();
  }

  delete() {
    this.behavior.delete();
  }
}

const BEHAVIORS_TYPES = {
  CameraSync,
};

export function applyBehaviors(renderWindow, state, context) {
  if (!state.behaviors || !renderWindow.getSynchronizedViewId) {
    return;
  }
  // Apply auto behavior
  const rwId = renderWindow.getSynchronizedViewId();
  if (!BEHAVIORS[rwId]) {
    BEHAVIORS[rwId] = {};
  }
  const localBehaviors = BEHAVIORS[rwId];

  if (state.behaviors.autoOrientation) {
    const renderers = renderWindow.getRenderers();
    if (!localBehaviors.autoOrientationAxes && renderers.length === 2) {
      let srcRenderer = null;
      let dstRenderer = null;
      for (let i = 0; i < renderers.length; i++) {
        const renderer = renderers[i];
        if (renderer.getInteractive()) {
          srcRenderer = renderer;
        } else {
          dstRenderer = renderer;
        }
      }
      if (srcRenderer && dstRenderer) {
        localBehaviors.autoOrientationAxes = vtkCameraSynchronizer.newInstance({
          srcRenderer,
          dstRenderer,
        });
      }
    }
    if (localBehaviors.autoOrientationAxes && renderers.length !== 2) {
      localBehaviors.autoOrientationAxes.delete();
      delete localBehaviors.autoOrientationAxes;
    }
  }

  const currentSets = Object.keys(state.behaviors);
  const existingSets = Object.keys(localBehaviors);
  for (let i = 0; i < currentSets.length; i++) {
    const key = currentSets[i];
    if (!localBehaviors[key]) {
      const config = state.behaviors[key];
      if (BEHAVIORS_TYPES[config.type]) {
        localBehaviors[key] = new BEHAVIORS_TYPES[config.type](context, config);
      } else {
        console.log('No mapping for', config);
      }
    } else {
      localBehaviors[key].update(state.behaviors[key]);
    }
  }
  for (let i = 0; i < existingSets.length; i++) {
    const key = currentSets[i];
    if (!state.behaviors[key]) {
      // Need to delete previously created behavior
      localBehaviors[key].delete();
      delete localBehaviors[key];
    }
  }
}

export default { applyBehaviors };
