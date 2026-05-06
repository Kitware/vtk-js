import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import { isEdges } from 'vtk.js/Sources/Rendering/WebGPU/CellArrayMapper/Helpers';

export function replaceShaderColor(publicAPI, model, hash, pipeline, vertexInput) {
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

    // Check if using texture based coloring (color coordinates from mapper)
    const useTextureColoring =
      (model.renderable.getAreScalarsMappedFromCells() ||
        model.renderable.getInterpolateScalarsBeforeMapping?.()) &&
      model.renderable.getColorCoordinates() &&
      vertexInput.hasAttribute('tcoord') &&
      model.colorTexture;

    if (useTextureColoring) {
      // Use texture sampling for colors (cell scalars or interpolated point scalars)
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
    // If there's no vertex color buffer return the shader as is
    const colorBuffer = vertexInput.getBuffer('colorVI');
    if (!colorBuffer) return;

    // Modifies the vertex shader to include the vertex colors and interpolation in the outputs
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

    // Sets the fragment shader to accept the color inputs from the vertex shader
    const fDesc = pipeline.getShaderDescription('fragment');
    code = fDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Color::Impl', [
      'ambientColor = input.color;',
      'diffuseColor = input.color;',
      'opacity = opacity * input.color.a;',
    ]).result;
    fDesc.setCode(code);
}
