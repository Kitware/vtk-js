import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import { isEdges } from 'vtk.js/Sources/Rendering/WebGPU/CellArrayMapper/Helpers';

function replaceShaderColor(publicAPI, model, hash, pipeline, vertexInput) {
  // By default, set the colors to be flat
  if (isEdges(hash)) {
    const fDesc = pipeline.getShaderDescription('fragment');
    let code = fDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Color::Impl', [
      'ambientColor = mapperUBO.EdgeColor;',
      'diffuseColor = mapperUBO.EdgeColor;',
    ]).result;
    fDesc.setCode(code);
    return;
  }

  if (
    model._usesCellScalars &&
    model.SSBO === model._cellColorSSBO &&
    vertexInput.hasAttribute('cellScalarId')
  ) {
    const vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addOutput('u32', 'cellScalarId', 'flat');
    let code = vDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Color::Impl', [
      '  output.cellScalarId = cellScalarId;',
    ]).result;
    vDesc.setCode(code);

    const fDesc = pipeline.getShaderDescription('fragment');
    let fcode = fDesc.getCode();
    fcode = vtkWebGPUShaderCache.substitute(fcode, '//VTK::Color::Impl', [
      'let colorIdx: u32 = input.cellScalarId;',
      'let cellColor = cellColorSSBO.values[colorIdx].CellColor;',
      'ambientColor = cellColor;',
      'diffuseColor = cellColor;',
      'opacity = opacity * cellColor.a;',
    ]).result;
    fDesc.setCode(fcode);
    return;
  }

  // If there's a vertex color buffer, use it first.
  const colorBuffer = vertexInput.getBuffer('colorVI');
  if (colorBuffer) {
    const vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addOutput(
      'vec4<f32>',
      'color',
      colorBuffer.getArrayInformation()[0].interpolation
    );
    let code = vDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Color::Impl', [
      '  output.color = colorVI;',
    ]).result;
    vDesc.setCode(code);

    const fDesc = pipeline.getShaderDescription('fragment');
    let fcode = fDesc.getCode();
    fcode = vtkWebGPUShaderCache.substitute(fcode, '//VTK::Color::Impl', [
      'ambientColor = input.color;',
      'diffuseColor = input.color;',
      'opacity = opacity * input.color.a;',
    ]).result;
    fDesc.setCode(fcode);
    return;
  }

  // Check if using texture based coloring (interpolated point scalars or cell texture path).
  const indexedLookup =
    model.renderable.getLookupTable?.()?.getIndexedLookup?.() ?? false;
  const useTextureColoring =
    (model.renderable.getAreScalarsMappedFromCells() ||
      model.renderable.getInterpolateScalarsBeforeMapping?.()) &&
    model.renderable.getColorCoordinates() &&
    !(indexedLookup && model._usesCellScalars) &&
    vertexInput.hasAttribute('tcoord') &&
    model.colorTexture;
  if (useTextureColoring) {
    const fDesc = pipeline.getShaderDescription('fragment');
    let code = fDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Color::Impl', [
      'var texColor = textureSample(DiffuseTexture, DiffuseTextureSampler, input.tcoordVS);',
      'diffuseColor = vec4<f32>(texColor.rgb, 1.0);',
      'ambientColor = vec4<f32>(texColor.rgb, 1.0);',
      'opacity = opacity * texColor.a;',
    ]).result;
    fDesc.setCode(code);
    return;
  }

  // No scalar color contribution path.
  const fDesc = pipeline.getShaderDescription('fragment');
  let code = fDesc.getCode();
  code = vtkWebGPUShaderCache.substitute(code, '//VTK::Color::Impl', []).result;
  fDesc.setCode(code);
}

export default replaceShaderColor;
