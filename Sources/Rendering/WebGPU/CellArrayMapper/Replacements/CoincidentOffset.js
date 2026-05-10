import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';

function replaceShaderCoincidentOffset(
  publicAPI,
  model,
  hash,
  pipeline,
  vertexInput
) {
  const fDesc = pipeline.getShaderDescription('fragment');
  if (!fDesc) {
    return;
  }

  fDesc.addBuiltinInput('vec4<f32>', '@builtin(position) fragPos');
  fDesc.addBuiltinOutput('f32', '@builtin(frag_depth) fragDepth');

  let code = fDesc.getCode();
  code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
    '  var coincidentDepth: f32 = input.fragPos.z;',
    '  if (mapperUBO.CoincidentFactor != 0.0) {',
    '    let cscale = length(vec2<f32>(dpdx(input.fragPos.z), dpdy(input.fragPos.z)));',
    '    coincidentDepth = coincidentDepth - mapperUBO.CoincidentFactor * cscale;',
    '  }',
    '  output.fragDepth = clamp(coincidentDepth, 0.0, 1.0);',
  ]).result;
  fDesc.setCode(code);
}

export default replaceShaderCoincidentOffset;
