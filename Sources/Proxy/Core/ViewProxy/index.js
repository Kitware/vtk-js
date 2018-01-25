import macro from 'vtk.js/Sources/macro';

import vtkAnnotatedCubeActor from 'vtk.js/Sources/Rendering/Core/AnnotatedCubeActor';
import vtkCornerAnnotation from 'vtk.js/Sources/Interaction/UI/CornerAnnotation';
import vtkInteractorStyleManipulator from 'vtk.js/Sources/Interaction/Style/InteractorStyleManipulator';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkOrientationMarkerWidget from 'vtk.js/Sources/Interaction/Widgets/OrientationMarkerWidget';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkTrackballPan from 'vtk.js/Sources/Interaction/Manipulators/TrackballPan';
import vtkTrackballRoll from 'vtk.js/Sources/Interaction/Manipulators/TrackballRoll';
import vtkTrackballRotate from 'vtk.js/Sources/Interaction/Manipulators/TrackballRotate';
import vtkTrackballZoom from 'vtk.js/Sources/Interaction/Manipulators/TrackballZoom';

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

  model.cornerAnnotation = vtkCornerAnnotation.newInstance();

  // Rotate
  model.interactorStyle3D.addManipulator(vtkTrackballRotate.newInstance());
  // Pan
  model.interactorStyle2D.addManipulator(vtkTrackballPan.newInstance());
  model.interactorStyle2D.addManipulator(
    vtkTrackballPan.newInstance({ shift: true })
  );
  model.interactorStyle3D.addManipulator(
    vtkTrackballPan.newInstance({ shift: true })
  );
  // Zoom
  model.interactorStyle2D.addManipulator(
    vtkTrackballZoom.newInstance({ control: true, pinch: true })
  );
  model.interactorStyle2D.addManipulator(
    vtkTrackballZoom.newInstance({ alt: true, pinch: true })
  );
  model.interactorStyle3D.addManipulator(
    vtkTrackballZoom.newInstance({ control: true, pinch: true })
  );
  model.interactorStyle3D.addManipulator(
    vtkTrackballZoom.newInstance({ alt: true, pinch: true })
  );
  // Roll
  model.interactorStyle3D.addManipulator(
    vtkTrackballRoll.newInstance({ shift: true, control: true })
  );
  model.interactorStyle3D.addManipulator(
    vtkTrackballRoll.newInstance({ shift: true, alt: true })
  );

  // Setup interaction
  model.interactor.setInteractorStyle(
    model.useParallelRendering
      ? model.interactorStyle2D
      : model.interactorStyle3D
  );
  model.camera = model.renderer.getActiveCamera();
  model.camera.setParallelProjection(!!model.useParallelRendering);

  // Orientation a cube setup -------------------------------------------------

  model.orientationAxes = vtkAnnotatedCubeActor.newInstance();
  model.orientationAxes.setDefaultStyle({
    fontStyle: 'bold',
    fontFamily: 'Arial',
    fontColor: 'black',
    fontSizeScale: (res) => res / 2,
    faceColor: 'white',
    edgeThickness: 0.1,
    edgeColor: 'black',
    resolution: 400,
  });

  model.orientationAxes.setXMinusFaceProperty({
    text: 'X-',
    faceColor: 'yellow',
  });
  model.orientationAxes.setXPlusFaceProperty({
    text: 'X+',
    faceColor: 'yellow',
  });
  model.orientationAxes.setYMinusFaceProperty({ text: 'Y-', faceColor: 'red' });
  model.orientationAxes.setYPlusFaceProperty({ text: 'Y+', faceColor: 'red' });
  model.orientationAxes.setZMinusFaceProperty({
    text: 'Z-',
    faceColor: '#008000',
  });
  model.orientationAxes.setZPlusFaceProperty({
    text: 'Z+',
    faceColor: '#008000',
  });

  model.orientationWidget = vtkOrientationMarkerWidget.newInstance({
    actor: model.orientationAxes,
    interactor: model.renderWindow.getInteractor(),
  });
  model.orientationWidget.setEnabled(true);
  model.orientationWidget.setViewportCorner(
    vtkOrientationMarkerWidget.Corners.BOTTOM_LEFT
  );
  model.orientationWidget.setViewportSize(0.1);

  // API ----------------------------------------------------------------------

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
      // console.log('==> resetCamera before renderLater', model.proxyId);
      publicAPI.resetCamera();
    }
    model.orientationWidget.updateMarkerOrientation();
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
    image.src = publicAPI.captureImage();
    const w = window.open('', target);
    w.document.write(image.outerHTML);
    w.document.title = 'vtk.js Image Capture';
    window.focus();
  };

  // --------------------------------------------------------------------------

  publicAPI.setCornerAnnotation = (corner, templateString) => {
    model.cornerAnnotation.updateTemplates({
      [corner]: (meta) =>
        vtkCornerAnnotation.applyTemplate(templateString, meta),
    });
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

  publicAPI.setAnimation = (enable) => {
    if (enable) {
      model.renderWindow.getInteractor().requestAnimation('proxy');
    } else {
      model.renderWindow.getInteractor().cancelAnimation('proxy');
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.updateOrientation = (axisIndex, orientation, viewUp) => {
    if (axisIndex === undefined) {
      return;
    }
    model.axis = axisIndex;
    model.orientation = orientation;
    model.viewUp = viewUp;
    const position = model.camera.getFocalPoint();
    position[model.axis] += model.orientation;
    model.camera.setPosition(...position);
    model.camera.setViewUp(...viewUp);
  };

  // --------------------------------------------------------------------------

  publicAPI.resetOrientation = () => {
    publicAPI.updateOrientation(model.axis, model.orientation, model.viewUp);
  };

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
    model.renderWindow.render();
  };

  // --------------------------------------------------------------------------
  // Initialization from state or input
  // --------------------------------------------------------------------------

  publicAPI.updateOrientation(model.axis, model.orientation, model.viewUp);
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
};

// ----------------------------------------------------------------------------

function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, [
    'representations',
    'renderer',
    'renderWindow',
    'openglRenderWindow',
    'interactor',
    'interactorStyle2D',
    'interactorStyle3D',
    'container',
    'useParallelRendering',
    'camera',
    'cornerAnnotation',
    'annotationOpacity',
  ]);

  // Object specific methods
  vtkViewProxy(publicAPI, model);

  // Proxy handling
  macro.proxy(publicAPI, model);
  macro.proxyPropertyMapping(publicAPI, model, {
    orientationAxes: { modelKey: 'orientationWidget', property: 'enabled' },
    cameraViewUp: { modelKey: 'camera', property: 'viewUp' },
    cameraPosition: { modelKey: 'camera', property: 'position' },
    cameraFocalPoint: { modelKey: 'camera', property: 'focalPoint' },
  });
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkViewProxy');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
