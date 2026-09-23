import vtkDataSet from 'vtk.js/Sources/Common/DataModel/DataSet';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';

const { FieldAssociations } = vtkDataSet;

// Selection ids. The selection pass adds 1 to attributeID, so the shaders
// write the raw id.
// - Primitive index path: the index values are point ids, so vertex_index
//   is the point id of a vertex and the flat output gives the first point
//   of the primitive. vtkCellId() gives the cell id.
// - Flat path: the selectId vertex attribute of the provoking vertex.
// - A subclass that makes its own vertex buffers writes zero ids.
function replaceShaderSelect(publicAPI, model, hash, pipeline, vertexInput) {
  if (!model.selectionPass) {
    return;
  }

  const selector = model.WebGPURenderer?.getSelector?.();
  let association = null;
  if (model.usePrimitiveIndex) {
    association = selector?.getFieldAssociation();
  }
  let selectImpl = [
    '  var compositeID: u32 = 0u;',
    '  var attributeID: u32 = 0u;',
  ];
  const selectBuffer = vertexInput.getBuffer('selectId');
  if (!model.usePrimitiveIndex && selectBuffer) {
    const vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addOutput('u32', 'attributeID', 'flat');
    const vCode = vtkWebGPUShaderCache.substitute(
      vDesc.getCode(),
      '//VTK::Select::Impl',
      ['  output.attributeID = selectId;']
    ).result;
    vDesc.setCode(vCode);
    selectImpl = [
      '  var compositeID: u32 = 1u;',
      '  var attributeID: u32 = input.attributeID;',
    ];
  } else if (association === FieldAssociations.FIELD_ASSOCIATION_POINTS) {
    const vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addBuiltinInput('u32', '@builtin(vertex_index) vertexIndex');
    vDesc.addOutput('u32', 'attributeID', 'flat');
    const vCode = vtkWebGPUShaderCache.substitute(
      vDesc.getCode(),
      '//VTK::Select::Impl',
      ['  output.attributeID = input.vertexIndex;']
    ).result;
    vDesc.setCode(vCode);
    selectImpl = [
      '  var compositeID: u32 = 1u;',
      '  var attributeID: u32 = input.attributeID;',
    ];
  } else if (association === FieldAssociations.FIELD_ASSOCIATION_CELLS) {
    selectImpl = [
      '  var compositeID: u32 = 1u;',
      '  var attributeID: u32 = vtkCellId(input.primitiveIndex);',
    ];
  }
  const fDesc = pipeline.getShaderDescription('fragment');
  const code = vtkWebGPUShaderCache.substitute(
    fDesc.getCode(),
    '//VTK::Select::Impl',
    selectImpl
  ).result;
  fDesc.setCode(code);
}

export default replaceShaderSelect;
