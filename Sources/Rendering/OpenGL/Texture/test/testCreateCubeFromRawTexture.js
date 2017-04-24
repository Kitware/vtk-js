import vtkActor              from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCubeSource         from 'vtk.js/Sources/Filters/Sources/CubeSource';
import vtkHttpDataSetReader  from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkMapper             from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkTexture            from 'vtk.js/Sources/Rendering/Core/Texture';
import vtkRenderer           from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow       from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkSphereSource       from 'vtk.js/Sources/Filters/Sources/SphereSource';

import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import baseline from './testCreateCubeFromRawTexture.png';

test.onlyIfWebGL('Test vtkOpenGLTexture Rendering', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('Rendering', 'Filter: OpenGLTexture');

  let callBackfunction = function (loadedTextures){
    // Create come control UI
    const container = document.querySelector('body');
    const renderWindowContainer = document.createElement('div');
    container.appendChild(renderWindowContainer);

    // Create view
    const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
    const renderer = gc.registerResource(vtkRenderer.newInstance());
    renderWindow.addRenderer(renderer);

    const sphere = gc.registerResource(vtkSphereSource.newInstance());
    const sphereMapper = gc.registerResource(vtkMapper.newInstance());
    sphereMapper.setInputConnection(sphere.getOutputPort());
    const sphereActor = gc.registerResource(vtkActor.newInstance());
    sphereActor.setMapper(sphereMapper);
    renderer.addActor(sphereActor);

    for(let i = 0; i < 6; i++) {
      const scalarName = loadedTextures[i].getPointData().getArrayByIndex(0).getName();
      loadedTextures[i].getPointData().setActiveScalars(scalarName);
    }

    const texture = gc.registerResource(vtkTexture.newInstance());
    const viewProperties = texture.getViewSpecificProperties();
    const firstImage = loadedTextures[0];
    viewProperties['Cube'] = {
      width: firstImage.getDimensions()[0],
      height: firstImage.getDimensions()[1],
      nbComp: 3,
      dataType: firstImage.getPointData().getScalars().getDataType(),
      data: loadedTextures,
    };

    const bounds = renderer.computeVisiblePropBounds();
    const scale = 500;
    const cube = gc.registerResource(vtkCubeSource.newInstance());
    cube.setBounds(bounds[0] * scale, bounds[1] * scale, bounds[2] * scale,
                   bounds[3] * scale, bounds[4] * scale, bounds[5] * scale);

    // Update shaders in order to map texture to a cube
    const mapper = gc.registerResource(vtkMapper.newInstance());
    mapper.setInputConnection(cube.getOutputPort());

    const newFragmentShader = "//VTK::System::Dec\n" +
      "//VTK::Output::Dec\n" +
      "// Template for the polydata mappers fragment shader\n" +
      "uniform int PrimitiveIDOffset;\n" +
      "// VC position of this fragment\n" +
      "//VTK::PositionVC::Dec\n" +
      "uniform samplerCube cubeMap;\n" +
      "varying vec3 TexCoords;\n" +
      "void main()\n" +
      "{\n" +
      "  gl_FragData[0] = vec4(textureCube(cubeMap, TexCoords).rgb, 1.0);\n" +
      "}\n";

    const mapperViewProp = mapper.getViewSpecificProperties();
    mapperViewProp['OpenGL'] = {
      ShaderReplacements: [],
      FragmentShaderCode: newFragmentShader,
    };
    // Define function addShaderReplacements
    mapperViewProp['addShaderReplacements'] =
      (_shaderType, _originalValue, _replaceFirst, _replacementValue, _replaceAll) => {
      mapperViewProp['OpenGL']['ShaderReplacements'].push({
        shaderType: _shaderType,
        originalValue: _originalValue,
        replaceFirst: _replaceFirst,
        replacementValue: _replacementValue,
        replaceAll: _replaceAll,
      });
    };

    mapperViewProp.addShaderReplacements(
      'Vertex',
      '//VTK::PositionVC::Dec', // replace the normal block
      true, // before the standard replacements
      '//VTK::PositionVC::Dec\n' +
      'varying vec3 TexCoords;\n',
      false // only do it once
    );
    mapperViewProp.addShaderReplacements(
      'Vertex',
      '//VTK::PositionVC::Impl', // replace the normal block
      true, // before the standard replacements
      '//VTK::PositionVC::Impl\n' +
      'TexCoords.xyz = vertexMC.xyz;\n',
      false // only do it once
    );

    const actor = gc.registerResource(vtkActor.newInstance());
    actor.setMapper(mapper);
    actor.addTexture(texture);
    renderer.addActor(actor);

    renderer.getActiveCamera().setViewUp(0, -1, 0);
    renderer.getActiveCamera().setFocalPoint(0, 0, 1);
    renderer.getActiveCamera().setPosition(0, 0, -50);
    renderWindow.render();

    const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
    glwindow.setContainer(renderWindowContainer);
    renderWindow.addView(glwindow);
    glwindow.setSize(400, 400);

    const image = glwindow.captureImage();
    testUtils.compareImages(image, [baseline], 'Rendering/OpenGL/Texture/', t, 0.5, gc.releaseResources);
  };

  // Recursive function to load texture one by one
  function loadTexture(idTexture, texturePathList, textureImageList, endCallBack){
    if (idTexture === texturePathList.length)
    {
      if (endCallBack) { // check if endcallback exists
        endCallBack(textureImageList);
      }
      return;
    }

    const reader = gc.registerResource(vtkHttpDataSetReader.newInstance({ fetchGzip : true }));
    reader.setUrl(texturePathList[idTexture]).then(() => {
      reader.loadData().then(() => {
      textureImageList.push(reader.getOutputData());
      const nextID = idTexture + 1;
      loadTexture(nextID, texturePathList, textureImageList, endCallBack);
      });// end loadData
    });// end set url
  };

  const path = `${__BASE_PATH__}/Data/skybox/mountains/`;
  const texturePathList = [];
  texturePathList.push(path + 'px.vti');
  texturePathList.push(path + 'nx.vti');
  texturePathList.push(path + 'py.vti');
  texturePathList.push(path + 'ny.vti');
  texturePathList.push(path + 'pz.vti');
  texturePathList.push(path + 'nz.vti');

  // It will contains all vtkImageData which will textured the cube
  const textures = [];
  loadTexture(0, texturePathList, textures, callBackfunction);
});