import macro from 'vtk.js/Sources/macros';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';

const { vtkWarningMacro } = macro;

const SHADER_TYPES = { vertex: true, fragment: true };

// The coincident slope term moves the fragment depth by
// CoincidentFactor * (depth slope of the primitive). It writes
// @builtin(frag_depth), which stops the early depth test, so it is in the
// shader only when the factor is not zero. The mapper must add
// usesCoincidentFactor() to its pipeline hash and put the
// //VTK::CoincidentOffset::Impl marker in its fragment template. The
// constant term stays in the vertex shader of each mapper.
function implementReplaceShaderCoincidentOffset(
  publicAPI,
  model,
  initialValues = {}
) {
  publicAPI.usesCoincidentFactor = () => {
    const cp = publicAPI.getCoincidentParameters?.();
    if (!cp) {
      return false;
    }
    return cp.factor !== 0.0;
  };

  publicAPI.replaceShaderCoincidentOffset = (hash, pipeline, vertexInput) => {
    const fDesc = pipeline.getShaderDescription('fragment');
    if (!fDesc) {
      return;
    }
    let lines = [];
    // A mapper that writes its own depth (sphere, stick) keeps that depth.
    if (
      publicAPI.usesCoincidentFactor() &&
      !fDesc.hasBuiltinOutput('@builtin(frag_depth) fragDepth')
    ) {
      fDesc.addBuiltinInput('vec4<f32>', '@builtin(position) fragPos');
      fDesc.addBuiltinOutput('f32', '@builtin(frag_depth) fragDepth');
      lines = [
        '  let cscale = length(vec2<f32>(dpdx(input.fragPos.z), dpdy(input.fragPos.z)));',
        '  output.fragDepth = clamp(input.fragPos.z - mapperUBO.CoincidentFactor * cscale, 0.0, 1.0);',
      ];
    }
    fDesc.setCode(
      vtkWebGPUShaderCache.substitute(
        fDesc.getCode(),
        '//VTK::CoincidentOffset::Impl',
        lines
      ).result
    );
  };
  model.shaderReplacements.set(
    'replaceShaderCoincidentOffset',
    publicAPI.replaceShaderCoincidentOffset
  );
}

// User shader changes come from getViewSpecificProperties().WebGPU of the
// renderable, in the same form as the OpenGL backend:
// - VertexShaderCode and FragmentShaderCode replace the templates.
// - ShaderReplacements is a list of { shaderType: 'Vertex' or 'Fragment',
//   originalValue, replaceFirst, replacementValue, replaceAll }. An entry
//   with replaceFirst runs before the mapper replacements, the others run
//   after them. originalValue is a regular expression source.
// - VertexOutputs is a list of { type, name, interpolation } that the vertex
//   shader gives to the fragment shader as input.<name>. Integer types
//   need interpolation 'flat'.
// A class that does not have one renderable (for example the volume pass)
// overrides getUserShaderProperties.
function implementBuildShadersWithReplacements(
  publicAPI,
  model,
  initialValues = {}
) {
  publicAPI.getUserShaderProperties = () =>
    model.renderable?.getViewSpecificProperties?.()?.WebGPU ?? null;

  // The user shader changes are part of the pipeline hash, so a change gives
  // a new pipeline and a new shader module.
  publicAPI.getUserShaderHash = () => {
    const spec = publicAPI.getUserShaderProperties();
    if (!spec) {
      return '';
    }
    return JSON.stringify([
      spec.VertexShaderCode,
      spec.FragmentShaderCode,
      spec.ShaderReplacements,
      spec.VertexOutputs,
    ]);
  };

  publicAPI.getReplacedShaderTemplate = (stage) => {
    const spec = publicAPI.getUserShaderProperties();
    if (stage === 'vertex') {
      if (spec?.VertexShaderCode) {
        return spec.VertexShaderCode;
      }
      return model.vertexShaderTemplate;
    }
    if (spec?.FragmentShaderCode) {
      return spec.FragmentShaderCode;
    }
    return model.fragmentShaderTemplate;
  };

  publicAPI.applyShaderReplacements = (pipeline, pre) => {
    const replacements =
      publicAPI.getUserShaderProperties()?.ShaderReplacements;
    if (!replacements) {
      return;
    }
    for (let i = 0; i < replacements.length; i++) {
      const replacement = replacements[i];
      if (!!replacement.replaceFirst === pre) {
        const stage = `${replacement.shaderType ?? ''}`.toLowerCase();
        if (!SHADER_TYPES[stage]) {
          vtkWarningMacro(
            `WebGPU has no ${replacement.shaderType} shader, the replacement is ignored`
          );
        } else {
          const desc = pipeline.getShaderDescription(stage);
          desc.setCode(
            vtkWebGPUShaderCache.substitute(
              desc.getCode(),
              replacement.originalValue,
              replacement.replacementValue,
              replacement.replaceAll
            ).result
          );
        }
      }
    }
  };

  publicAPI.addUserVertexOutputs = (pipeline) => {
    const outputs = publicAPI.getUserShaderProperties()?.VertexOutputs;
    if (!outputs) {
      return;
    }
    const vDesc = pipeline.getShaderDescription('vertex');
    outputs.forEach(({ type, name, interpolation }) => {
      if (!vDesc.hasOutput(name)) {
        vDesc.addOutput(type, name, interpolation);
      }
    });
  };
}

export default {
  implementReplaceShaderCoincidentOffset,
  implementBuildShadersWithReplacements,
};
