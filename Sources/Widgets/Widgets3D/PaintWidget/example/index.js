import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/All';

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

// Force the loading of HttpDataAccessHelper to support gzip decompression
import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper';

import {
  BehaviorCategory,
  ShapeBehavior,
} from 'vtk.js/Sources/Widgets/Widgets3D/ShapeWidget/Constants';

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
scene.apiSpecificRenderWindow = scene.fullScreenRenderer
  .getInteractor()
  .getView();
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
  data.indexToWorld(ijk, focalPoint);
  ijk[sliceMode] = 1;
  data.indexToWorld(ijk, position);
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
widgets.rectangleWidget = vtkRectangleWidget.newInstance({
  resetAfterPointPlacement: true,
});
widgets.ellipseWidget = vtkEllipseWidget.newInstance({
  resetAfterPointPlacement: true,
});
widgets.circleWidget = vtkEllipseWidget.newInstance({
  resetAfterPointPlacement: true,
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
widgets.splineWidget = vtkSplineWidget.newInstance({
  resetAfterPointPlacement: true,
});
widgets.polygonWidget = vtkSplineWidget.newInstance({
  resetAfterPointPlacement: true,
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
  document.querySelector('.slice').setAttribute('min', extent[slicingMode * 2]);
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

    // set text display callback
    scene.circleHandle.onInteractionEvent(() => {
      const worldBounds = scene.circleHandle.getBounds();

      const text = `radius: ${(
        vec3.distance(
          [worldBounds[0], worldBounds[2], worldBounds[4]],
          [worldBounds[1], worldBounds[3], worldBounds[5]]
        ) / 2
      ).toFixed(2)}`;
      widgets.circleWidget.getWidgetState().getText().setText(text);
    });

    scene.splineHandle.setHandleSizeInPixels(
      2 * Math.max(...image.data.getSpacing())
    );
    scene.splineHandle.setFreehandMinDistance(
      4 * Math.max(...image.data.getSpacing())
    );

    scene.polygonHandle.setHandleSizeInPixels(
      2 * Math.max(...image.data.getSpacing())
    );
    scene.polygonHandle.setFreehandMinDistance(
      4 * Math.max(...image.data.getSpacing())
    );

    const update = () => {
      const slicingMode = image.imageMapper.getSlicingMode() % 3;

      if (slicingMode > -1) {
        const ijk = [0, 0, 0];
        const position = [0, 0, 0];

        // position
        ijk[slicingMode] = image.imageMapper.getSlice();
        data.indexToWorld(ijk, position);

        widgets.paintWidget.getManipulator().setUserOrigin(position);
        widgets.rectangleWidget.getManipulator().setUserOrigin(position);
        widgets.ellipseWidget.getManipulator().setUserOrigin(position);
        widgets.circleWidget.getManipulator().setUserOrigin(position);
        widgets.splineWidget.getManipulator().setUserOrigin(position);
        widgets.polygonWidget.getManipulator().setUserOrigin(position);

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
  scene.paintHandle.getWidgetState().getHandle().setDirection(direction);

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

scene.paintHandle.onStartInteractionEvent(() => {
  painter.startStroke();
  painter.addPoint(widgets.paintWidget.getWidgetState().getTrueOrigin());
});

scene.paintHandle.onInteractionEvent(() => {
  painter.addPoint(widgets.paintWidget.getWidgetState().getTrueOrigin());
});
initializeHandle(scene.paintHandle);

scene.rectangleHandle.onEndInteractionEvent(() => {
  const rectangleHandle = scene.rectangleHandle
    .getWidgetState()
    .getRectangleHandle();

  const origin = rectangleHandle.getOrigin();
  const corner = rectangleHandle.getCorner();

  if (origin && corner) {
    painter.paintRectangle(origin, corner);
  }
});
initializeHandle(scene.rectangleHandle);

scene.ellipseHandle.onEndInteractionEvent(() => {
  const center = scene.ellipseHandle
    .getWidgetState()
    .getEllipseHandle()
    .getOrigin();
  const point2 = scene.ellipseHandle
    .getWidgetState()
    .getPoint2Handle()
    .getOrigin();

  if (center && point2) {
    let corner = [];
    if (
      scene.ellipseHandle.isBehaviorActive(
        BehaviorCategory.RATIO,
        ShapeBehavior[BehaviorCategory.RATIO].FIXED
      )
    ) {
      const radius = vec3.distance(center, point2);
      corner = [radius, radius, radius];
    } else {
      corner = [
        center[0] - point2[0],
        center[1] - point2[1],
        center[2] - point2[2],
      ];
    }

    painter.paintEllipse(center, corner);
  }
});
initializeHandle(scene.ellipseHandle);

scene.circleHandle.onEndInteractionEvent(() => {
  const center = scene.circleHandle
    .getWidgetState()
    .getEllipseHandle()
    .getOrigin();
  const point2 = scene.circleHandle
    .getWidgetState()
    .getPoint2Handle()
    .getOrigin();

  if (center && point2) {
    const radius = vec3.distance(center, point2);
    const corner = [radius, radius, radius];

    painter.paintEllipse(center, corner);
  }
});
initializeHandle(scene.circleHandle);

scene.splineHandle.onEndInteractionEvent(() => {
  const points = scene.splineHandle.getPoints();
  painter.paintPolygon(points);

  scene.splineHandle.updateRepresentationForRender();
});
initializeHandle(scene.splineHandle);

scene.polygonHandle.onEndInteractionEvent(() => {
  const points = scene.polygonHandle.getPoints();
  painter.paintPolygon(points);

  scene.polygonHandle.updateRepresentationForRender();
});
initializeHandle(scene.polygonHandle);
