import vtkCameraSynchronizer from './CameraSynchronizer';

const BEHAVIORS = {};

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

  // Process remaining behaviors...
  // TODO - widgets(orientation, ...)
}

export default { applyBehaviors };
