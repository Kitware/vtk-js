import 'vtk.js/Sources/favicon';

import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkWidgetManager from 'vtk.js/Sources/Widgets/Core/WidgetManager';
import vtkRectangleWidget from 'vtk.js/Sources/Widgets/Widgets3D/RectangleWidget';
import vtkEllipseWidget from 'vtk.js/Sources/Widgets/Widgets3D/EllipseWidget';
import vtkInteractorStyleImage from 'vtk.js/Sources/Interaction/Style/InteractorStyleImage';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkSphere from 'vtk.js/Sources/Common/DataModel/Sphere';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';

import {
  BehaviorCategory,
  ShapeBehavior,
  HorizontalTextPosition,
  VerticalTextPosition,
  computeTextPosition,
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
// Widget manager
// ----------------------------------------------------------------------------

scene.widgetManager = vtkWidgetManager.newInstance();
scene.widgetManager.setRenderer(scene.renderer);

// Widgets
const widgets = {};
widgets.rectangleWidget = vtkRectangleWidget.newInstance({
  resetAfterPointPlacement: false,
  useHandles: true,
});
widgets.ellipseWidget = vtkEllipseWidget.newInstance({
  modifierBehavior: {
    None: {
      [BehaviorCategory.PLACEMENT]:
        ShapeBehavior[BehaviorCategory.PLACEMENT].CLICK_AND_DRAG,
      [BehaviorCategory.POINTS]:
        ShapeBehavior[BehaviorCategory.POINTS].CORNER_TO_CORNER,
      [BehaviorCategory.RATIO]: ShapeBehavior[BehaviorCategory.RATIO].FREE,
    },
  },
  resetAfterPointPlacement: false,
  useHandles: true,
});
widgets.circleWidget = vtkEllipseWidget.newInstance({
  modifierBehavior: {
    None: {
      [BehaviorCategory.PLACEMENT]:
        ShapeBehavior[BehaviorCategory.PLACEMENT].CLICK_AND_DRAG,
      [BehaviorCategory.POINTS]: ShapeBehavior[BehaviorCategory.POINTS].RADIUS,
      [BehaviorCategory.RATIO]: ShapeBehavior[BehaviorCategory.RATIO].FREE,
    },
  },
  resetAfterPointPlacement: false,
  useHandles: true,
});

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

scene.widgetManager.grabFocus(widgets.ellipseWidget);
let activeWidget = 'ellipseWidget';

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

// background image pipeline
image.actor.setMapper(image.imageMapper);

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
    // default slice orientation/mode and camera view
    const sliceMode = vtkImageMapper.SlicingMode.K;
    image.imageMapper.setSlicingMode(sliceMode);
    image.imageMapper.setSlice(0);

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

    scene.rectangleHandle.getRepresentations()[1].setDrawBorder(true);
    scene.rectangleHandle.getRepresentations()[1].setDrawFace(false);
    scene.rectangleHandle.getRepresentations()[1].setOpacity(1);
    scene.circleHandle.getRepresentations()[1].setDrawBorder(true);
    scene.circleHandle.getRepresentations()[1].setDrawFace(false);
    scene.circleHandle.getRepresentations()[1].setOpacity(1);
    scene.ellipseHandle.getRepresentations()[1].setDrawBorder(true);
    scene.ellipseHandle.getRepresentations()[1].setDrawFace(false);
    scene.ellipseHandle.getRepresentations()[1].setOpacity(1);

    scene.rectangleHandle.updateHandlesSize();
    scene.circleHandle.updateHandlesSize();
    scene.ellipseHandle.updateHandlesSize();

    // set text display callback
    scene.ellipseHandle.setLabelTextCallback(
      (worldBounds, screenBounds, labelRep) => {
        const { average, minimum, maximum } = image.data.computeHistogram(
          worldBounds,
          vtkSphere.isPointIn3DEllipse
        );

        const text = `average: ${average.toFixed(
          0
        )} \nmin: ${minimum} \nmax: ${maximum} `;

        const { width, height } = labelRep.computeTextDimensions(text);
        labelRep.setDisplayPosition(
          computeTextPosition(
            screenBounds,
            HorizontalTextPosition.OUTSIDE_RIGHT,
            VerticalTextPosition.INSIDE_TOP,
            width,
            height
          )
        );

        labelRep.setLabelText(text);
      }
    );

    scene.circleHandle.setLabelTextCallback(
      (worldBounds, screenBounds, labelRep) => {
        const center = vtkBoundingBox.getCenter(screenBounds);
        const radius =
          vec3.distance(center, [
            screenBounds[0],
            screenBounds[2],
            screenBounds[4],
          ]) / 2;

        const position = [0, 0, 0];
        vec3.scaleAndAdd(position, center, [1, 1, 1], radius);
        labelRep.setDisplayPosition(position);

        labelRep.setLabelText(
          `radius: ${(
            vec3.distance(
              [worldBounds[0], worldBounds[2], worldBounds[4]],
              [worldBounds[1], worldBounds[3], worldBounds[5]]
            ) / 2
          ).toFixed(2)}`
        );

        labelRep.setTextAlign(TextAlign.CENTER);
        labelRep.setVerticalAlign(VerticalAlign.CENTER);
      }
    );

    scene.rectangleHandle.setLabelTextCallback(
      (worldBounds, screenBounds, labelRep) => {
        const dx = Math.abs(worldBounds[0] - worldBounds[1]);
        const dy = Math.abs(worldBounds[2] - worldBounds[3]);
        const dz = Math.abs(worldBounds[4] - worldBounds[5]);

        const perimeter = 2 * (dx + dy + dz);
        const area = dx * dy + dy * dz + dz * dx;

        const text = `perimeter: ${perimeter.toFixed(
          1
        )}mm\narea: ${area.toFixed(1)}mm²`;

        const { width, height } = labelRep.computeTextDimensions(text);
        labelRep.setDisplayPosition(
          computeTextPosition(
            screenBounds,
            HorizontalTextPosition.OUTSIDE_RIGHT,
            VerticalTextPosition.INSIDE_TOP,
            width,
            height
          )
        );

        labelRep.setTextAlign(TextAlign.RIGHT);
      }
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

        widgets.rectangleWidget.getManipulator().setOrigin(position);
        widgets.rectangleWidget.getManipulator().setNormal(normal);
        widgets.ellipseWidget.getManipulator().setOrigin(position);
        widgets.ellipseWidget.getManipulator().setNormal(normal);
        widgets.circleWidget.getManipulator().setOrigin(position);
        widgets.circleWidget.getManipulator().setNormal(normal);

        scene.rectangleHandle.setSlicingMode(slicingMode);
        scene.ellipseHandle.setSlicingMode(slicingMode);
        scene.circleHandle.setSlicingMode(slicingMode);

        scene.rectangleHandle.updateRepresentationForRender();
        scene.ellipseHandle.updateRepresentationForRender();
        scene.circleHandle.updateRepresentationForRender();

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
  const sliceMode = 'IJKXYZ'.indexOf(ev.target.value) % 3;
  image.imageMapper.setSlicingMode(sliceMode);

  const direction = [0, 0, 0];
  direction[sliceMode] = 1;
  scene.rectangleHandle.setSlicingMode(sliceMode);
  scene.ellipseHandle.setSlicingMode(sliceMode);
  scene.circleHandle.setSlicingMode(sliceMode);

  setCamera(sliceMode, scene.renderer, image.data);
  scene.renderWindow.render();
});

document.querySelector('.widget').addEventListener('input', (ev) => {
  scene.widgetManager.grabFocus(widgets[ev.target.value]);
  activeWidget = ev.target.value;
});

document.querySelector('.reset').addEventListener('click', () => {
  scene.rectangleHandle.reset();
  scene.ellipseHandle.reset();
  scene.circleHandle.reset();
  scene.widgetManager.grabFocus(widgets[activeWidget]);
  scene.renderWindow.render();
});

global.scene = scene;
global.widgets = widgets;
