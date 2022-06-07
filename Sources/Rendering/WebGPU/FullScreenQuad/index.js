import macro from 'vtk.js/Sources/macros';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import vtkWebGPUSimpleMapper from 'vtk.js/Sources/Rendering/WebGPU/SimpleMapper';

// ----------------------------------------------------------------------------
// vtkWebGPUFullScreenQuad methods
// ----------------------------------------------------------------------------

function vtkWebGPUFullScreenQuad(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUFullScreenQuad');

  publicAPI.replaceShaderPosition = (hash, pipeline, vertexInput) => {
    const vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addBuiltinOutput('vec4<f32>', '@builtin(position) Position');
    let code = vDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
      'output.tcoordVS = vec2<f32>(vertexBC.x * 0.5 + 0.5, 1.0 - vertexBC.y * 0.5 - 0.5);',
      'output.Position = vec4<f32>(vertexBC, 1.0);',
    ]).result;
    vDesc.setCode(code);
  };
  model.shaderReplacements.set(
    'replaceShaderPosition',
    publicAPI.replaceShaderPosition
  );

  publicAPI.updateBuffers = () => {
    const buff = model.device.getBufferManager().getFullScreenQuadBuffer();
    model.vertexInput.addBuffer(buff, ['vertexBC']);
    model.numberOfVertices = 6;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkWebGPUSimpleMapper.extend(publicAPI, model, initialValues);

  // Object methods
  vtkWebGPUFullScreenQuad(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPUFullScreenQuad');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
