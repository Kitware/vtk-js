import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkOBJReader from 'vtk.js/Sources/IO/Misc/OBJReader';

import baseline from './testClearShaderReplacement.png';

test.onlyIfWebGL('Test Clear Shader Replacements', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkOpenGLPolyDataMapper ClearShaderReplacements');

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

  mapperViewProp.clearShaderReplacement = (
    _shaderType,
    _originalValue,
    _replaceFirst
  ) => {
    const shaderReplacement = mapperViewProp.OpenGL.ShaderReplacements;
    let indexToRemove = -1;

    for (let i = 0; i < shaderReplacement.length; i++) {
      if (
        shaderReplacement[i].shaderType === _shaderType &&
        shaderReplacement[i].originalValue === _originalValue &&
        shaderReplacement[i].replaceFirst === _replaceFirst
      ) {
        indexToRemove = i;
        break;
      }
    }
    if (indexToRemove > -1) {
      shaderReplacement.splice(indexToRemove, 1);
    }
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
      mapperViewProp.OpenGL.ShaderReplacements.push({
        shaderType: 'Vertex',
        originalValue: '//VTK::Normal::Dec',
        replaceFirst: true,
        replacementValue:
          '//VTK::Normal::Dec\n  varying vec3 myNormalMCVSOutput;\n',
        replaceAll: false,
      });

      mapperViewProp.clearShaderReplacement(
        'Vertex',
        '//VTK::Normal::Dec',
        true
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
          'Rendering/OpenGL/PolyDataMapper/testShaderReplacementsClear',
          t,
          1.5,
          gc.releaseResources
        );
      });
      renderWindow.render();
    });
});
