import macro from 'vtk.js/Sources/macros';

// ----------------------------------------------------------------------------
// vtkTimeStepBasedAnimationHandler methods
// ----------------------------------------------------------------------------

function vtkTimeStepBasedAnimationHandler(publicAPI, model) {
  publicAPI.setCurrentTimeStep = (time) => {
    if (!model.timeSteps || model.timeSteps.length === 0) {
      return;
    }
    if (model.timeSteps.includes(time)) {
      model.currentTimeStep = time;
    } else if (time <= model.timeSteps[0]) {
      model.currentTimeStep = model.timeSteps[0];
    } else {
      model.currentTimeStep = model.timeSteps.find((prevTime, index, array) => {
        if (index === array.length - 1) {
          return true;
        }
        return time >= prevTime && time < array[index + 1];
      });
    }
    publicAPI.update();
  };

  publicAPI.setData = (data) => {
    model.data = data;

    // Refresh timesteps
    if (data.timeSteps) {
      model.timeSteps = data.timeSteps.map((timeStep) => timeStep.time);
      model.timeRange = [
        model.timeSteps[0],
        model.timeSteps[model.timeSteps.length - 1],
      ];
      model.currentTimeStep = model.timeSteps[0];
    }
  };

  publicAPI.setScene = (scene, originalMetadata, applySettings, renderer) => {
    model.scene = scene;
    model.originalMetadata = originalMetadata;
    model.applySettings = applySettings;
    model.renderer = renderer;
  };

  publicAPI.setCameraParameters = (params) => {
    if (model.renderers) {
      model.renderers.forEach((renderer) => {
        const camera = renderer.getActiveCamera();
        if (camera) {
          camera.set(params);
        }
      });
    }
  };

  publicAPI.setBackground = (color) => {
    if (model.renderers) {
      model.renderers.forEach((renderer) => {
        renderer.setBackground(color);
      });
    }
  };

  publicAPI.update = () => {
    if (!model.data || !model.scene) {
      return;
    }
    const currentScene = model.data.timeSteps.find(
      (scene) => scene.time === model.currentTimeStep
    );
    if (currentScene.camera) {
      const camera = { ...model.originalMetadata.camera };
      Object.assign(camera, currentScene.camera);
      publicAPI.setCameraParameters(camera);
    }
    if (currentScene.background) {
      publicAPI.setBackground(currentScene.background);
    }
    if (model.scene) {
      model.scene.forEach((sceneItem) => {
        if (
          sceneItem.source.setUpdateTimeStep &&
          sceneItem.source.getTimeSteps().includes(model.currentTimeStep)
        ) {
          sceneItem.source.setUpdateTimeStep(model.currentTimeStep);
        }
        const id = sceneItem.id;
        if (currentScene[id]) {
          const settings = { ...sceneItem.defaultSettings };
          Object.assign(settings, currentScene[id]);
          model.applySettings(sceneItem, settings);
        }
      });
    }
  };

  publicAPI.addRenderer = (renderer) => {
    if (renderer && !model.renderers.includes(renderer)) {
      model.renderers.push(renderer);
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  timeSteps: [0.0],
  timeRange: [0.0, 0.0],
  currentTimeStep: 0.0,
  scene: null,
  data: null,
  renderers: [],
  applySettings: null,
  originalMetadata: null,
};

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  macro.get(publicAPI, model, [
    'applySettings',
    'currentTimeStep',
    'data',
    'originalMetada',
    'scene',
    'timeRange',
    'timeSteps',
  ]);

  macro.setGet(publicAPI, model, ['renderers']);

  // Object methods
  vtkTimeStepBasedAnimationHandler(publicAPI, model);
}

export const newInstance = macro.newInstance(
  extend,
  'vtkTimeStepBasedAnimationHandler'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
