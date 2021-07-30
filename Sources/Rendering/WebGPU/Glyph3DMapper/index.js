import * as macro from 'vtk.js/Sources/macros';
import vtkWebGPUPolyDataMapper from 'vtk.js/Sources/Rendering/WebGPU/PolyDataMapper';
import vtkWebGPUStorageBuffer from 'vtk.js/Sources/Rendering/WebGPU/StorageBuffer';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import vtkWebGPUBufferManager from 'vtk.js/Sources/Rendering/WebGPU/BufferManager';
import { registerOverride } from 'vtk.js/Sources/Rendering/WebGPU/ViewNodeFactory';

const { PrimitiveTypes } = vtkWebGPUBufferManager;

// ----------------------------------------------------------------------------
// vtkWebGPUSphereMapper methods
// ----------------------------------------------------------------------------

function vtkWebGPUGlyph3DMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUGlyph3DMapper');

  // Capture 'parentClass' api for internal use
  const superClass = { ...publicAPI };

  publicAPI.replaceShaderPosition = (hash, pipeline, vertexInput) => {
    const vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addBuiltinInput('u32', '[[builtin(instance_index)]] instanceIndex');
    vDesc.addBuiltinOutput('vec4<f32>', '[[builtin(position)]] Position');
    let code = vDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
      '    output.Position = rendererUBO.SCPCMatrix*mapperUBO.BCSCMatrix',
      '      *glyphSSBO.values[input.instanceIndex].matrix',
      '      *vertexBC;',
    ]).result;
    vDesc.setCode(code);
  };

  publicAPI.replaceShaderNormal = (hash, pipeline, vertexInput) => {
    if (vertexInput.hasAttribute('normalMC')) {
      const vDesc = pipeline.getShaderDescription('vertex');
      let code = vDesc.getCode();
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Normal::Impl', [
        '  output.normalVC = normalize((rendererUBO.WCVCNormals',
        ' * mapperUBO.MCWCNormals',
        ' * glyphSSBO.values[input.instanceIndex].normal*normalMC).xyz);',
      ]).result;
      vDesc.setCode(code);
    }
    superClass.replaceShaderNormal(hash, pipeline, vertexInput);
  };

  publicAPI.replaceShaderColor = (hash, pipeline, vertexInput) => {
    if (!model.carray) {
      superClass.replaceShaderColor(hash, pipeline, vertexInput);
      return;
    }
    const vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addOutput('vec4<f32>', 'color');
    let code = vDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Color::Impl', [
      '  output.color = glyphSSBO.values[input.instanceIndex].color;',
    ]).result;
    vDesc.setCode(code);

    const fDesc = pipeline.getShaderDescription('fragment');
    code = fDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Color::Impl', [
      'ambientColor = input.color;',
      'diffuseColor = input.color;',
      'opacity = mapperUBO.Opacity * input.color.a;',
    ]).result;
    fDesc.setCode(code);
  };

  publicAPI.replaceShaderSelect = (hash, pipeline, vertexInput) => {
    if (hash.includes('sel')) {
      const vDesc = pipeline.getShaderDescription('vertex');
      vDesc.addOutput('u32', 'compositeID');
      let code = vDesc.getCode();
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Select::Impl', [
        '  output.compositeID = input.instanceIndex;',
      ]).result;
      vDesc.setCode(code);

      const fDesc = pipeline.getShaderDescription('fragment');
      code = fDesc.getCode();
      code = vtkWebGPUShaderCache.substitute(code, '//VTK::Select::Impl', [
        'var compositeID: u32 = input.compositeID;',
      ]).result;
      fDesc.setCode(code);
    }
  };

  publicAPI.buildPrimitives = () => {
    model.currentInput = model.renderable.getInputData(1);

    model.renderable.buildArrays();

    // update the buffer objects if needed
    const garray = model.renderable.getMatrixArray();
    const narray = model.renderable.getNormalArray();
    model.carray = model.renderable.getColorArray();
    const numInstances = garray.length / 16;

    if (
      model.renderable.getBuildTime().getMTime() >
      model.glyphBOBuildTime.getMTime()
    ) {
      // In Core class all arrays are rebuilt when this happens
      // but these arrays can be shared between all primType
      const device = model.WebGPURenderWindow.getDevice();

      model.SSBO.clearData();
      model.SSBO.setNumberOfInstances(numInstances);
      model.SSBO.addEntry('matrix', 'mat4x4<f32>');
      model.SSBO.addEntry('normal', 'mat4x4<f32>');
      if (model.carray) {
        model.SSBO.addEntry('color', 'vec4<f32>');
      }

      model.SSBO.setAllInstancesFromArray('matrix', garray);
      model.SSBO.setAllInstancesFromArray3x3To4x4('normal', narray);
      if (model.carray) {
        model.SSBO.setAllInstancesFromArrayColorToFloat(
          'color',
          model.carray.getData()
        );
      }

      model.SSBO.send(device);
      model.glyphBOBuildTime.modified();
    }

    superClass.buildPrimitives();

    for (let i = 0; i < model.primitives.length; i++) {
      const primHelper = model.primitives[i];
      primHelper.setNumberOfInstances(numInstances);
    }
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
  vtkWebGPUPolyDataMapper.extend(publicAPI, model, initialValues);

  model.glyphBOBuildTime = {};
  macro.obj(model.glyphBOBuildTime, { mtime: 0 });

  model.SSBO = vtkWebGPUStorageBuffer.newInstance();
  model.SSBO.setName('glyphSSBO');

  // Object methods
  vtkWebGPUGlyph3DMapper(publicAPI, model);

  for (let i = PrimitiveTypes.Start; i < PrimitiveTypes.End; i++) {
    model.primitives[i].setSSBO(model.SSBO);
    const sr = model.primitives[i].getShaderReplacements();
    sr.set('replaceShaderPosition', publicAPI.replaceShaderPosition);
    sr.set('replaceShaderNormal', publicAPI.replaceShaderNormal);
    sr.set('replaceShaderSelect', publicAPI.replaceShaderSelect);
    sr.set('replaceShaderColor', publicAPI.replaceShaderColor);
  }
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPUGlyph3DMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };

// Register ourself to WebGPU backend if imported
registerOverride('vtkGlyph3DMapper', newInstance);
