import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';

import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkImageProperty from 'vtk.js/Sources/Rendering/Core/ImageProperty';
import vtkImageResliceMapper from 'vtk.js/Sources/Rendering/Core/ImageResliceMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkCamera from 'vtk.js/Sources/Rendering/Core/Camera';

import { SlabTypes } from 'vtk.js/Sources/Rendering/Core/ImageResliceMapper/Constants';

// use full HttpDataAccessHelper
import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper';
// ----------------------------------------------------------------------------

import baseline from './testImageResliceMapperSlabTypes.png';

test.onlyIfWebGL('Test ImageResliceMapperSlabTypes', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkImageResliceMapper testImageResliceMapperSlabTypes');

  // Create some control UI
  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(
    document.createElement('div')
  );
  container.appendChild(renderWindowContainer);

  // create what we will view
  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  const ren1 = gc.registerResource(vtkRenderer.newInstance());
  ren1.setViewport(0, 0, 0.5, 0.5);
  ren1.setBackground(0.32, 0.34, 0.43);
  renderWindow.addRenderer(ren1);
  const ren2 = gc.registerResource(vtkRenderer.newInstance());
  ren2.setViewport(0.5, 0, 1, 0.5);
  ren2.setBackground(0.32, 0.34, 0.43);
  renderWindow.addRenderer(ren2);
  const ren3 = gc.registerResource(vtkRenderer.newInstance());
  ren3.setViewport(0, 0.5, 0.5, 1);
  ren3.setBackground(0.32, 0.34, 0.43);
  renderWindow.addRenderer(ren3);
  const ren4 = gc.registerResource(vtkRenderer.newInstance());
  ren4.setViewport(0.5, 0.5, 1, 1);
  ren4.setBackground(0.32, 0.34, 0.43);
  renderWindow.addRenderer(ren4);

  // ----------------------------------------------------------------------------
  // Test code
  // ----------------------------------------------------------------------------

  const reader = gc.registerResource(
    vtkHttpDataSetReader.newInstance({ fetchGzip: true })
  );

  const amapper = gc.registerResource(vtkImageResliceMapper.newInstance());
  const cmapper = gc.registerResource(vtkImageResliceMapper.newInstance());
  const smapper = gc.registerResource(vtkImageResliceMapper.newInstance());
  const zmapper = gc.registerResource(vtkImageResliceMapper.newInstance());
  const slicePlane = gc.registerResource(vtkPlane.newInstance());
  slicePlane.setNormal(1, 0, 0);
  amapper.setSlicePlane(slicePlane);
  cmapper.setSlicePlane(slicePlane);
  smapper.setSlicePlane(slicePlane);
  zmapper.setSlicePlane(slicePlane);

  amapper.setSlabThickness(40);
  amapper.setSlabType(SlabTypes.MIN);
  cmapper.setSlabThickness(40);
  cmapper.setSlabType(SlabTypes.MAX);
  smapper.setSlabThickness(40);
  smapper.setSlabType(SlabTypes.MEAN);
  zmapper.setSlabThickness(10);
  zmapper.setSlabType(SlabTypes.SUM);

  const aactor = gc.registerResource(vtkImageSlice.newInstance());
  aactor.setMapper(amapper);
  ren1.addActor(aactor);
  const cactor = gc.registerResource(vtkImageSlice.newInstance());
  cactor.setMapper(cmapper);
  ren2.addActor(cactor);
  const sactor = gc.registerResource(vtkImageSlice.newInstance());
  sactor.setMapper(smapper);
  ren3.addActor(sactor);
  const zactor = gc.registerResource(vtkImageSlice.newInstance());
  zactor.setMapper(zmapper);
  ren4.addActor(zactor);

  // Do a first pass render to create the API specific view nodes
  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  renderWindow.addView(glwindow);
  glwindow.setContainer(renderWindowContainer);
  glwindow.setSize(400, 400);
  renderWindow.render();

  const oglren1 = glwindow.getViewNodeFor(ren1);
  const oglren2 = glwindow.getViewNodeFor(ren2);
  const oglren3 = glwindow.getViewNodeFor(ren3);
  const oglren4 = glwindow.getViewNodeFor(ren4);
  const oglamapper = oglren1.getViewNodeFor(amapper);
  const oglcmapper = oglren2.getViewNodeFor(cmapper);
  oglcmapper.setOpenGLTexture(oglamapper.getOpenGLTexture());
  const oglsmapper = oglren3.getViewNodeFor(smapper);
  oglsmapper.setOpenGLTexture(oglamapper.getOpenGLTexture());
  const oglzmapper = oglren4.getViewNodeFor(zmapper);
  oglzmapper.setOpenGLTexture(oglamapper.getOpenGLTexture());

  const cam = gc.registerResource(vtkCamera.newInstance());
  ren1.setActiveCamera(cam);
  ren2.setActiveCamera(cam);
  ren3.setActiveCamera(cam);
  ren4.setActiveCamera(cam);
  reader.setUrl(`${__BASE_PATH__}/Data/volume/headsq.vti`).then(() => {
    reader.loadData().then(() => {
      reader.update();
      const im = reader.getOutputData();
      const bds = im.extentToBounds(im.getExtent());
      slicePlane.setOrigin(
        0.5 * (bds[0] + bds[1]),
        0.5 * (bds[2] + bds[3]),
        0.5 * (bds[4] + bds[5])
      );
      amapper.setInputData(im);
      cmapper.setInputData(im);
      smapper.setInputData(im);
      zmapper.setInputData(im);

      ren1.resetCamera();
      ren2.resetCamera();
      ren3.resetCamera();
      ren4.resetCamera();
      cam.azimuth(-90);
      cam.roll(-90);
      cam.zoom(1.1);
      renderWindow.render();

      glwindow.captureNextImage().then((image) => {
        testUtils.compareImages(
          image,
          [baseline],
          'Rendering/Core/ImageResliceMapper',
          t,
          1,
          gc.releaseResources
        );
      });
      renderWindow.render();
    });
  });

  const property = gc.registerResource(vtkImageProperty.newInstance());

  const rgb = gc.registerResource(vtkColorTransferFunction.newInstance());
  rgb.addRGBPoint(0, 0, 0, 0);
  rgb.addRGBPoint(3926, 1, 1, 1);
  property.setRGBTransferFunction(rgb);

  const ofun = gc.registerResource(vtkPiecewiseFunction.newInstance());
  ofun.addPoint(0, 1);
  ofun.addPoint(3926, 1);
  property.setPiecewiseFunction(ofun);

  property.setColorWindow(3926);
  property.setColorLevel(1863);

  aactor.setProperty(property);
  cactor.setProperty(property);
  sactor.setProperty(property);
  zactor.setProperty(property);

  // -----------------------------------------------------------
  // Make some variables global so that you can inspect and
  // modify objects in your browser's developer console:
  // -----------------------------------------------------------
  global.aactor = aactor;
  global.cactor = cactor;
  global.sactor = sactor;
  global.amapper = amapper;
  global.cmapper = cmapper;
  global.smapper = smapper;
  global.zmapper = zmapper;
  global.rgb = rgb;
  global.ofun = ofun;
  global.ren1 = ren1;
  global.ren2 = ren2;
  global.ren3 = ren3;
  global.ren4 = ren4;
  global.renderWindow = renderWindow;
});
