import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Volume';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

import 'vtk.js/Sources/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import 'vtk.js/Sources/IO/Core/DataAccessHelper/JSZipDataAccessHelper';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';

import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';

import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';

import baseline1 from './testLabelmapOutlineManyRenderer.png';

// This test is mainly the Examples/Rendering/ManyRenderers demo but for labelmapOutlines

const RENDERERS = {};
const glWindowWidth = 400;
const glWindowHeight = 800;

function updateViewPort(element, renderer) {
  const { x, y, width, height } = element.getBoundingClientRect();
  const viewport = [
    x / glWindowWidth,
    1 - (y + height) / glWindowHeight,
    (x + width) / glWindowWidth,
    1 - y / glWindowHeight,
  ];
  renderer.setViewport(...viewport);
}

function recomputeViewports(renderWindow) {
  const rendererElements = document.querySelectorAll('.renderer');
  for (let i = 0; i < rendererElements.length; i++) {
    const elem = rendererElements[i];
    const { id } = elem;
    const renderer = RENDERERS[id];
    updateViewPort(elem, renderer);
  }
  renderWindow.render();
}

function resize(renderWindow, glwindow) {
  // Manually settings the size of the render window since we don't want
  // to compare a rendered image to be page-size dependent since we need
  // to compare the rendered image to a baseline image.
  glwindow.setSize(400, 800);
  recomputeViewports(renderWindow);
}

function createLabelPipeline(backgroundImageData, gc) {
  // Create a labelmap image the same dimensions as our background volume.
  const labelMapData = gc.registerResource(vtkImageData.newInstance());

  const values = new Uint8Array(backgroundImageData.getNumberOfPoints());
  const dataArray = gc.registerResource(
    vtkDataArray.newInstance({
      numberOfComponents: 1, // labelmap with single component
      values,
    })
  );
  labelMapData.getPointData().setScalars(dataArray);

  labelMapData.setDimensions(...backgroundImageData.getDimensions());
  labelMapData.setSpacing(...backgroundImageData.getSpacing());
  labelMapData.setOrigin(...backgroundImageData.getOrigin());
  labelMapData.setDirection(...backgroundImageData.getDirection());

  labelMapData.computeTransforms();

  const labelMap = {
    actor: gc.registerResource(vtkVolume.newInstance()),
    mapper: gc.registerResource(vtkVolumeMapper.newInstance()),
    imageData: labelMapData,
    cfun: vtkColorTransferFunction.newInstance(),
    ofun: vtkPiecewiseFunction.newInstance(),
  };

  // Labelmap pipeline
  labelMap.mapper.setInputData(labelMapData);
  labelMap.actor.setMapper(labelMap.mapper);

  // Set up labelMap color and opacity mapping
  labelMap.cfun.addRGBPoint(1, 1, 0, 0); // label "1" will be red
  labelMap.cfun.addRGBPoint(2, 0, 1, 0); // label "2" will be green
  labelMap.ofun.addPoint(0, 0);
  labelMap.ofun.addPoint(1, 0.5, 0.5, 1.0); // Red will have an opacity of 0.2.
  labelMap.ofun.addPoint(2, 0.5, 0.5, 1.0); // Green will have an opacity of 0.2.
  labelMap.ofun.setClamping(false);

  labelMap.actor.getProperty().setRGBTransferFunction(0, labelMap.cfun);
  labelMap.actor.getProperty().setScalarOpacity(0, labelMap.ofun);
  labelMap.actor.getProperty().setInterpolationTypeToNearest();
  labelMap.actor.getProperty().setUseLabelOutline(true);
  labelMap.actor.getProperty().setLabelOutlineThickness(3);

  return labelMap;
}

function fillBlobForThreshold(imageData, backgroundImageData) {
  const dims = imageData.getDimensions();
  const values = imageData.getPointData().getScalars().getData();

  const backgroundValues = backgroundImageData
    .getPointData()
    .getScalars()
    .getData();
  const size = dims[0] * dims[1] * dims[2];

  // Head
  const headThreshold = [324, 1524];
  for (let i = 0; i < size; i++) {
    if (
      backgroundValues[i] >= headThreshold[0] &&
      backgroundValues[i] < headThreshold[1]
    ) {
      values[i] = 1;
    }
  }

  // Bone
  const boneThreshold = [1200, 2324];
  for (let i = 0; i < size; i++) {
    if (
      backgroundValues[i] >= boneThreshold[0] &&
      backgroundValues[i] < boneThreshold[1]
    ) {
      values[i] = 2;
    }
  }

  imageData.getPointData().getScalars().setData(values);
}

test.skip('Test Labelmap Outline with many renderers', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'LabelmapOutline manyRenderers');

  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
  renderWindow.addView(glwindow);

  // Create some control UI
  const bodyElement = document.querySelector('body');
  bodyElement.style.margin = 0;

  const rootContainer = gc.registerDOMElement(document.createElement('div'));
  rootContainer.style.position = 'fixed';
  rootContainer.style.zIndex = -1;
  rootContainer.style.left = 0;
  rootContainer.style.top = 0;
  rootContainer.style.pointerEvents = 'none';

  bodyElement.appendChild(rootContainer);
  glwindow.setContainer(rootContainer);

  const interactor = gc.registerResource(
    vtkRenderWindowInteractor.newInstance()
  );
  interactor.setView(glwindow);
  interactor.initialize();

  resize(renderWindow, glwindow);

  // ----------------------------------------------------------------------------
  // Renderers
  // ----------------------------------------------------------------------------
  let rendererId = 1;

  const reader = vtkHttpDataSetReader.newInstance({
    fetchGzip: true,
  });

  reader
    .setUrl(`${__BASE_PATH__}/Data/volume/headsq.vti`, { loadData: true })
    .then(() => {
      const data = reader.getOutputData();
      const labelMap = createLabelPipeline(data, gc);
      fillBlobForThreshold(labelMap.imageData, data);

      for (let i = 0; i < 2; i++) {
        const mapper = gc.registerResource(vtkVolumeMapper.newInstance());
        mapper.setInputData(data);
        const el = gc.registerDOMElement(document.createElement('div'));
        el.classList.add('renderer');
        el.style.width = '400px';
        el.style.height = '400px';

        el.id = rendererId++;
        bodyElement.appendChild(el);

        const actor = gc.registerResource(vtkVolume.newInstance());
        actor.getProperty().setInterpolationTypeToNearest();

        actor.setMapper(mapper);

        const ofun = vtkPiecewiseFunction.newInstance();
        ofun.addPoint(0, 0);
        ofun.addPoint(1, 1.0);
        actor.getProperty().setScalarOpacity(0, ofun);

        const sourceDataRGBTransferFunction = actor
          .getProperty()
          .getRGBTransferFunction(0);
        sourceDataRGBTransferFunction.setMappingRange(324, 2324);

        const renderer = gc.registerResource(vtkRenderer.newInstance());
        renderer.addVolume(actor);
        renderer.addVolume(labelMap.actor);

        renderWindow.addRenderer(renderer);
        renderer.resetCamera();

        // MPR slice custom, for some reason doesn't work if we set it as interactorStyle
        const camera = renderer.getActiveCamera();
        const normal = camera.getDirectionOfProjection();
        // prevent zoom manipulator from messing with our focal point
        camera.setFreezeFocalPoint(true);
        vtkMath.normalize(normal);

        const bounds = mapper.getBounds();

        // diagonal will be used as "width" of camera scene
        const diagonal = Math.sqrt(
          vtkMath.distance2BetweenPoints(
            [bounds[0], bounds[2], bounds[4]],
            [bounds[1], bounds[3], bounds[5]]
          )
        );

        // center will be used as initial focal point
        const center = [
          (bounds[0] + bounds[1]) / 2.0,
          (bounds[2] + bounds[3]) / 2.0,
          (bounds[4] + bounds[5]) / 2.0,
        ];

        const angle = 90;
        // distance from camera to focal point
        const dist = diagonal / (2 * Math.tan((angle / 360) * Math.PI));

        const cameraPos = [
          center[0] - normal[0] * dist,
          center[1] - normal[1] * dist,
          center[2] - normal[2] * dist,
        ];

        // set viewUp based on DOP rotation
        const oldDop = camera.getDirectionOfProjection();
        const transform = vtkMatrixBuilder
          .buildFromDegree()
          .identity()
          .rotateFromDirections(oldDop, normal);

        const viewUp = [0, 1, 0];
        transform.apply(viewUp);

        camera.setParallelProjection(true);

        camera.setPosition(...cameraPos);
        camera.setDistance(dist);
        // camera.setFocalPoint(center)
        // should be set after pos and distance
        camera.setDirectionOfProjection(...normal);
        camera.setViewUp(...viewUp);
        camera.setViewAngle(angle);
        camera.setClippingRange(dist, dist + 0.1);
        camera.setParallelScale(20);

        updateViewPort(el, renderer);
        renderer.getActiveCamera().setViewUp(1, 0, 0);
        renderWindow.render();

        // Keep track of renderer
        RENDERERS[el.id] = renderer;
      }

      glwindow.captureNextImage().then((image) => {
        testUtils.compareImages(
          image,
          [baseline1],
          'Rendering/OpenGL/VolumeMapper/testLabelmapOutlineManyRenderer',
          t,
          1.5,
          gc.releaseResources
        );
      });

      recomputeViewports(renderWindow);
    });
});
