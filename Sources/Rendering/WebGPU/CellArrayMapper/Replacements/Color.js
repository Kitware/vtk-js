import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import vtkWebGPUTypes from 'vtk.js/Sources/Rendering/WebGPU/Types';

function replaceShaderColor(publicAPI, model, hash, pipeline, vertexInput) {
  // By default, set the colors to be flat
  if (publicAPI.isEdgePrimitive()) {
    const fDesc = pipeline.getShaderDescription('fragment');
    let code = fDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Color::Impl', [
      'ambientColor = mapperUBO.EdgeColor;',
      'diffuseColor = mapperUBO.EdgeColor;',
    ]).result;
    fDesc.setCode(code);
    return;
  }

  // The cell colors are in cellColorSSBO at the global cell id. The primitive
  // index path finds the cell id with vtkCellId(). The flat path gets it
  // from the cellScalarId attribute of the provoking vertex.
  if (
    model._usesCellScalars &&
    model.SSBO === model._cellColorSSBO &&
    (model.usePrimitiveIndex || vertexInput.hasAttribute('cellScalarId'))
  ) {
    let colorIdx = 'vtkCellId(input.primitiveIndex)';
    if (!model.usePrimitiveIndex) {
      const vDesc = pipeline.getShaderDescription('vertex');
      vDesc.addOutput('u32', 'cellScalarId', 'flat');
      let code = vDesc.getCode();
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Color::Impl', [
        '  output.cellScalarId = cellScalarId;',
      ]).result;
      vDesc.setCode(code);
      colorIdx = 'input.cellScalarId';
    }

    const fDesc = pipeline.getShaderDescription('fragment');
    let fcode = fDesc.getCode();
    fcode = vtkWebGPUShaderCache.substitute(fcode, '//VTK::Color::Impl', [
      `let colorIdx: u32 = ${colorIdx};`,
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
    (vertexInput.hasAttribute('colorTCoord') ||
      model.cellTCoordComponents > 0) &&
    model.colorTexture;
  if (useTextureColoring) {
    // Cell color coordinates of the primitive index path come from a storage
    // buffer. addCellIdToFragmentShader() replaces input.colorTCoordVS.
    if (vertexInput.hasAttribute('colorTCoord')) {
      const vDesc = pipeline.getShaderDescription('vertex');
      const colorTCoords = vertexInput.getBuffer('colorTCoord');
      const colorArrayInfo = colorTCoords.getArrayInformation()[0];
      const colorNumComp = vtkWebGPUTypes.getNumberOfComponentsFromBufferFormat(
        colorArrayInfo.format
      );
      const colorInterpolation = colorArrayInfo.interpolation;
      let vCode = vDesc.getCode();
      vDesc.addOutput(
        `vec${colorNumComp}<f32>`,
        'colorTCoordVS',
        colorInterpolation
      );
      vCode = vtkWebGPUShaderCache.substitute(vCode, '//VTK::Color::Impl', [
        '  output.colorTCoordVS = colorTCoord;',
      ]).result;
      vDesc.setCode(vCode);
    }

    const fDesc = pipeline.getShaderDescription('fragment');
    let code = fDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Color::Impl', [
      'var texColor = textureSample(ColorTexture, ColorTextureSampler, input.colorTCoordVS);',
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
