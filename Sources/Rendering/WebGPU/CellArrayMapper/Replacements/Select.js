import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';

export function replaceShaderSelect(publicAPI, model, hash, pipeline, vertexInput) {
    if (hash.includes('sel')) {
      const selectBuffer = vertexInput.getBuffer('selectId');
      if (selectBuffer) {
        const vDesc = pipeline.getShaderDescription('vertex');
        vDesc.addOutput(
          'u32',
          'attributeID',
          selectBuffer.getArrayInformation()[0].interpolation
        );
        vDesc.addOutput(
          'u32',
          'compositeID',
          selectBuffer.getArrayInformation()[0].interpolation
        );
        let code = vDesc.getCode();
        code = vtkWebGPUShaderCache.substitute(code, '//VTK::Select::Impl', [
          '  output.compositeID = 1u;',
          '  output.attributeID = selectId + 1u;',
        ]).result;
        vDesc.setCode(code);
      }

      const fDesc = pipeline.getShaderDescription('fragment');
      let code = fDesc.getCode();
      const selectImpl = selectBuffer
        ? [
            '  var compositeID: u32 = input.compositeID;',
            '  var attributeID: u32 = input.attributeID;',
          ]
        : ['  var compositeID: u32 = 0u;', '  var attributeID: u32 = 0u;'];
      code = vtkWebGPUShaderCache.substitute(
        code,
        '//VTK::Select::Impl',
        selectImpl
      ).result;
      fDesc.setCode(code);
    }
}
