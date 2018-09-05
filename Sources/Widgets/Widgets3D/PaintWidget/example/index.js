import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkWidgetManager from 'vtk.js/Sources/Widgets/Core/WidgetManager';
import vtkPaintWidget from 'vtk.js/Sources/Widgets/Widgets3D/PaintWidget';
import vtkInteractorStyleImage from 'vtk.js/Sources/Interaction/Style/InteractorStyleImage';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';

import { ViewTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

import controlPanel from './controlPanel.html';
import vtkPaintFilter from '../PaintFilter';

const bodyStyles = {
  display: 'flex',
  flexFlow: 'row',
};

function applyStyle(el, style) {
  Object.keys(style).forEach((key) => {
    el.style[key] = style[key];
  });
}

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

function createFullScreenRenderer(scope, opts) {
  scope.root = document.body;

  scope.fullScreenRenderer = vtkFullScreenRenderWindow.newInstance(
    Object.assign({ rootContainer: scope.root }, opts)
  );

  applyStyle(scope.fullScreenRenderer.getContainer(), {
    margin: null,
    padding: null,
    position: null,
    top: null,
    left: null,
    width: '800px',
    height: null,
    overflow: null,
  });

  scope.renderer = scope.fullScreenRenderer.getRenderer();
  scope.renderWindow = scope.fullScreenRenderer.getRenderWindow();
  scope.openGLRenderWindow = scope.fullScreenRenderer.getOpenGLRenderWindow();
  scope.camera = scope.renderer.getActiveCamera();
}

applyStyle(document.body, bodyStyles);

// scenes
const S = { two: {}, three: {} };

createFullScreenRenderer(S.two, { background: [0.1, 0.1, 0.1] });
createFullScreenRenderer(S.three, { background: [0.2, 0.2, 0.2] });

// setup 2D view
S.two.camera.setParallelProjection(true);
S.two.iStyle = vtkInteractorStyleImage.newInstance();
S.two.iStyle.setInteractionMode('IMAGE_SLICING');
S.two.renderWindow.getInteractor().setInteractorStyle(S.two.iStyle);
S.two.fullScreenRenderer.addController(controlPanel);

// Link animation events
function linkInteractors(scope1, scope2) {
  const i1 = scope1.renderWindow.getInteractor();
  const i2 = scope2.renderWindow.getInteractor();
  const sync = {};

  let src = null;

  function linkOneWay(from, to) {
    from.onStartAnimation(() => {
      if (!src) {
        src = from;
        to.requestAnimation(sync);
      }
    });

    from.onEndAnimation(() => {
      if (src === from) {
        src = null;
        to.cancelAnimation(sync);
        // roughly wait for widgetManager.capture() to finish
        setTimeout(to.render, 1000);
      }
    });
  }

  linkOneWay(i1, i2);
  linkOneWay(i2, i1);
}

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

// should occur before widgetManager.grabFocus
linkInteractors(S.two, S.three);

// ----------------------------------------------------------------------------
// Widget manager and vtkPaintFilter
// ----------------------------------------------------------------------------

function setupWidgetManager(scope) {
  scope.widgetManager = vtkWidgetManager.newInstance();
  scope.widgetManager.setRenderer(scope.renderer);
}

setupWidgetManager(S.two);
setupWidgetManager(S.three);

// Widget
const paintWidget = vtkPaintWidget.newInstance();
const painter = vtkPaintFilter.newInstance();

S.two.viewHandle = S.two.widgetManager.addWidget(paintWidget, ViewTypes.SLICE);
S.three.viewHandle = S.three.widgetManager.addWidget(
  paintWidget,
  ViewTypes.VOLUME
);

S.two.widgetManager.grabFocus(paintWidget);

// ready code
function ready(scope, picking = false) {
  scope.renderer.resetCamera();
  scope.fullScreenRenderer.resize();
  if (picking) {
    scope.widgetManager.enablePicking();
  } else {
    scope.widgetManager.disablePicking();
  }
}

// ----------------------------------------------------------------------------
// Ready logic
// ----------------------------------------------------------------------------

function readyAll() {
  ready(S.two, true);
  ready(S.three, false);
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

const image = {};
image.imageMapper = vtkImageMapper.newInstance();
image.actor = vtkImageSlice.newInstance();
image.imageMapper.setInputConnection(painter.getOutputPort(0));
image.actor.setMapper(image.imageMapper);

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
reader
  .setUrl(`${__BASE_PATH__}/data/volume/headsq.vti`, { loadData: true })
  .then(() => {
    const data = reader.getOutputData();
    image.data = data;

    painter.setBackgroundImage(image.data);
    painter.setColor([210]);

    // default slice orientation/mode and camera view
    const sliceMode = vtkImageMapper.SlicingMode.K;

    image.imageMapper.setSlicingMode(sliceMode);
    image.imageMapper.setSlice(0);

    // set 2D camera position
    setCamera(sliceMode, S.two.renderer, image.data);

    // add image/volume to renderers
    S.two.renderer.addViewProp(image.actor);
    S.three.renderer.addViewProp(image.actor);

    updateControlPanel(image.imageMapper, data);

    image.imageMapper.onModified(() => {
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

        paintWidget.getManipulator().setOrigin(position);
        paintWidget.getManipulator().setNormal(position);
        const handle = paintWidget.getWidgetState().getHandle();
        handle.rotateFromDirections(handle.getDirection(), normal);

        // update UI
        document
          .querySelector('.slice')
          .setAttribute('max', data.getDimensions()[slicingMode]);
      }
    });

    readyAll();
  });

// register readyAll to resize event
window.addEventListener('resize', readyAll);
readyAll();

// not sure why I need to trigger this.
// window.dispatchEvent(new Event('resize'));

// ----------------------------------------------------------------------------
// UI logic
// ----------------------------------------------------------------------------

document.querySelector('.radius').addEventListener('input', (ev) => {
  const r = Number(ev.target.value);
  const spacing = image.data.getSpacing();

  paintWidget.setRadius(r);
  painter.setRadius(spacing.map((s) => r / s));
});

document.querySelector('.slice').addEventListener('input', (ev) => {
  image.imageMapper.setSlice(Number(ev.target.value));
});

document.querySelector('.axis').addEventListener('input', (ev) => {
  const sliceMode = 'IJKXYZ'.indexOf(ev.target.value);
  image.imageMapper.setSlicingMode(sliceMode);

  setCamera(sliceMode, S.two.renderer, image.data);
  S.two.renderWindow.render();
});

// ----------------------------------------------------------------------------
// Painting
// ----------------------------------------------------------------------------

const points = [];

S.two.viewHandle.onStartInteractionEvent(() => {
  points.length = 0;
  points.push(paintWidget.getWidgetState().getTrueOrigin());
});

S.two.viewHandle.onInteractionEvent(() => {
  if (S.two.viewHandle.getPainting()) {
    points.push(paintWidget.getWidgetState().getTrueOrigin());
  }
});

S.two.viewHandle.onEndInteractionEvent(() => {
  if (points.length) {
    painter.paintWorldPoints(points);
  }
});
