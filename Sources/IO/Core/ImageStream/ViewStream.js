import macro from 'vtk.js/Sources/macro';

function vtkViewStream(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkViewStream');

  // Internal variables
  model.imageDecodingPool = [new Image(), new Image()];
  model.eventPool = [];
  model.nextPoolImageIndex = 0;
  model.urlToRevoke = [];
  model.activeURL = null;
  model.fps = [];
  model.lastTime = Date.now();
  model.lastImageEvent = null;

  // --------------------------------------------------------------------------
  // Internal methods
  // --------------------------------------------------------------------------

  function imageLoaded(e) {
    const id = Number(this.dataset.id);
    publicAPI.invokeImageReady(model.eventPool[id]);
  }

  // --------------------------------------------------------------------------

  function prepareDecodingPool(size = 2) {
    while (model.imageDecodingPool.length < size) {
      model.imageDecodingPool.push(new Image());
    }
    for (let i = 0; i < model.imageDecodingPool.length; i++) {
      model.imageDecodingPool[i].dataset.id = i;
      model.imageDecodingPool[i].onload = imageLoaded;
    }
  }

  // --------------------------------------------------------------------------

  function decodeImage(event) {
    model.eventPool[model.nextPoolImageIndex] = event;
    event.image = model.imageDecodingPool[model.nextPoolImageIndex++];
    model.nextPoolImageIndex %= model.imageDecodingPool.length;
    event.image.src = event.url;
  }

  // --------------------------------------------------------------------------

  publicAPI.pushCamera = () => {
    const focalPoint = model.camera.getReferenceByName('focalPoint');
    const viewUp = model.camera.getReferenceByName('viewUp');
    const position = model.camera.getReferenceByName('position');
    const parallelProjection = model.camera.getParallelProjection();
    const viewAngle = model.camera.getViewAngle();
    const parallelScale = model.camera.getParallelScale();
    let promise = null;

    if (model.useCameraParameters) {
      promise = model.protocol.updateCameraParameters(
        model.viewId,
        {
          focalPoint,
          viewUp,
          position,
          parallelProjection,
          viewAngle,
          parallelScale,
        },
        false
      );
    } else {
      promise = model.protocol.updateCamera(
        model.viewId,
        focalPoint,
        viewUp,
        position,
        false
      );
    }

    if (model.isAnimating) {
      setTimeout(publicAPI.pushCamera, 1000 / model.cameraUpdateRate);
    }
    return promise;
  };

  // --------------------------------------------------------------------------

  publicAPI.invalidateCache = () =>
    model.protocol.invalidateCache(model.viewId);

  // --------------------------------------------------------------------------
  // PublicAPI
  // --------------------------------------------------------------------------

  publicAPI.render = () =>
    model.protocol.render({ view: model.viewId, size: model.size });

  // --------------------------------------------------------------------------

  publicAPI.startAnimation = () => model.protocol.startAnimation(model.viewId);

  // --------------------------------------------------------------------------

  publicAPI.stopAnimation = () => model.protocol.stopAnimation(model.viewId);

  // --------------------------------------------------------------------------

  publicAPI.setSize = (width, height) => {
    let changeDetected = false;
    if (model.size[0] !== width || model.size[1] !== height) {
      model.size = [width, height];
      changeDetected = true;
    }

    if (changeDetected) {
      publicAPI.modified();
      return model.protocol.setSize(model.viewId, width, height);
    }

    return Promise.resolve(false);
  };

  // --------------------------------------------------------------------------

  publicAPI.startInteraction = () => {
    const promises = [
      model.protocol.setQuality(
        model.viewId,
        model.interactiveQuality,
        model.interactiveRatio
      ),
    ];

    if (model.camera) {
      promises.push(publicAPI.startAnimation());
      model.isAnimating = true;
      promises.push(publicAPI.pushCamera());
    }

    return Promise.all(promises);
  };

  // --------------------------------------------------------------------------

  publicAPI.endInteraction = () => {
    const promises = [];
    promises.push(
      model.protocol.setQuality(
        model.viewId,
        model.stillQuality,
        model.stillRatio
      )
    );
    if (model.camera) {
      promises.push(publicAPI.stopAnimation());
    }
    model.isAnimating = false;
    promises.push(publicAPI.pushCamera());

    return Promise.all(promises);
  };

  // --------------------------------------------------------------------------

  publicAPI.setViewId = (id) => {
    if (model.viewId === id || !model.protocol) {
      return false;
    }
    if (model.viewId) {
      model.protocol.unregisterView(model.viewId);
    }
    model.viewId = id;
    if (model.viewId) {
      model.protocol.registerView(model.viewId).then(({ viewId }) => {
        model.viewId = viewId;
      });
    }
    return true;
  };

  // --------------------------------------------------------------------------

  publicAPI.processMessage = (msg) => {
    /* eslint-disable eqeqeq */
    if (msg.id != model.viewId) {
      return;
    }
    /* eslint-enable eqeqeq */
    const imgBlob = new Blob([msg.image], {
      type: model.mimeType,
    });
    if (model.activeURL) {
      model.urlToRevoke.push(model.activeURL);
      model.activeURL = null;
      while (model.urlToRevoke.length > 60) {
        const url = model.urlToRevoke.shift();
        window.URL.revokeObjectURL(url);
      }
    }
    model.activeURL = URL.createObjectURL(imgBlob);
    const time = Date.now();
    const fps = Math.floor(10000 / (time - model.lastTime)) / 10;
    model.fps.push(fps);
    model.lastTime = time;

    model.lastImageEvent = {
      url: model.activeURL,
      fps,
      metadata: {
        size: msg.size,
        id: msg.id,
        memory: msg.memsize,
        workTime: msg.workTime,
      },
    };
    if (model.decodeImage) {
      decodeImage(model.lastImageEvent);
    } else {
      publicAPI.invokeImageReady(model.lastImageEvent);
    }

    // GC fps
    while (model.fps.length > model.fpsWindowSize) {
      model.fps.shift();
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.delete = macro.chain(() => {
    model.unregisterViewStream(publicAPI);
    publicAPI.setViewId(null);
    while (model.urlToRevoke.length) {
      window.URL.revokeObjectURL(model.urlToRevoke.pop());
    }
  }, publicAPI.delete);

  // --------------------------------------------------------------------------
  // Initialize object
  // --------------------------------------------------------------------------

  prepareDecodingPool();
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // protocol: null,
  // api: null,
  cameraUpdateRate: 30,
  decodeImage: true,
  fpsWindowSize: 250,
  interactiveQuality: 80,
  interactiveRatio: 1,
  isAnimating: false,
  mimeType: 'image/jpeg',
  size: [-1, -1],
  stillQuality: 100,
  stillRatio: 1,
  useCameraParameters: false,
  viewId: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);
  macro.event(publicAPI, model, 'ImageReady');
  macro.get(publicAPI, model, ['viewId', 'size', 'fps', 'lastImageEvent']);
  macro.setGet(publicAPI, model, [
    'camera',
    'cameraUpdateRate',
    'decodeImage',
    'fpsWindowSize',
    'interactiveQuality',
    'interactiveRatio',
    'stillQuality',
    'stillRatio',
    'useCameraParameters',
  ]);

  // Object specific methods
  vtkViewStream(publicAPI, model);

  // Blend APIs
  Object.assign(publicAPI, model.sharedAPI);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkViewStream');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
