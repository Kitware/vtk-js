import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/All';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';
import vtkPaintWidget from '@kitware/vtk.js/Widgets/Widgets3D/PaintWidget';
import vtkRectangleWidget from '@kitware/vtk.js/Widgets/Widgets3D/RectangleWidget';
import vtkEllipseWidget from '@kitware/vtk.js/Widgets/Widgets3D/EllipseWidget';
import vtkSplineWidget from '@kitware/vtk.js/Widgets/Widgets3D/SplineWidget';
import vtkInteractorStyleImage from '@kitware/vtk.js/Interaction/Style/InteractorStyleImage';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkImageMapper from '@kitware/vtk.js/Rendering/Core/ImageMapper';
import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice';
import vtkPaintFilter from '@kitware/vtk.js/Filters/General/PaintFilter';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';

// Force the loading of HttpDataAccessHelper to support gzip decompression
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';

import {
  BehaviorCategory,
  ShapeBehavior,
} from '@kitware/vtk.js/Widgets/Widgets3D/ShapeWidget/Constants';

import { ViewTypes } from '@kitware/vtk.js/Widgets/Core/WidgetManager/Constants';

import { vec3 } from 'gl-matrix';

import GUI from 'lil-gui';

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

let sliceCtrl;

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

        // update UI (slice control max)
        sliceCtrl.max(data.getDimensions()[slicingMode] - 1);
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
// UI logic (lil-gui)
// ----------------------------------------------------------------------------

const guiParams = {
  radius: widgets.paintWidget.getRadius ? widgets.paintWidget.getRadius() : 10,
  slice: 0,
  axis: 'K',
  widget: 'paintWidget',
  operation: 'draw',
};

const gui = new GUI();

gui
  .add(guiParams, 'radius', 1, 50, 1)
  .name('Radius')
  .onChange((r) => {
    widgets.paintWidget.setRadius(r);
    painter.setRadius(r);
  });

sliceCtrl = gui
  .add(guiParams, 'slice', 0, 0, 1)
  .name('Slice')
  .onChange((value) => {
    image.imageMapper.setSlice(Number(value));
  });

gui
  .add(guiParams, 'axis', ['I', 'J', 'K'])
  .name('Axis')
  .onChange((value) => {
    const sliceMode = 'IJK'.indexOf(value);
    image.imageMapper.setSlicingMode(sliceMode);
    painter.setSlicingMode(sliceMode);

    const direction = [0, 0, 0];
    direction[sliceMode] = 1;
    scene.paintHandle.getWidgetState().getHandle().setDirection(direction);

    setCamera(sliceMode, scene.renderer, image.data);
    scene.renderWindow.render();
  });

gui
  .add(guiParams, 'widget', ['paintWidget', 'splineWidget', 'polygonWidget'])
  .name('Widget')
  .onChange((value) => {
    activeWidget = value;
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

gui
  .add(guiParams, 'operation', ['draw', 'erase'])
  .name('Operation')
  .onChange((mode) => {
    painter.setDrawStencil(mode === 'draw');
    painter.setErase(mode === 'erase');
  });

gui
  .add(
    {
      focus: () => scene.widgetManager.grabFocus(widgets[activeWidget]),
    },
    'focus'
  )
  .name('Grab focus');

gui
  .add(
    {
      undo: () => painter.undo(),
    },
    'undo'
  )
  .name('Undo');

gui
  .add(
    {
      redo: () => painter.redo(),
    },
    'redo'
  )
  .name('Redo');

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
