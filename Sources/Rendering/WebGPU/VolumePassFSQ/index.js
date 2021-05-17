import macro from 'vtk.js/Sources/macro';
import vtkWebGPUFullScreenQuad from 'vtk.js/Sources/Rendering/WebGPU/FullScreenQuad';

const volFragTemplate = `
//VTK::TCoord::Dec

//VTK::RenderEncoder::Dec

//VTK::IOStructs::Dec

[[stage(fragment)]]
fn main(
//VTK::IOStructs::Input
)
//VTK::IOStructs::Output
{
  var output: fragmentOutput;

  var rayMax: f32 = textureSample(maxTexture, maxTextureSampler, input.tcoordVS).r;
  var rayMin: f32 = textureSample(minTexture, minTextureSampler, input.tcoordVS).r;
  if (rayMax <= rayMin) { discard; }
  var computedColor: vec4<f32> = vec4<f32>(rayMin, rayMax, 0.0, min(100.0*(rayMax - rayMin), 1.0));

  //VTK::RenderEncoder::Impl
  return output;
}
`;

// ----------------------------------------------------------------------------
// vtkWebGPUVolumePassFSQ methods
// ----------------------------------------------------------------------------

function vtkWebGPUVolumePassFSQ(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUVolumePassFSQ');
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkWebGPUFullScreenQuad.extend(publicAPI, model, initialValues);

  model.fragmentShaderTemplate = volFragTemplate;

  publicAPI.setPipelineHash('volfsq');

  // Object methods
  vtkWebGPUVolumePassFSQ(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPUVolumePassFSQ');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
