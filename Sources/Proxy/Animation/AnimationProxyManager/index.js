import macro from 'vtk.js/Sources/macros';

// ----------------------------------------------------------------------------
// vtkAnimationProxyManager methods
// ----------------------------------------------------------------------------

function vtkAnimationProxyManager(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkAnimationProxyManager');

  // Initialization ------------------------------------------------------------

  publicAPI.addAnimation = (animation) => {
    if (!model.animations.includes(animation)) {
      model.animations.push(animation);
    }

    animation.onModified(publicAPI.updateFrames);

    publicAPI.updateFrames();
  };

  publicAPI.play = () => {
    const currentTime = model.frames[model.currentFrameIndex];
    const nextTime = model.frames[model.currentFrameIndex + 1];
    clearTimeout(model.timeOut);
    if (model.currentFrameIndex < model.frames.length - 1) {
      model.timeOut = setTimeout(() => {
        publicAPI.nextFrame();
        publicAPI.play();
      }, (nextTime - currentTime) * 1000);
    } else {
      publicAPI.invokeDonePlaying();
    }
  };

  publicAPI.pause = () => {
    clearTimeout(model.timeOut);
    model.timeOut = null;
  };

  publicAPI.nextFrame = () => {
    if (model.currentFrameIndex < model.frames.length - 1) {
      publicAPI.setFrameIndex(model.currentFrameIndex + 1);
    }
  };

  publicAPI.previousFrame = () => {
    if (model.currentFrameIndex > 0) {
      publicAPI.setFrameIndex(model.currentFrameIndex - 1);
    }
  };

  publicAPI.firstFrame = () => {
    publicAPI.setFrameIndex(0);
  };

  publicAPI.lastFrame = () => {
    publicAPI.setFrameIndex(model.frames.length - 1);
  };

  publicAPI.setFrameIndex = (frameId) => {
    model.currentFrameIndex = frameId;
    model.animations.forEach((animationProxy) => {
      animationProxy.setTime(model.frames[model.currentFrameIndex]);
    });
    publicAPI.invokeCurrentFrameChanged();
  };

  publicAPI.updateFrames = () => {
    const frames = [];
    model.animations.forEach((animationProxy) => {
      frames.push(...animationProxy.getFrames());
    });
    model.frames = frames
      .sort((a, b) => a - b)
      .filter((val, index, array) => array.indexOf(val) === index); // remove duplicates
    publicAPI.invokeFramesChanged();
    // Reset animation as frames changed.
    publicAPI.setFrameIndex(0);
  };

  publicAPI.getCurrentFrame = () => model.frames[model.currentFrameIndex];
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  animations: [],
  currentFrameIndex: 0,
  frames: [],
  timeOut: null,
};

// ----------------------------------------------------------------------------

function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['frames', 'currentFrameIndex']);

  // Object specific methods
  vtkAnimationProxyManager(publicAPI, model);

  // Proxy handling
  macro.proxy(publicAPI, model);
  macro.event(publicAPI, model, 'currentFrameChanged');
  macro.event(publicAPI, model, 'framesChanged');
  macro.event(publicAPI, model, 'donePlaying');
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkAnimationProxyManager'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
