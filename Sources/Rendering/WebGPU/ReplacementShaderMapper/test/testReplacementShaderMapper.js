import { describe, expect, it } from 'vitest';

import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkWebGPUPipeline from 'vtk.js/Sources/Rendering/WebGPU/Pipeline';
import vtkWebGPUReplacementShaderMapper from 'vtk.js/Sources/Rendering/WebGPU/ReplacementShaderMapper';
import vtkWebGPUShaderDescription from 'vtk.js/Sources/Rendering/WebGPU/ShaderDescription';
import vtkWebGPUSimpleMapper from 'vtk.js/Sources/Rendering/WebGPU/SimpleMapper';
import vtkWebGPUVertexInput from 'vtk.js/Sources/Rendering/WebGPU/VertexInput';

const VS = `
//VTK::IOStructs::Dec
@vertex
fn main(
//VTK::IOStructs::Input
)
//VTK::IOStructs::Output
{
  var output : vertexOutput;
  //VTK::Custom::Impl
  return output;
}
`;

const FS = `
//VTK::IOStructs::Dec
@fragment
fn main(
//VTK::IOStructs::Input
)
//VTK::IOStructs::Output
{
  var output : fragmentOutput;
  //VTK::Custom::Impl
  return output;
}
`;

function generate(spec, setup) {
  const renderable = vtkMapper.newInstance();
  renderable.setViewSpecificProperties({ WebGPU: spec });
  const mapper = vtkWebGPUSimpleMapper.newInstance();
  mapper.setRenderable(renderable);
  const calls = [];
  mapper.getShaderReplacements().set('replaceShaderCustom', (h, pipeline) => {
    const fDesc = pipeline.getShaderDescription('fragment');
    calls.push(fDesc.getCode());
    fDesc.setCode(fDesc.getCode().replace('//VTK::Custom::Impl', 'MAPPER'));
  });
  setup?.(mapper);
  const pipeline = vtkWebGPUPipeline.newInstance();
  mapper.generateShaderDescriptions(
    'h',
    pipeline,
    vtkWebGPUVertexInput.newInstance()
  );
  return {
    mapper,
    calls,
    vs: pipeline.getShaderDescription('vertex').getCode(),
    fs: pipeline.getShaderDescription('fragment').getCode(),
  };
}

describe('Test WebGPU ReplacementShaderMapper', () => {
  it('uses the user templates', () => {
    const { vs, fs } = generate({
      VertexShaderCode: VS,
      FragmentShaderCode: FS,
    });
    expect(vs).toContain('@vertex');
    expect(fs).toContain('MAPPER');
  });

  it('runs replaceFirst entries before the mapper and the others after', () => {
    const { calls, fs } = generate({
      VertexShaderCode: VS,
      FragmentShaderCode: FS,
      ShaderReplacements: [
        {
          shaderType: 'Fragment',
          originalValue: 'MAPPER',
          replacementValue: 'POST',
        },
        {
          shaderType: 'Fragment',
          originalValue: 'var output : fragmentOutput;',
          replacementValue: 'var output : fragmentOutput;\n  PRE',
          replaceFirst: true,
        },
      ],
    });
    expect(calls[0]).toContain('PRE');
    expect(fs).toContain('POST');
    expect(fs).not.toContain('MAPPER');
  });

  it('ignores a geometry replacement', () => {
    const { fs } = generate({
      VertexShaderCode: VS,
      FragmentShaderCode: FS,
      ShaderReplacements: [
        { shaderType: 'Geometry', originalValue: 'a', replacementValue: 'b' },
      ],
    });
    expect(fs).toContain('MAPPER');
  });

  it('accepts a template that has no markers', () => {
    const code = '@fragment fn main() {}';
    const { fs } = generate({ VertexShaderCode: VS, FragmentShaderCode: code });
    expect(fs).toBe(code);
  });

  it('adds the vertex outputs with their interpolation', () => {
    const { fs } = generate({
      VertexShaderCode: VS,
      FragmentShaderCode: FS,
      VertexOutputs: [
        { type: 'u32', name: 'myId', interpolation: 'flat' },
        { type: 'vec3<f32>', name: 'myValue' },
      ],
    });
    expect(fs).toContain('@interpolate(flat) myId : u32');
    expect(fs).toContain('myValue : vec3<f32>');
  });

  it('puts the user changes in the hash', () => {
    const { mapper } = generate({
      VertexShaderCode: VS,
      FragmentShaderCode: FS,
    });
    const before = mapper.getUserShaderHash();
    mapper.getRenderable().setViewSpecificProperties({ WebGPU: {} });
    expect(mapper.getUserShaderHash()).not.toBe(before);
  });

  it('writes the coincident depth only when the factor is not zero', () => {
    const run = (factor) => {
      const publicAPI = {
        getCoincidentParameters: () => ({ factor, offset: 0 }),
      };
      const model = { shaderReplacements: new Map() };
      vtkWebGPUReplacementShaderMapper.implementReplaceShaderCoincidentOffset(
        publicAPI,
        model
      );
      const pipeline = vtkWebGPUPipeline.newInstance();
      const fDesc = vtkWebGPUShaderDescription.newInstance({
        type: 'fragment',
        hash: 'h',
        code: '//VTK::CoincidentOffset::Impl',
      });
      pipeline.getShaderDescriptions().push(fDesc);
      model.shaderReplacements.get('replaceShaderCoincidentOffset')(
        'h',
        pipeline
      );
      return { publicAPI, fDesc };
    };

    const off = run(0);
    expect(off.publicAPI.usesCoincidentFactor()).toBe(false);
    expect(off.fDesc.getCode()).not.toContain('fragDepth');
    expect(off.fDesc.hasBuiltinOutput('@builtin(frag_depth) fragDepth')).toBe(
      false
    );

    const on = run(2);
    expect(on.publicAPI.usesCoincidentFactor()).toBe(true);
    expect(on.fDesc.getCode()).toContain('mapperUBO.CoincidentFactor * cscale');
    expect(on.fDesc.hasBuiltinOutput('@builtin(frag_depth) fragDepth')).toBe(
      true
    );
  });
});
