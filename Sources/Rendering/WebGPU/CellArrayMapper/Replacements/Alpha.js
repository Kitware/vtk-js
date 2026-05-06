import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import { isEdges } from 'vtk.js/Sources/Rendering/WebGPU/CellArrayMapper/Helpers';

export function replaceShaderAlpha(publicAPI, model, hash, pipeline, vertexInput) {
    if (isEdges(hash)) return;
    const fDesc = pipeline.getShaderDescription('fragment');
    let code = fDesc.getCode();

    const actor = model.WebGPUActor;
    const ppty = actor.getRenderable().getProperty();
    const alphaMode = ppty.getAlphaMode?.() ?? 0;

    let alphaCode;
    if (alphaMode === 1) {
      // MASK: apply texture alpha, discard below cutoff, output opaque
      alphaCode = [
        '  computedColor.a = computedColor.a * _diffuseMap.a;',
        '  if (computedColor.a < mapperUBO.AlphaCutoff) { discard; }',
        '  computedColor.a = 1.0;',
      ];
    } else if (alphaMode === 2) {
      // BLEND: use texture alpha for transparency
      alphaCode = [
        '  computedColor.a = computedColor.a * _diffuseMap.a;',
        '  if (computedColor.a == 0.0) { discard; }',
      ];
    } else {
      // OPAQUE: ignore texture alpha, force fully opaque
      alphaCode = ['  computedColor.a = 1.0;'];
    }

    code = vtkWebGPUShaderCache.substitute(
      code,
      '//VTK::Alpha::Impl',
      alphaCode
    ).result;
    fDesc.setCode(code);
}
