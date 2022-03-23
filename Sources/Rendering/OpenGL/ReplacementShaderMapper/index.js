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
export default { implementReplaceShaderCoincidentOffset };
