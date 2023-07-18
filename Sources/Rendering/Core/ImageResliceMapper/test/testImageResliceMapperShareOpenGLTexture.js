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
import { vec3, mat3 } from 'gl-matrix';

// use full HttpDataAccessHelper
import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper';
// ----------------------------------------------------------------------------

import baseline from './testImageResliceMapperShareOpenGLTexture.png';

test.onlyIfWebGL('Test ImageResliceMapperShareOpenGLTexture', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok(
    'rendering',
    'vtkImageResliceMapper testImageResliceMapperShareOpenGLTexture'
  );

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

  const reader = gc.registerResource(
    vtkHttpDataSetReader.newInstance({ fetchGzip: true })
  );

  const amapper = gc.registerResource(vtkImageResliceMapper.newInstance());
  const cmapper = gc.registerResource(vtkImageResliceMapper.newInstance());
  const smapper = gc.registerResource(vtkImageResliceMapper.newInstance());
  const aslicePlane = gc.registerResource(vtkPlane.newInstance());
  aslicePlane.setNormal(0, 0, 1);
  amapper.setSlicePlane(aslicePlane);
  const cslicePlane = gc.registerResource(vtkPlane.newInstance());
  cslicePlane.setNormal(0, 1, 0);
  cmapper.setSlicePlane(cslicePlane);
  const sslicePlane = gc.registerResource(vtkPlane.newInstance());
  sslicePlane.setNormal(1, 0, 0);
  smapper.setSlicePlane(sslicePlane);

  const aactor = gc.registerResource(vtkImageSlice.newInstance());
  aactor.setMapper(amapper);
  renderer.addActor(aactor);
  const cactor = gc.registerResource(vtkImageSlice.newInstance());
  cactor.setMapper(cmapper);
  renderer.addActor(cactor);
  const sactor = gc.registerResource(vtkImageSlice.newInstance());
  sactor.setMapper(smapper);
  renderer.addActor(sactor);

  // Do a first pass render to create the API specific view nodes
  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  renderWindow.addView(glwindow);
  glwindow.setContainer(renderWindowContainer);
  glwindow.setSize(400, 400);
  renderWindow.render();

  const oglrenderer = glwindow.getViewNodeFor(renderer);
  const oglamapper = oglrenderer.getViewNodeFor(amapper);
  const oglcmapper = oglrenderer.getViewNodeFor(cmapper);
  oglcmapper.setOpenGLTexture(oglamapper.getOpenGLTexture());
  const oglsmapper = oglrenderer.getViewNodeFor(smapper);
  oglsmapper.setOpenGLTexture(oglamapper.getOpenGLTexture());

  reader.setUrl(`${__BASE_PATH__}/Data/volume/headsq.vti`).then(() => {
    reader.loadData().then(() => {
      reader.update();
      const im = reader.getOutputData();
      amapper.setInputData(im);
      cmapper.setInputData(im);
      const center = im.getCenter();
      aslicePlane.setOrigin(center);
      cslicePlane.setOrigin(center);
      sslicePlane.setOrigin(center);
      const mat = mat3.identity(new Float64Array(9));
      mat3.copy(mat, im.getDirection());

      const an = aslicePlane.getNormal();
      vec3.transformMat3(an, an, mat);
      aslicePlane.setNormal(an);

      const cn = cslicePlane.getNormal();
      vec3.transformMat3(cn, cn, mat);
      cslicePlane.setNormal(cn);

      const sn = sslicePlane.getNormal();
      vec3.transformMat3(sn, sn, mat);
      sslicePlane.setNormal(sn);

      smapper.setInputData(im);

      renderer.getActiveCamera().azimuth(-45);
      renderer.resetCamera();
      renderer.getActiveCamera().zoom(1.5);
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
  global.rgb = rgb;
  global.ofun = ofun;
  global.renderer = renderer;
  global.renderWindow = renderWindow;
});
