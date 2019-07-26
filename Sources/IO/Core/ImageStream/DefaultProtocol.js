export default function createMethods(session) {
  return {
    subscribeToImageStream: (callback) =>
      session.subscribe('viewport.image.push.subscription', callback),
    unsubscribeToImageStream: (subscription) =>
      session.unsubscribe(subscription),
    registerView: (viewId) =>
      session.call('viewport.image.push.observer.add', [viewId]),
    unregisterView: (viewId) =>
      session.call('viewport.image.push.observer.remove', [viewId]),
    enableView: (viewId, enabled) =>
      session.call('viewport.image.push.enabled', [viewId, enabled]),
    render: (options = { size: [400, 400], view: -1 }) =>
      session.call('viewport.image.push', [options]),
    invalidateCache: (viewId) =>
      session.call('viewport.image.push.invalidate.cache', [viewId]),
    setQuality: (viewId, quality, ratio = 1) =>
      session.call('viewport.image.push.quality', [viewId, quality, ratio]),
    setSize: (viewId, width = 400, height = 400) =>
      session.call('viewport.image.push.original.size', [
        viewId,
        width,
        height,
      ]),
    setServerAnimationFPS: (fps = 30) =>
      session.call('viewport.image.animation.fps.max', [fps]),
    getServerAnimationFPS: () =>
      session.call('viewport.image.animation.fps.get', []),
    startAnimation: (viewId = -1) =>
      session.call('viewport.image.animation.start', [viewId]),
    stopAnimation: (viewId = -1) =>
      session.call('viewport.image.animation.stop', [viewId]),
    updateCamera: (
      viewId = -1,
      focalPoint,
      viewUp,
      position,
      forceUpdate = true
    ) =>
      session.call('viewport.camera.update', [
        viewId,
        focalPoint,
        viewUp,
        position,
        forceUpdate,
      ]),
    updateCameraParameters: (
      viewId = -1,
      parameters = {},
      forceUpdate = true
    ) =>
      session.call('viewport.camera.update.params', [
        viewId,
        parameters,
        forceUpdate,
      ]),
  };
}
