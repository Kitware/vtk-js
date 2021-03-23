import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkOBJReader from 'vtk.js/Sources/IO/Misc/OBJReader';

import baseline from './testAddShaderReplacement.png';

test.onlyIfWebGL('Test Add Shader Replacements', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkOpenGLPolyDataMapper AddShaderReplacements');

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
  renderer.setBackground(0.0, 0.0, 0.0);

  // ----------------------------------------------------------------------------
  // Test code
  // ----------------------------------------------------------------------------
  const reader = gc.registerResource(
    vtkOBJReader.newInstance({ splitMode: 'usemtl' })
  );

  const mapper = gc.registerResource(vtkMapper.newInstance());
  mapper.setInputConnection(reader.getOutputPort());

  const mapperViewProp = mapper.getViewSpecificProperties();

  mapperViewProp.OpenGL = {
    ShaderReplacements: [],
  };

  mapperViewProp.addShaderReplacements = (
    _shaderType,
    _originalValue,
    _replaceFirst,
    _replacementValue,
    _replaceAll
  ) => {
    mapperViewProp.OpenGL.ShaderReplacements.push({
      shaderType: _shaderType,
      originalValue: _originalValue,
      replaceFirst: _replaceFirst,
      replacementValue: _replacementValue,
      replaceAll: _replaceAll,
    });
  };

  const actor = gc.registerResource(vtkActor.newInstance());
  actor.setMapper(mapper);
  actor.getProperty().setAmbientColor(0.2, 0.2, 1.0);
  actor.getProperty().setDiffuseColor(1.0, 0.65, 0.7);
  actor.getProperty().setSpecular(0.5);
  actor.getProperty().setSpecularColor(1.0, 1.0, 1.0);
  actor.getProperty().setDiffuse(0.7);
  actor.getProperty().setAmbient(0.5);
  actor.getProperty().setSpecularPower(20.0);
  actor.getProperty().setOpacity(1.0);
  renderer.addActor(actor);

  reader
    .setUrl(
      `${__BASE_PATH__}/Data/obj/space-shuttle-orbiter/space-shuttle-orbiter.obj`
    )
    .then(() => {
      mapperViewProp.addShaderReplacements(
        'Vertex',
        '//VTK::Normal::Dec',
        true,
        '//VTK::Normal::Dec\n  varying vec3 myNormalMCVSOutput;\n',
        false
      );

      mapperViewProp.addShaderReplacements(
        'Vertex',
        '//VTK::Normal::Impl',
        true,
        '//VTK::Normal::Impl\n  myNormalMCVSOutput = normalMC;\n',
        false
      );

      mapperViewProp.addShaderReplacements(
        'Fragment',
        '//VTK::Normal::Dec',
        true,
        '//VTK::Normal::Dec\n  varying vec3 myNormalMCVSOutput;\n',
        false
      );

      mapperViewProp.addShaderReplacements(
        'Fragment',
        '//VTK::Normal::Impl',
        true,
        '//VTK::Normal::Impl\n  diffuseColor = abs(myNormalMCVSOutput) / diffuse;\n',
        false
      );

      renderWindow.render();
      const camera = renderer.getActiveCamera();
      camera.setPosition(-755.42, 861.83, -1700.66);
      camera.setFocalPoint(13.24, 31.25, -147.31);
      camera.setViewUp(0.28, 0.89, 0.33);
      renderer.resetCamera();
      camera.zoom(1.6);
      renderWindow.render();

      const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
      glwindow.setContainer(renderWindowContainer);
      renderWindow.addView(glwindow);
      glwindow.setSize(400, 400);

      glwindow.captureNextImage().then((image) => {
        testUtils.compareImages(
          image,
          [baseline],
          'Rendering/OpenGL/PolyDataMapper/testShaderReplacementsAdd',
          t,
          1.5,
          gc.releaseResources
        );
      });
      renderWindow.render();
    });
});
