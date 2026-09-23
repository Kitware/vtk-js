import { describe, expect, it } from 'vitest';

import vtkWebGPUShaderDescription from 'vtk.js/Sources/Rendering/WebGPU/ShaderDescription';
import {
  addClipDistances,
  hasClipDistances,
  MAX_CLIPPING_PLANES,
} from 'vtk.js/Sources/Rendering/WebGPU/Helpers/ClippingPlanes';

describe('clip distances', () => {
  it('uses clip distances only when the device has the feature', () => {
    expect(hasClipDistances({ hasFeature: () => true })).toBe(true);
    expect(hasClipDistances({ hasFeature: () => false })).toBe(false);
    expect(hasClipDistances(null)).toBe(false);
  });

  it('writes one distance for each plane in the vertex shader', () => {
    const vDesc = vtkWebGPUShaderDescription.newInstance({
      type: 'vertex',
      code: '//VTK::IOStructs::Dec\nfn main() {}',
    });
    const lines = addClipDistances(vDesc, {
      countName: 'mapperUBO.NumClipPlanes',
      planePrefix: 'mapperUBO.ClipPlane',
      positionName: 'output.vertexSC',
    });

    expect(vDesc.getCode().startsWith('enable clip_distances;\n')).toBe(true);
    expect(lines).toHaveLength(MAX_CLIPPING_PLANES);
    expect(lines[1]).toBe(
      '  output.clipDistances[1] = select(1.0, dot(mapperUBO.ClipPlane1, output.vertexSC), mapperUBO.NumClipPlanes > 1u);'
    );

    vDesc.replaceShaderCode(null);
    expect(vDesc.getCode()).toContain(
      `@builtin(clip_distances) clipDistances : array<f32, ${MAX_CLIPPING_PLANES}>,`
    );
  });
});
