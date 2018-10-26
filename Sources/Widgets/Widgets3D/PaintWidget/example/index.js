import 'vtk.js/Sources/favicon';

import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkWidgetManager from 'vtk.js/Sources/Widgets/Core/WidgetManager';
import vtkPaintWidget from 'vtk.js/Sources/Widgets/Widgets3D/PaintWidget';
import vtkInteractorStyleImage from 'vtk.js/Sources/Interaction/Style/InteractorStyleImage';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkPaintFilter from 'vtk.js/Sources/Filters/General/PaintFilter';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';

import { ViewTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

import controlPanel from './controlPanel.html';

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

S.two.viewHandle = S.two.widgetManager.addWidget(paintWidget, ViewTypes.SLICE);
S.three.viewHandle = S.three.widgetManager.addWidget(
  paintWidget,
  ViewTypes.VOLUME
);

S.two.widgetManager.grabFocus(paintWidget);

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
  .setUrl(`${__BASE_PATH__}/data/volume/headsq.vti`, { loadData: true })
  .then(() => {
    const data = reader.getOutputData();
    image.data = data;

    // set input data
    image.imageMapper.setInputData(data);

    // add actors to renderers
    S.two.renderer.addViewProp(image.actor);
    S.two.renderer.addViewProp(labelMap.actor);
    S.three.renderer.addViewProp(image.actor);
    S.three.renderer.addViewProp(labelMap.actor);

    // update paint filter
    painter.setBackgroundImage(image.data);
    // don't set to 0, since that's our empty label color from our pwf
    painter.setLabel(1);
    // set custom threshold
    painter.setVoxelFunc((bgValue, label, idx) => {
      if (bgValue > 145) {
        return label;
      }
      return null;
    });

    // default slice orientation/mode and camera view
    const sliceMode = vtkImageMapper.SlicingMode.K;
    image.imageMapper.setSlicingMode(sliceMode);
    image.imageMapper.setSlice(0);

    // set 2D camera position
    setCamera(sliceMode, S.two.renderer, image.data);

    updateControlPanel(image.imageMapper, data);

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

        paintWidget.getManipulator().setOrigin(position);
        paintWidget.getManipulator().setNormal(normal);
        const handle = paintWidget.getWidgetState().getHandle();
        handle.rotateFromDirections(handle.getDirection(), normal);

        // update labelMap layer
        labelMap.imageMapper.set(image.imageMapper.get('slice', 'slicingMode'));

        // update UI
        document
          .querySelector('.slice')
          .setAttribute('max', data.getDimensions()[slicingMode]);
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

// not sure why I need to trigger this.
// window.dispatchEvent(new Event('resize'));

// ----------------------------------------------------------------------------
// UI logic
// ----------------------------------------------------------------------------

document.querySelector('.radius').addEventListener('input', (ev) => {
  const r = Number(ev.target.value);

  paintWidget.setRadius(r);
  painter.setRadius(r);
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

document.querySelector('.undo').addEventListener('click', () => {
  painter.undo();
});

document.querySelector('.redo').addEventListener('click', () => {
  painter.redo();
});

// ----------------------------------------------------------------------------
// Painting
// ----------------------------------------------------------------------------

S.two.viewHandle.onStartInteractionEvent(() => {
  painter.startStroke();
  painter.addPoint(paintWidget.getWidgetState().getTrueOrigin());
});

S.two.viewHandle.onInteractionEvent(() => {
  if (S.two.viewHandle.getPainting()) {
    painter.addPoint(paintWidget.getWidgetState().getTrueOrigin());
  }
});

S.two.viewHandle.onEndInteractionEvent(() => {
  painter.endStroke();
});
