import 'vtk.js/Sources/favicon';

import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkWidgetManager from 'vtk.js/Sources/Widgets/Core/WidgetManager';
import vtkPaintWidget from 'vtk.js/Sources/Widgets/Widgets3D/PaintWidget';
import vtkRectangleWidget from 'vtk.js/Sources/Widgets/Widgets3D/RectangleWidget';
import vtkEllipseWidget from 'vtk.js/Sources/Widgets/Widgets3D/EllipseWidget';
import vtkSplineWidget from 'vtk.js/Sources/Widgets/Widgets3D/SplineWidget';
import vtkInteractorStyleImage from 'vtk.js/Sources/Interaction/Style/InteractorStyleImage';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkPaintFilter from 'vtk.js/Sources/Filters/General/PaintFilter';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';

import {
  BehaviorCategory,
  ShapeBehavior,
} from 'vtk.js/Sources/Widgets/Widgets3D/ShapeWidget/Constants';
import {
  TextAlign,
  VerticalAlign,
} from 'vtk.js/Sources/Interaction/Widgets/LabelRepresentation/Constants';

import { ViewTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

import { vec3 } from 'gl-matrix';

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
// Widget manager and vtkPaintFilter
// ----------------------------------------------------------------------------

scene.widgetManager = vtkWidgetManager.newInstance();
scene.widgetManager.setRenderer(scene.renderer);

// Widgets
const widgets = {};
widgets.paintWidget = vtkPaintWidget.newInstance();
widgets.rectangleWidget = vtkRectangleWidget.newInstance();
widgets.ellipseWidget = vtkEllipseWidget.newInstance();
widgets.circleWidget = vtkEllipseWidget.newInstance({
  modifierBehavior: {
    None: {
      [BehaviorCategory.PLACEMENT]:
        ShapeBehavior[BehaviorCategory.PLACEMENT].CLICK_AND_DRAG,
      [BehaviorCategory.POINTS]: ShapeBehavior[BehaviorCategory.POINTS].RADIUS,
      [BehaviorCategory.RATIO]: ShapeBehavior[BehaviorCategory.RATIO].FREE,
    },
    Control: {
      [BehaviorCategory.POINTS]:
        ShapeBehavior[BehaviorCategory.POINTS].DIAMETER,
    },
  },
});
widgets.splineWidget = vtkSplineWidget.newInstance();
widgets.polygonWidget = vtkSplineWidget.newInstance({
  resolution: 1,
});

scene.paintHandle = scene.widgetManager.addWidget(
  widgets.paintWidget,
  ViewTypes.SLICE
);
scene.rectangleHandle = scene.widgetManager.addWidget(
  widgets.rectangleWidget,
  ViewTypes.SLICE
);
scene.ellipseHandle = scene.widgetManager.addWidget(
  widgets.ellipseWidget,
  ViewTypes.SLICE
);
scene.circleHandle = scene.widgetManager.addWidget(
  widgets.circleWidget,
  ViewTypes.SLICE
);
scene.splineHandle = scene.widgetManager.addWidget(
  widgets.splineWidget,
  ViewTypes.SLICE
);
scene.polygonHandle = scene.widgetManager.addWidget(
  widgets.polygonWidget,
  ViewTypes.SLICE
);

scene.splineHandle.setOutputBorder(true);
scene.polygonHandle.setOutputBorder(true);

scene.widgetManager.grabFocus(widgets.paintWidget);
let activeWidget = 'paintWidget';

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
labelMap.actor.getProperty().setPiecewiseFunction(labelMap.ofun);
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
    // set custom threshold
    // painter.setVoxelFunc((bgValue, idx) => bgValue < 145);

    // default slice orientation/mode and camera view
    const sliceMode = vtkImageMapper.SlicingMode.K;
    image.imageMapper.setSlicingMode(sliceMode);
    image.imageMapper.setSlice(0);
    painter.setSlicingMode(sliceMode);

    // set 2D camera position
    setCamera(sliceMode, scene.renderer, image.data);

    updateControlPanel(image.imageMapper, data);

    // give axis information to widgets
    let axis = [0, 0, 0];
    data.indexToWorldVec3([1, 0, 0], axis);
    scene.rectangleHandle.setXAxis(axis);
    scene.ellipseHandle.setXAxis(axis);
    scene.circleHandle.setXAxis(axis);
    axis = [0, 0, 0];
    data.indexToWorldVec3([0, 1, 0], axis);
    scene.rectangleHandle.setYAxis(axis);
    scene.ellipseHandle.setYAxis(axis);
    scene.circleHandle.setYAxis(axis);
    axis = [0, 0, 0];
    data.indexToWorldVec3([0, 0, 1], axis);
    scene.rectangleHandle.setZAxis(axis);
    scene.ellipseHandle.setZAxis(axis);
    scene.circleHandle.setZAxis(axis);

    scene.circleHandle.setLabelTextCallback((worldBounds, screenBounds) => {
      const center = vtkBoundingBox.getCenter(screenBounds);
      const radius =
        vec3.distance(center, [
          screenBounds[0],
          screenBounds[2],
          screenBounds[4],
        ]) / 2;
      const position = [0, 0, 0];
      vec3.scaleAndAdd(position, center, [1, 1, 1], radius);

      return {
        text: `radius: ${(
          vec3.distance(
            [worldBounds[0], worldBounds[2], worldBounds[4]],
            [worldBounds[1], worldBounds[3], worldBounds[5]]
          ) / 2
        ).toFixed(2)}`,
        position,
        textAlign: TextAlign.CENTER,
        verticalAlign: VerticalAlign.CENTER,
      };
    });

    scene.splineHandle
      .getWidgetState()
      .getMoveHandle()
      .setScale1(2 * Math.max(...image.data.getSpacing()));
    scene.splineHandle.setFreehandMinDistance(
      4 * Math.max(...image.data.getSpacing())
    );

    scene.polygonHandle
      .getWidgetState()
      .getMoveHandle()
      .setScale1(2 * Math.max(...image.data.getSpacing()));
    scene.polygonHandle.setFreehandMinDistance(
      4 * Math.max(...image.data.getSpacing())
    );

    const update = () => {
      const slicingMode = image.imageMapper.getSlicingMode() % 3;

      if (slicingMode > -1) {
        const ijk = [0, 0, 0];
        const position = [0, 0, 0];
        const normal = [0, 0, 0];

        // position
        ijk[slicingMode] = image.imageMapper.getSlice();
        data.indexToWorldVec3(ijk, position);

        // circle/slice normal
        ijk[slicingMode] = 1;
        data.indexToWorldVec3(ijk, normal);
        vtkMath.subtract(normal, data.getOrigin(), normal);
        vtkMath.normalize(normal);

        widgets.paintWidget.getManipulator().setOrigin(position);
        widgets.paintWidget.getManipulator().setNormal(normal);
        widgets.rectangleWidget.getManipulator().setOrigin(position);
        widgets.rectangleWidget.getManipulator().setNormal(normal);
        widgets.ellipseWidget.getManipulator().setOrigin(position);
        widgets.ellipseWidget.getManipulator().setNormal(normal);
        widgets.circleWidget.getManipulator().setOrigin(position);
        widgets.circleWidget.getManipulator().setNormal(normal);
        widgets.splineWidget.getManipulator().setOrigin(position);
        widgets.splineWidget.getManipulator().setNormal(normal);
        widgets.polygonWidget.getManipulator().setOrigin(position);
        widgets.polygonWidget.getManipulator().setNormal(normal);

        scene.rectangleHandle.setSlicingMode(slicingMode);
        scene.ellipseHandle.setSlicingMode(slicingMode);
        scene.circleHandle.setSlicingMode(slicingMode);
        painter.setSlicingMode(slicingMode);

        scene.paintHandle.updateRepresentationForRender();
        scene.rectangleHandle.updateRepresentationForRender();
        scene.ellipseHandle.updateRepresentationForRender();
        scene.circleHandle.updateRepresentationForRender();
        scene.splineHandle.updateRepresentationForRender();
        scene.polygonHandle.updateRepresentationForRender();

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

document.querySelector('.radius').addEventListener('input', (ev) => {
  const r = Number(ev.target.value);

  widgets.paintWidget.setRadius(r);
  painter.setRadius(r);
});

document.querySelector('.slice').addEventListener('input', (ev) => {
  image.imageMapper.setSlice(Number(ev.target.value));
});

document.querySelector('.axis').addEventListener('input', (ev) => {
  const sliceMode = 'IJKXYZ'.indexOf(ev.target.value) % 3;
  image.imageMapper.setSlicingMode(sliceMode);
  painter.setSlicingMode(sliceMode);

  const direction = [0, 0, 0];
  direction[sliceMode] = 1;
  scene.paintHandle
    .getWidgetState()
    .getHandle()
    .setDirection(direction);
  scene.rectangleHandle.setSlicingMode(sliceMode);
  scene.ellipseHandle.setSlicingMode(sliceMode);
  scene.circleHandle.setSlicingMode(sliceMode);

  setCamera(sliceMode, scene.renderer, image.data);
  scene.renderWindow.render();
});

document.querySelector('.widget').addEventListener('input', (ev) => {
  activeWidget = ev.target.value;
  scene.widgetManager.grabFocus(widgets[activeWidget]);

  scene.paintHandle.setVisibility(activeWidget === 'paintWidget');
  scene.paintHandle.updateRepresentationForRender();

  scene.splineHandle.reset();
  scene.splineHandle.setVisibility(activeWidget === 'splineWidget');
  scene.splineHandle.updateRepresentationForRender();

  scene.polygonHandle.reset();
  scene.polygonHandle.setVisibility(activeWidget === 'polygonWidget');
  scene.polygonHandle.updateRepresentationForRender();
});

document.querySelector('.focus').addEventListener('click', () => {
  scene.widgetManager.grabFocus(widgets[activeWidget]);
});

document.querySelector('.undo').addEventListener('click', () => {
  painter.undo();
});

document.querySelector('.redo').addEventListener('click', () => {
  painter.redo();
});

// ----------------------------------------------------------------------------
// Painting
// ----------------------------------------------------------------------------

function initializeHandle(handle) {
  handle.onStartInteractionEvent(() => {
    painter.startStroke();
  });

  handle.onEndInteractionEvent(() => {
    painter.endStroke();
  });
}

initializeHandle(scene.paintHandle);

scene.paintHandle.onStartInteractionEvent(() => {
  painter.startStroke();
  painter.addPoint(widgets.paintWidget.getWidgetState().getTrueOrigin());
});

scene.paintHandle.onInteractionEvent(() => {
  painter.addPoint(widgets.paintWidget.getWidgetState().getTrueOrigin());
});

initializeHandle(scene.rectangleHandle);

scene.rectangleHandle.onInteractionEvent(() => {
  const bounds = scene.rectangleHandle
    .getWidgetState()
    .getRectangleHandle()
    .getBounds();
  const point1 = [bounds[0], bounds[2], bounds[4]];
  const point2 = [bounds[1], bounds[3], bounds[5]];
  painter.paintRectangle(point1, point2);
});

initializeHandle(scene.ellipseHandle);

scene.ellipseHandle.onInteractionEvent(() => {
  const center = scene.ellipseHandle
    .getWidgetState()
    .getEllipseHandle()
    .getOrigin();
  const scale3 = scene.ellipseHandle
    .getWidgetState()
    .getEllipseHandle()
    .getScale3();
  painter.paintEllipse(center, scale3);
});

initializeHandle(scene.circleHandle);

scene.circleHandle.onInteractionEvent(() => {
  const center = scene.circleHandle
    .getWidgetState()
    .getEllipseHandle()
    .getOrigin();
  const scale3 = scene.circleHandle
    .getWidgetState()
    .getEllipseHandle()
    .getScale3();
  painter.paintEllipse(center, scale3);
});

scene.splineHandle.onStartInteractionEvent(() => {
  painter.startStroke();
});

scene.splineHandle.onEndInteractionEvent(() => {
  const points = scene.splineHandle.getPoints();
  painter.paintPolygon(points);
  painter.endStroke();

  scene.splineHandle.reset();
  scene.splineHandle.updateRepresentationForRender();
  scene.widgetManager.grabFocus(widgets.splineWidget);
});

scene.polygonHandle.onStartInteractionEvent(() => {
  painter.startStroke();
});

scene.polygonHandle.onEndInteractionEvent(() => {
  const points = scene.polygonHandle.getPoints();
  painter.paintPolygon(points);
  painter.endStroke();

  scene.polygonHandle.reset();
  scene.polygonHandle.updateRepresentationForRender();
  scene.widgetManager.grabFocus(widgets.polygonWidget);
});
