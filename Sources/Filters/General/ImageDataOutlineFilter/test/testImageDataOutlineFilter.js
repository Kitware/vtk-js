import test from 'tape';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';

import { mat4 } from 'gl-matrix';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkImageResliceMapper from 'vtk.js/Sources/Rendering/Core/ImageResliceMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkOutlineFilter from 'vtk.js/Sources/Filters/General/OutlineFilter';
import vtkImageDataOutlineFilter from 'vtk.js/Sources/Filters/General/ImageDataOutlineFilter';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkRTAnalyticSource from 'vtk.js/Sources/Filters/Sources/RTAnalyticSource';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';

import baselineFaces from './testImageDataOutlineFilter_Faces.png';
import baselineLines from './testImageDataOutlineFilter_Lines.png';

test.onlyIfWebGL('Test ImageDataOutlineFilter', (t) => {
  const gc = testUtils.createGarbageCollector(t);

  // Create some control UI
  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(
    document.createElement('div')
  );
  container.appendChild(renderWindowContainer);

  // create what we will view
  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  const renderer = gc.registerResource(vtkRenderer.newInstance());
  renderWindow.addRenderer(renderer);
  renderer.setBackground(0.32, 0.34, 0.43);

  // ----------------------------------------------------------------------------
  // Test code
  // ----------------------------------------------------------------------------

  const dir = mat4.fromRotation(
    mat4.create(),
    vtkMath.radiansFromDegrees(30),
    [0.3333, 0.3333, 0.3333]
  );

  const dataDirection = [
    ...dir.slice(0, 3),
    ...dir.slice(4, 7),
    ...dir.slice(8, 11),
  ];

  const rtSource = vtkRTAnalyticSource.newInstance({
    dataDirection,
  });
  rtSource.setWholeExtent(0, 199, 0, 199, 0, 199);
  rtSource.setCenter(100, 100, 100);

  const mapper = gc.registerResource(vtkImageResliceMapper.newInstance());
  mapper.setInputConnection(rtSource.getOutputPort());

  const slicePlane = gc.registerResource(vtkPlane.newInstance());
  slicePlane.setOrigin(0, 100, 10);
  slicePlane.setNormal(0.1, 0.8, 0.3);
  mapper.setSlicePlane(slicePlane);

  const actor = gc.registerResource(vtkImageSlice.newInstance());
  actor.setMapper(mapper);
  renderer.addActor(actor);

  const ppty = actor.getProperty();
  ppty.setColorWindow(255);
  ppty.setColorLevel(127.5);
  ppty.setIndependentComponents(true);

  const rgb = gc.registerResource(vtkColorTransferFunction.newInstance());
  rgb.addRGBPoint(0, 0, 0, 0);
  rgb.addRGBPoint(255, 1, 1, 1);
  ppty.setRGBTransferFunction(rgb);

  const ofun = gc.registerResource(vtkPiecewiseFunction.newInstance());
  ofun.addPoint(0, 1);
  ofun.addPoint(150, 1);
  ofun.addPoint(180, 0);
  ofun.addPoint(255, 0);
  ppty.setPiecewiseFunction(ofun);

  const oline = gc.registerResource(vtkOutlineFilter.newInstance());
  oline.setInputConnection(rtSource.getOutputPort());
  const omapper = gc.registerResource(vtkMapper.newInstance());
  omapper.setInputConnection(oline.getOutputPort());
  const oactor = gc.registerResource(vtkActor.newInstance());
  oactor.setMapper(omapper);
  oactor.getProperty().setLineWidth(3);
  oactor.getProperty().setColor([0, 1, 0]);
  renderer.addActor(oactor);

  const idoline = gc.registerResource(vtkImageDataOutlineFilter.newInstance());
  idoline.setInputConnection(rtSource.getOutputPort());
  const idomapper = gc.registerResource(vtkMapper.newInstance());
  idomapper.setInputConnection(idoline.getOutputPort());
  const idoactor = gc.registerResource(vtkActor.newInstance());
  idoactor.setMapper(idomapper);
  idoactor.getProperty().setLineWidth(3);
  idoactor.getProperty().setColor([1, 1, 0]);
  idoactor.getProperty().setEdgeColor([1, 1, 0]);
  renderer.addActor(idoactor);

  renderer.resetCamera();
  renderWindow.render();

  // -----------------------------------------------------------
  // Make some variables global so that you can inspect and
  // modify objects in your browser's developer console:
  // -----------------------------------------------------------
  global.actor = actor;
  global.mapper = mapper;
  global.oactor = oactor;
  global.omapper = omapper;
  global.idoline = idoline;
  global.idoactor = idoactor;
  global.idomapper = idomapper;
  global.rgb = rgb;
  global.ofun = ofun;

  // create something to view it
  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  function testImageDataOutlineAsLines() {
    t.comment(
      'testImageDataOutlineAsLines(): generateLines=true, generateFaces=false'
    );

    idoline.setGenerateLines(true);
    idoline.setGenerateFaces(false);

    let resolve;
    const promise = new Promise((res) => {
      resolve = res;
    });

    glwindow.captureNextImage().then((image) => {
      testUtils.compareImages(
        image,
        [baselineLines],
        'Filters/General/ImageDataOutlineFilter_Lines',
        t,
        1,
        resolve
      );
    });

    renderWindow.render();
    return promise;
  }

  function testImageDataOutlineAsFaces() {
    t.comment(
      'testImageDataOutlineAsFaces(): generateLines=false, generateFaces=true'
    );

    // now test face generation
    idoline.setGenerateLines(false);
    idoline.setGenerateFaces(true);

    let resolve;
    const promise = new Promise((res) => {
      resolve = res;
    });

    glwindow.captureNextImage().then((image) => {
      testUtils.compareImages(
        image,
        [baselineFaces],
        'Filters/General/ImageDataOutlineFilter_Faces',
        t,
        1,
        resolve
      );
    });

    renderWindow.render();
    return promise;
  }

  return [
    testImageDataOutlineAsLines,
    testImageDataOutlineAsFaces,
    gc.releaseResources,
  ].reduce((current, next) => current.then(next), Promise.resolve());
});
