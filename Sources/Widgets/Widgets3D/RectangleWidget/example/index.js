import 'vtk.js/Sources/favicon';

import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkWidgetManager from 'vtk.js/Sources/Widgets/Core/WidgetManager';
import vtkInteractorStyleImage from 'vtk.js/Sources/Interaction/Style/InteractorStyleImage';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkPaintFilter from 'vtk.js/Sources/Filters/General/PaintFilter';
import vtkRectangleWidget from 'vtk.js/Sources/Widgets/Widgets3D/RectangleWidget';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';

import { ViewTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

import {
  BehaviorCategory,
  ShapeBehavior,
} from 'vtk.js/Sources/Widgets/Widgets3D/ShapeWidget/Constants';

import controlPanel from './controlPanel.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

// scene
const scene = {};

scene.fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  rootContainer: document.body,
  background: [0.1, 0.1, 0.1],
});

scene.renderer = scene.fullScreenRenderer.getRenderer();
scene.renderWindow = scene.fullScreenRenderer.getRenderWindow();
scene.openGLRenderWindow = scene.fullScreenRenderer.getOpenGLRenderWindow();
scene.camera = scene.renderer.getActiveCamera();

// setup 2D view
scene.camera.setParallelProjection(true);
scene.iStyle = vtkInteractorStyleImage.newInstance();
scene.iStyle.setInteractionMode('IMAGE_SLICING');
scene.renderWindow.getInteractor().setInteractorStyle(scene.iStyle);
scene.fullScreenRenderer.addController(controlPanel);

function setCamera(sliceMode, renderer, data) {
  const ijk = [0, 0, 0];
  const position = [0, 0, 0];
  const focalPoint = [0, 0, 0];
  data.indexToWorldVec3(ijk, focalPoint);
  ijk[sliceMode] = 1;
  data.indexToWorldVec3(ijk, position);
  renderer.getActiveCamera().set({ focalPoint, position });
  renderer.resetCamera();
}

// ----------------------------------------------------------------------------
// Widgets setup
// ----------------------------------------------------------------------------

scene.widgetManager = vtkWidgetManager.newInstance();
scene.widgetManager.setRenderer(scene.renderer);

// Widget
const rectangleWidget = vtkRectangleWidget.newInstance();

scene.viewHandle = scene.widgetManager.addWidget(
  rectangleWidget,
  ViewTypes.SLICE
);

scene.viewHandle.setModifierBehavior({
  None: {
    [BehaviorCategory.PLACEMENT]:
      ShapeBehavior[BehaviorCategory.PLACEMENT].CLICK_AND_DRAG,
    [BehaviorCategory.POINTS]:
      ShapeBehavior[BehaviorCategory.POINTS].CORNER_TO_CORNER,
    [BehaviorCategory.RATIO]: ShapeBehavior[BehaviorCategory.RATIO].FREE,
  },
  Shift: {
    [BehaviorCategory.RATIO]: ShapeBehavior[BehaviorCategory.RATIO].FIXED,
  },
  Control: {
    [BehaviorCategory.POINTS]:
      ShapeBehavior[BehaviorCategory.POINTS].CENTER_TO_CORNER,
  },
});
// scene.viewHandle.setVisibleOnFocus(false);

// Paint filter
const painter = vtkPaintFilter.newInstance();

// ----------------------------------------------------------------------------
// Ready logic
// ----------------------------------------------------------------------------

function ready(scope, picking = false) {
  scope.renderer.resetCamera();
  scope.fullScreenRenderer.resize();
  if (picking) {
    scope.widgetManager.enablePicking();
  } else {
    scope.widgetManager.disablePicking();
  }
}

function readyAll() {
  ready(scene, true);
}

function updateControlPanel(im, ds) {
  const slicingMode = im.getSlicingMode();
  const extent = ds.getExtent();
  document
    .querySelector('.slice')
    .setAttribute('max', extent[slicingMode * 2 + 1]);
}

// ----------------------------------------------------------------------------
// Load image
// ----------------------------------------------------------------------------

const image = {
  imageMapper: vtkImageMapper.newInstance(),
  actor: vtkImageSlice.newInstance(),
};

const labelMap = {
  imageMapper: vtkImageMapper.newInstance(),
  actor: vtkImageSlice.newInstance(),
  cfun: vtkColorTransferFunction.newInstance(),
  ofun: vtkPiecewiseFunction.newInstance(),
};

// background image pipeline
image.actor.setMapper(image.imageMapper);

// labelmap pipeline
labelMap.actor.setMapper(labelMap.imageMapper);
labelMap.imageMapper.setInputConnection(painter.getOutputPort());

// set up labelMap color and opacity mapping
labelMap.cfun.addRGBPoint(1, 0, 0, 1); // label "1" will be blue
labelMap.ofun.addPoint(0, 0); // our background value, 0, will be invisible
labelMap.ofun.addPoint(1, 1); // all values above 1 will be fully opaque

labelMap.actor.getProperty().setRGBTransferFunction(labelMap.cfun);
labelMap.actor.getProperty().setScalarOpacity(labelMap.ofun);
// opacity is applied to entire labelmap
labelMap.actor.getProperty().setOpacity(0.5);

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
reader
  .setUrl(`${__BASE_PATH__}/data/volume/LIDC2.vti`, { loadData: true })
  .then(() => {
    const data = reader.getOutputData();
    image.data = data;

    // set input data
    image.imageMapper.setInputData(data);

    // add actors to renderers
    scene.renderer.addViewProp(image.actor);
    scene.renderer.addViewProp(labelMap.actor);

    // update paint filter
    painter.setBackgroundImage(image.data);
    // don't set to 0, since that's our empty label color from our pwf
    painter.setLabel(1);

    // default slice orientation/mode and camera view
    const sliceMode = vtkImageMapper.SlicingMode.J;
    image.imageMapper.setSlicingMode(sliceMode);
    image.imageMapper.setSlice(0);

    // set 2D camera position
    setCamera(sliceMode, scene.renderer, image.data);

    updateControlPanel(image.imageMapper, data);

    let axis = [0, 0, 0];
    data.indexToWorldVec3([1, 0, 0], axis);
    scene.viewHandle.setXAxis(axis);
    axis = [0, 0, 0];
    data.indexToWorldVec3([0, 1, 0], axis);
    scene.viewHandle.setYAxis(axis);
    axis = [0, 0, 0];
    data.indexToWorldVec3([0, 0, 1], axis);
    scene.viewHandle.setZAxis(axis);

    const update = () => {
      const slicingMode = image.imageMapper.getSlicingMode() % 3;

      if (slicingMode > -1) {
        const ijk = [0, 0, 0];
        const position = [0, 0, 0];
        const normal = [0, 0, 0];

        // position
        ijk[slicingMode] = image.imageMapper.getSlice() + 0.25; // We need the 0.25 to draw the widget in front of the image.
        data.indexToWorldVec3(ijk, position);

        // circle/slice normal
        ijk[slicingMode] = 1;
        data.indexToWorldVec3(ijk, normal);
        vtkMath.subtract(normal, data.getOrigin(), normal);
        vtkMath.normalize(normal);

        rectangleWidget.getManipulator().setOrigin(position);
        rectangleWidget.getManipulator().setNormal(normal);
        scene.viewHandle.setSlicingMode(slicingMode);

        scene.viewHandle.updateRepresentationForRender();

        // update labelMap layer
        labelMap.imageMapper.set(image.imageMapper.get('slice', 'slicingMode'));

        // update UI
        document
          .querySelector('.slice')
          .setAttribute('max', data.getDimensions()[slicingMode] - 1);
      }
    };
    image.imageMapper.onModified(update);
    // trigger initial update
    update();

    readyAll();
  });

// register readyAll to resize event
window.addEventListener('resize', readyAll);
readyAll();

// ----------------------------------------------------------------------------
// UI logic
// ----------------------------------------------------------------------------

document.querySelector('.slice').addEventListener('input', (ev) => {
  image.imageMapper.setSlice(Number(ev.target.value));
});

document.querySelector('.axis').addEventListener('input', (ev) => {
  const sliceMode = 'IJKXYZ'.indexOf(ev.target.value);
  image.imageMapper.setSlicingMode(sliceMode);

  scene.viewHandle.setSlicingMode(sliceMode);

  setCamera(sliceMode, scene.renderer, image.data);
  scene.renderWindow.render();
});

document.querySelector('.focus').addEventListener('click', () => {
  scene.widgetManager.grabFocus(rectangleWidget);
});

// ----------------------------------------------------------------------------
// Painting
// ----------------------------------------------------------------------------

scene.viewHandle.onStartInteractionEvent(() => {
  painter.startStroke();
});

scene.viewHandle.onInteractionEvent(() => {
  const bounds = scene.viewHandle
    .getWidgetState()
    .getRectangleHandle()
    .getBounds();
  const point1 = [bounds[0], bounds[2], bounds[4]];
  const point2 = [bounds[1], bounds[3], bounds[5]];
  painter.paintRectangle(point1, point2);
});

scene.viewHandle.onEndInteractionEvent(() => {
  painter.endStroke();
});
