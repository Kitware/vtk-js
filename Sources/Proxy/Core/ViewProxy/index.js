import macro from 'vtk.js/Sources/macro';

import vtkAnnotatedCubeActor from 'vtk.js/Sources/Rendering/Core/AnnotatedCubeActor';
import vtkAxesActor from 'vtk.js/Sources/Rendering/Core/AxesActor';
import vtkCornerAnnotation from 'vtk.js/Sources/Interaction/UI/CornerAnnotation';
import vtkInteractorStyleManipulator from 'vtk.js/Sources/Interaction/Style/InteractorStyleManipulator';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkOrientationMarkerWidget from 'vtk.js/Sources/Interaction/Widgets/OrientationMarkerWidget';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';

import InteractionPresets from 'vtk.js/Sources/Interaction/Style/InteractorStyleManipulator/Presets';
import AnnotatedCubePresets from 'vtk.js/Sources/Rendering/Core/AnnotatedCubeActor/Presets';

const EPSILON = 0.000001;

// ----------------------------------------------------------------------------
// vtkViewProxy methods
// ----------------------------------------------------------------------------

function vtkViewProxy(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkViewProxy');

  // Private --------------------------------------------------------------------

  function updateAnnotationColor() {
    const [r, g, b] = model.renderer.getBackground();
    model.cornerAnnotation.getAnnotationContainer().style.color =
      r + g + b > 1.5 ? 'black' : 'white';
  }

  // Setup --------------------------------------------------------------------
  model.renderWindow = vtkRenderWindow.newInstance();
  model.renderer = vtkRenderer.newInstance({ background: [0, 0, 0] });
  model.renderWindow.addRenderer(model.renderer);

  model.openglRenderWindow = vtkOpenGLRenderWindow.newInstance();
  model.renderWindow.addView(model.openglRenderWindow);

  model.interactor = vtkRenderWindowInteractor.newInstance();
  model.interactor.setView(model.openglRenderWindow);

  model.interactorStyle3D = vtkInteractorStyleManipulator.newInstance();
  model.interactorStyle2D = vtkInteractorStyleManipulator.newInstance();

  // Apply default interaction styles
  InteractionPresets.applyPreset('3D', model.interactorStyle3D);
  InteractionPresets.applyPreset('2D', model.interactorStyle2D);

  model.cornerAnnotation = vtkCornerAnnotation.newInstance();

  // Setup interaction
  model.interactor.setInteractorStyle(
    model.useParallelRendering
      ? model.interactorStyle2D
      : model.interactorStyle3D
  );
  model.camera = model.renderer.getActiveCamera();
  model.camera.setParallelProjection(!!model.useParallelRendering);

  // Orientation a cube setup -------------------------------------------------

  model.orientationAxesArrow = vtkAxesActor.newInstance();
  model.orientationAxesCube = vtkAnnotatedCubeActor.newInstance();
  AnnotatedCubePresets.applyPreset('default', model.orientationAxesCube);
  AnnotatedCubePresets.applyPreset('lps', model.orientationAxesCube);
  model.orientationWidget = vtkOrientationMarkerWidget.newInstance({
    actor: model.orientationAxesArrow,
    interactor: model.renderWindow.getInteractor(),
  });
  model.orientationWidget.setEnabled(true);
  model.orientationWidget.setViewportCorner(
    vtkOrientationMarkerWidget.Corners.BOTTOM_LEFT
  );
  model.orientationWidget.setViewportSize(0.1);

  // API ----------------------------------------------------------------------

  publicAPI.setPresetToInteractor3D = (nameOrDefinitions) => {
    if (Array.isArray(nameOrDefinitions)) {
      return InteractionPresets.applyDefinitions(
        nameOrDefinitions,
        model.interactorStyle3D
      );
    }
    return InteractionPresets.applyPreset(
      nameOrDefinitions,
      model.interactorStyle3D
    );
  };

  // --------------------------------------------------------------------------

  publicAPI.setPresetToInteractor2D = (nameOrDefinitions) => {
    if (Array.isArray(nameOrDefinitions)) {
      return InteractionPresets.applyDefinitions(
        nameOrDefinitions,
        model.interactorStyle2D
      );
    }
    return InteractionPresets.applyPreset(
      nameOrDefinitions,
      model.interactorStyle2D
    );
  };

  // --------------------------------------------------------------------------

  publicAPI.setOrientationAxesType = (type) => {
    switch (type) {
      case 'arrow':
        model.orientationAxesType = 'arrow';
        model.orientationWidget.setActor(model.orientationAxesArrow);
        break;
      case 'cube':
      default:
        model.orientationWidget.setActor(model.orientationAxesCube);
        model.orientationAxesType = 'cube';
        break;
    }
    publicAPI.renderLater();
  };

  // --------------------------------------------------------------------------

  publicAPI.setPresetToOrientationAxes = (nameOrDefinitions) => {
    let changeDetected = false;
    if (typeof nameOrDefinitions === 'string') {
      if (model.presetToOrientationAxes !== nameOrDefinitions) {
        model.presetToOrientationAxes = nameOrDefinitions;
        changeDetected = AnnotatedCubePresets.applyPreset(
          nameOrDefinitions,
          model.orientationAxesCube
        );
        publicAPI.modified();
      }
      return changeDetected;
    }
    model.presetToOrientationAxes = 'Custom';
    changeDetected = AnnotatedCubePresets.applyDefinitions(
      nameOrDefinitions,
      model.orientationAxesCube
    );
    publicAPI.modified();
    return changeDetected;
  };

  // --------------------------------------------------------------------------

  publicAPI.setContainer = (container) => {
    if (model.container) {
      model.interactor.unbindEvents(model.container);
      model.openglRenderWindow.setContainer(null);
      model.cornerAnnotation.setContainer(null);
    }

    model.container = container;

    if (container) {
      model.openglRenderWindow.setContainer(container);
      model.cornerAnnotation.setContainer(container);
      model.interactor.initialize();
      model.interactor.bindEvents(container);
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.resize = () => {
    if (model.container) {
      const dims = model.container.getBoundingClientRect();
      if (dims.width === dims.height && dims.width === 0) {
        return;
      }
      model.openglRenderWindow.setSize(
        Math.max(10, Math.floor(dims.width)),
        Math.max(10, Math.floor(dims.height))
      );
      publicAPI.renderLater();
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.renderLater = () => {
    if (model.representations.length > 0 && model.resetCameraOnFirstRender) {
      model.resetCameraOnFirstRender = false;
      publicAPI.resetCamera();
    }
    model.orientationWidget.updateMarkerOrientation();
    model.renderer.resetCameraClippingRange();
    setTimeout(model.renderWindow.render, 0);
  };

  // --------------------------------------------------------------------------

  publicAPI.addRepresentation = (representation) => {
    if (!representation) {
      return;
    }
    if (model.representations.indexOf(representation) === -1) {
      model.representations.push(representation);
      representation.getActors().forEach(model.renderer.addActor);
      representation.getVolumes().forEach(model.renderer.addVolume);
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.removeRepresentation = (representation) => {
    if (!representation) {
      return;
    }
    if (model.representations.indexOf(representation) !== -1) {
      model.representations = model.representations.filter(
        (r) => r !== representation
      );
      representation.getActors().forEach(model.renderer.removeActor);
      representation.getVolumes().forEach(model.renderer.removeVolume);
    }

    if (model.representations.length === 0) {
      model.resetCameraOnFirstRender = true;
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.resetCamera = () => {
    model.renderer.resetCamera();
    model.renderer.resetCameraClippingRange();
    model.interactorStyle2D.setCenterOfRotation(model.camera.getFocalPoint());
    model.interactorStyle3D.setCenterOfRotation(model.camera.getFocalPoint());
    publicAPI.renderLater();
  };

  // --------------------------------------------------------------------------

  publicAPI.captureImage = () => model.renderWindow.captureImages()[0];

  // --------------------------------------------------------------------------

  publicAPI.openCaptureImage = (target = '_blank') => {
    const image = new Image();
    publicAPI.captureImage().then((imageURL) => {
      image.src = imageURL;
      const w = window.open('', target);
      w.document.write(image.outerHTML);
      w.document.title = 'vtk.js Image Capture';
      window.focus();
    });
  };

  // --------------------------------------------------------------------------

  publicAPI.setCornerAnnotation = (corner, templateString) => {
    model.cornerAnnotation.updateTemplates({
      [corner]: (meta) =>
        vtkCornerAnnotation.applyTemplate(templateString, meta),
    });
  };

  // --------------------------------------------------------------------------

  publicAPI.setCornerAnnotations = (annotations, useTemplateString = false) => {
    if (useTemplateString) {
      Object.keys(annotations).forEach((key) => {
        publicAPI.setCornerAnnotation(key, annotations[key]);
      });
    } else {
      model.cornerAnnotation.updateTemplates(annotations);
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.updateCornerAnnotation = (meta) =>
    model.cornerAnnotation.updateMetadata(meta);

  // --------------------------------------------------------------------------

  publicAPI.setAnnotationOpacity = (opacity) => {
    if (model.annotationOpacity !== Number(opacity)) {
      model.annotationOpacity = Number(opacity);
      model.cornerAnnotation.getAnnotationContainer().style.opacity = opacity;
      publicAPI.modified();
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.setBackground = macro.chain(
    model.renderer.setBackground,
    updateAnnotationColor
  );

  // --------------------------------------------------------------------------

  publicAPI.getBackground = model.renderer.getBackground;

  // --------------------------------------------------------------------------

  publicAPI.setAnimation = (enable, requester = publicAPI) => {
    if (model.disableAnimation && enable) {
      return;
    }
    if (enable) {
      model.renderWindow.getInteractor().requestAnimation(requester);
    } else {
      const skipWarning =
        requester === publicAPI ||
        `${requester}`.indexOf('ViewProxy.updateOrientation.') === 0;
      model.renderWindow
        .getInteractor()
        .cancelAnimation(requester, skipWarning);
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.updateOrientation = (
    axisIndex,
    orientation,
    viewUp,
    animateSteps = 0
  ) => {
    if (axisIndex === undefined) {
      return Promise.resolve();
    }

    const originalPosition = model.camera.getPosition();
    const originalViewUp = model.camera.getViewUp();
    const originalFocalPoint = model.camera.getFocalPoint();

    model.axis = axisIndex;
    model.orientation = orientation;
    model.viewUp = viewUp;
    const position = model.camera.getFocalPoint();
    position[model.axis] += model.orientation;
    model.camera.setPosition(...position);
    model.camera.setViewUp(...viewUp);
    model.renderer.resetCamera();

    const destPosition = model.camera.getPosition();
    const destViewUp = model.camera.getViewUp();

    // Reset to original to prevent initial render flash
    model.camera.setPosition(...originalPosition);
    model.camera.setViewUp(...originalViewUp);

    const animationStack = [{ position: destPosition, viewUp: destViewUp }];

    if (animateSteps) {
      const deltaPosition = [
        (originalPosition[0] - destPosition[0]) / animateSteps,
        (originalPosition[1] - destPosition[1]) / animateSteps,
        (originalPosition[2] - destPosition[2]) / animateSteps,
      ];
      const deltaViewUp = [
        (originalViewUp[0] - destViewUp[0]) / animateSteps,
        (originalViewUp[1] - destViewUp[1]) / animateSteps,
        (originalViewUp[2] - destViewUp[2]) / animateSteps,
      ];

      const needSteps =
        deltaPosition[0] ||
        deltaPosition[1] ||
        deltaPosition[2] ||
        deltaViewUp[0] ||
        deltaViewUp[1] ||
        deltaViewUp[2];

      const positionDeltaAxisCount = deltaPosition
        .map((i) => (Math.abs(i) < EPSILON ? 0 : 1))
        .reduce((a, b) => a + b, 0);
      const viewUpDeltaAxisCount = deltaViewUp
        .map((i) => (Math.abs(i) < EPSILON ? 0 : 1))
        .reduce((a, b) => a + b, 0);
      const rotation180Only =
        viewUpDeltaAxisCount === 1 && positionDeltaAxisCount === 0;

      if (needSteps) {
        if (rotation180Only) {
          const availableAxes = originalFocalPoint
            .map(
              (fp, i) =>
                Math.abs(originalPosition[i] - fp) < EPSILON ? i : null
            )
            .filter((i) => i !== null);
          const axisCorrectionIndex = availableAxes.find(
            (v) => Math.abs(deltaViewUp[v]) < EPSILON
          );
          for (let i = 0; i < animateSteps; i++) {
            const newViewUp = [
              viewUp[0] + (i + 1) * deltaViewUp[0],
              viewUp[1] + (i + 1) * deltaViewUp[1],
              viewUp[2] + (i + 1) * deltaViewUp[2],
            ];
            newViewUp[axisCorrectionIndex] = Math.sin(
              (Math.PI * i) / (animateSteps - 1)
            );
            animationStack.push({
              position: destPosition,
              viewUp: newViewUp,
            });
          }
        } else {
          for (let i = 0; i < animateSteps; i++) {
            animationStack.push({
              position: [
                destPosition[0] + (i + 1) * deltaPosition[0],
                destPosition[1] + (i + 1) * deltaPosition[1],
                destPosition[2] + (i + 1) * deltaPosition[2],
              ],
              viewUp: [
                viewUp[0] + (i + 1) * deltaViewUp[0],
                viewUp[1] + (i + 1) * deltaViewUp[1],
                viewUp[2] + (i + 1) * deltaViewUp[2],
              ],
            });
          }
        }
      }
    }

    if (animationStack.length === 1) {
      // update camera directly
      model.camera.set(animationStack.pop());
      model.renderer.resetCameraClippingRange();
      if (model.interactor.getLightFollowCamera()) {
        model.renderer.updateLightsGeometryToFollowCamera();
      }
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const now = performance.now().toString();
      const animationRequester = `ViewProxy.updateOrientation.${now}`;
      publicAPI.setAnimation(true, animationRequester);
      let intervalId = null;
      const consumeAnimationStack = () => {
        if (animationStack.length) {
          const {
            position: cameraPosition,
            viewUp: cameraViewUp,
          } = animationStack.pop();
          model.camera.setPosition(...cameraPosition);
          model.camera.setViewUp(...cameraViewUp);
          model.renderer.resetCameraClippingRange();

          if (model.interactor.getLightFollowCamera()) {
            model.renderer.updateLightsGeometryToFollowCamera();
          }
        } else {
          clearInterval(intervalId);
          publicAPI.setAnimation(false, animationRequester);
          resolve();
        }
      };
      intervalId = setInterval(consumeAnimationStack, 1);
    });
  };

  // --------------------------------------------------------------------------

  publicAPI.resetOrientation = (animateSteps = 0) =>
    publicAPI.updateOrientation(
      model.axis,
      model.orientation,
      model.viewUp,
      animateSteps
    );

  // --------------------------------------------------------------------------

  publicAPI.rotate = (angle) => {
    const { viewUp, focalPoint, position } = model.camera.get(
      'viewUp',
      'focalPoint',
      'position'
    );
    const axis = [
      focalPoint[0] - position[0],
      focalPoint[1] - position[1],
      focalPoint[2] - position[2],
    ];

    vtkMatrixBuilder
      .buildFromDegree()
      .rotate(Number.isNaN(angle) ? 90 : angle, axis)
      .apply(viewUp);

    model.camera.setViewUp(...viewUp);
    model.camera.modified();
    model.orientationWidget.updateMarkerOrientation();
    model.renderWindow.render();
  };

  // --------------------------------------------------------------------------
  // Initialization from state or input
  // --------------------------------------------------------------------------

  publicAPI.resetOrientation();
  updateAnnotationColor();
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  representations: [],
  sectionName: 'view',
  annotationOpacity: 1,
  resetCameraOnFirstRender: true,
  presetToOrientationAxes: 'lps',
  orientationAxesType: 'arrow',
  disableAnimation: false,
  axis: 1,
  orientation: 0,
  viewUp: [0, 0, 1],
};

// ----------------------------------------------------------------------------

function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['name', 'disableAnimation']);
  macro.get(publicAPI, model, [
    'annotationOpacity',
    'camera',
    'container',
    'cornerAnnotation',
    'interactor',
    'interactorStyle2D',
    'interactorStyle3D',
    'openglRenderWindow',
    'orientationAxesType',
    'presetToOrientationAxes',
    'renderer',
    'renderWindow',
    'representations',
    'useParallelRendering',
  ]);

  // Object specific methods
  vtkViewProxy(publicAPI, model);

  // Proxy handling
  macro.proxy(publicAPI, model);
  macro.proxyPropertyMapping(publicAPI, model, {
    orientationAxesVisibility: {
      modelKey: 'orientationWidget',
      property: 'enabled',
    },
    orientationAxesCorner: {
      modelKey: 'orientationWidget',
      property: 'viewportCorner',
    },
    orientationAxesSize: {
      modelKey: 'orientationWidget',
      property: 'viewportSize',
    },
    cameraViewUp: { modelKey: 'camera', property: 'viewUp', modified: false },
    cameraPosition: {
      modelKey: 'camera',
      property: 'position',
      modified: false,
    },
    cameraFocalPoint: {
      modelKey: 'camera',
      property: 'focalPoint',
      modified: false,
    },
  });
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkViewProxy');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
