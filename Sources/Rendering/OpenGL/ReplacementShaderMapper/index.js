import vtkShaderProgram from 'vtk.js/Sources/Rendering/OpenGL/ShaderProgram';

function implementReplaceShaderCoincidentOffset(
  publicAPI,
  model,
  initialValues = {}
) {
  publicAPI.replaceShaderCoincidentOffset = (shaders, ren, actor) => {
    const cp = publicAPI.getCoincidentParameters(ren, actor);

    // if we need an offset handle it here
    // The value of .000016 is suitable for depth buffers
    // of at least 16 bit depth. We do not query the depth
    // right now because we would need some mechanism to
    // cache the result taking into account FBO changes etc.
    if (cp && (cp.factor !== 0.0 || cp.offset !== 0.0)) {
      let FSSource = shaders.Fragment;

      FSSource = vtkShaderProgram.substitute(
        FSSource,
        '//VTK::Coincident::Dec',
        ['uniform float cfactor;', 'uniform float coffset;']
      ).result;

      if (model.context.getExtension('EXT_frag_depth')) {
        if (cp.factor !== 0.0) {
          FSSource = vtkShaderProgram.substitute(
            FSSource,
            '//VTK::UniformFlow::Impl',
            [
              'float cscale = length(vec2(dFdx(gl_FragCoord.z),dFdy(gl_FragCoord.z)));',
              '//VTK::UniformFlow::Impl',
            ],
            false
          ).result;
          FSSource = vtkShaderProgram.substitute(
            FSSource,
            '//VTK::Depth::Impl',
            'gl_FragDepthEXT = gl_FragCoord.z + cfactor*cscale + 0.000016*coffset;'
          ).result;
        } else {
          FSSource = vtkShaderProgram.substitute(
            FSSource,
            '//VTK::Depth::Impl',
            'gl_FragDepthEXT = gl_FragCoord.z + 0.000016*coffset;'
          ).result;
        }
      }
      if (model._openGLRenderWindow.getWebgl2()) {
        if (cp.factor !== 0.0) {
          FSSource = vtkShaderProgram.substitute(
            FSSource,
            '//VTK::UniformFlow::Impl',
            [
              'float cscale = length(vec2(dFdx(gl_FragCoord.z),dFdy(gl_FragCoord.z)));',
              '//VTK::UniformFlow::Impl',
            ],
            false
          ).result;
          FSSource = vtkShaderProgram.substitute(
            FSSource,
            '//VTK::Depth::Impl',
            'gl_FragDepth = gl_FragCoord.z + cfactor*cscale + 0.000016*coffset;'
          ).result;
        } else {
          FSSource = vtkShaderProgram.substitute(
            FSSource,
            '//VTK::Depth::Impl',
            'gl_FragDepth = gl_FragCoord.z + 0.000016*coffset;'
          ).result;
        }
      }
      shaders.Fragment = FSSource;
    }
  };
}

function implementBuildShadersWithReplacements(
  publicAPI,
  model,
  initialValues = {}
) {
  publicAPI.applyShaderReplacements = (shaders, viewSpec, pre) => {
    let shaderReplacements = null;
    if (viewSpec) {
      shaderReplacements = viewSpec.ShaderReplacements;
    }

    if (shaderReplacements) {
      for (let i = 0; i < shaderReplacements.length; i++) {
        const currReplacement = shaderReplacements[i];
        if (
          (pre && currReplacement.replaceFirst) ||
          (!pre && !currReplacement.replaceFirst)
        ) {
          const shaderType = currReplacement.shaderType;
          const ssrc = shaders[shaderType];
          const substituteRes = vtkShaderProgram.substitute(
            ssrc,
            currReplacement.originalValue,
            currReplacement.replacementValue,
            currReplacement.replaceAll
          );
          shaders[shaderType] = substituteRes.result;
        }
      }
    }
  };

  publicAPI.buildShaders = (shaders, ren, actor) => {
    publicAPI.getReplacedShaderTemplate(shaders, ren, actor);

    model.lastRenderPassShaderReplacement = model.currentRenderPass
      ? model.currentRenderPass.getShaderReplacement()
      : null;

    // apply any renderPassReplacements
    if (model.lastRenderPassShaderReplacement) {
      model.lastRenderPassShaderReplacement(shaders);
    }

    const openGLSpec = model.renderable.getViewSpecificProperties().OpenGL;

    // user specified pre replacements
    publicAPI.applyShaderReplacements(shaders, openGLSpec, true);

    publicAPI.replaceShaderValues(shaders, ren, actor);

    // user specified post replacements
    publicAPI.applyShaderReplacements(shaders, openGLSpec);
  };

  publicAPI.getReplacedShaderTemplate = (shaders, ren, actor) => {
    const openGLSpecProp = model.renderable.getViewSpecificProperties().OpenGL;

    publicAPI.getShaderTemplate(shaders, ren, actor);
    let vertexShaderCode = shaders.Vertex;
    if (openGLSpecProp) {
      const vertexSpecProp = openGLSpecProp.VertexShaderCode;
      if (vertexSpecProp !== undefined && vertexSpecProp !== '') {
        vertexShaderCode = vertexSpecProp;
      }
    }
    shaders.Vertex = vertexShaderCode;

    let fragmentShaderCode = shaders.Fragment;
    if (openGLSpecProp) {
      const fragmentSpecProp = openGLSpecProp.FragmentShaderCode;
      if (fragmentSpecProp !== undefined && fragmentSpecProp !== '') {
        fragmentShaderCode = fragmentSpecProp;
      }
    }
    shaders.Fragment = fragmentShaderCode;

    let geometryShaderCode = shaders.Geometry;
    if (openGLSpecProp) {
      const geometrySpecProp = openGLSpecProp.GeometryShaderCode;
      if (geometrySpecProp !== undefined) {
        geometryShaderCode = geometrySpecProp;
      }
    }
    shaders.Geometry = geometryShaderCode;
  };
}

export default {
  implementReplaceShaderCoincidentOffset,
  implementBuildShadersWithReplacements,
};
