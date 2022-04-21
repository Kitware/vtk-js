import * as macro from 'vtk.js/Sources/macros';
import vtkWebGPUCellArrayMapper from 'vtk.js/Sources/Rendering/WebGPU/CellArrayMapper';
import vtkWebGPUPolyDataMapper from 'vtk.js/Sources/Rendering/WebGPU/PolyDataMapper';
import vtkWebGPUStorageBuffer from 'vtk.js/Sources/Rendering/WebGPU/StorageBuffer';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import { registerOverride } from 'vtk.js/Sources/Rendering/WebGPU/ViewNodeFactory';

function vtkWebGPUGlyph3DCellArrayMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUGlyph3DCellArrayMapper');

  const superClass = { ...publicAPI };

  publicAPI.replaceShaderPosition = (hash, pipeline, vertexInput) => {
    const vDesc = pipeline.getShaderDescription('vertex');
    vDesc.addBuiltinInput('u32', '@builtin(instance_index) instanceIndex');
    vDesc.addBuiltinOutput('vec4<f32>', '@builtin(position) Position');
    let code = vDesc.getCode();
    code = vtkWebGPUShaderCache.substitute(code, '//VTK::Position::Impl', [
      '    output.Position = rendererUBO.SCPCMatrix*mapperUBO.BCSCMatrix',
      '      *glyphSSBO.values[input.instanceIndex].matrix',
      '      *vertexBC;',
    ]).result;
    vDesc.setCode(code);
  };
  model.shaderReplacements.set(
    'replaceShaderPosition',
    publicAPI.replaceShaderPosition
  );

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
  model.shaderReplacements.set(
    'replaceShaderNormal',
    publicAPI.replaceShaderNormal
  );

  publicAPI.replaceShaderColor = (hash, pipeline, vertexInput) => {
    if (!model.renderable.getColorArray()) {
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
  model.shaderReplacements.set(
    'replaceShaderColor',
    publicAPI.replaceShaderColor
  );

  publicAPI.replaceShaderSelect = (hash, pipeline, vertexInput) => {
    if (hash.includes('sel')) {
      const vDesc = pipeline.getShaderDescription('vertex');
      vDesc.addOutput('u32', 'compositeID', 'flat');
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
  model.shaderReplacements.set(
    'replaceShaderSelect',
    publicAPI.replaceShaderSelect
  );
}

// ----------------------------------------------------------------------------
export function caExtend(publicAPI, model, initialValues = {}) {
  Object.assign(model, {}, initialValues);

  // Inheritance
  vtkWebGPUCellArrayMapper.extend(publicAPI, model, initialValues);

  // Object methods
  vtkWebGPUGlyph3DCellArrayMapper(publicAPI, model);
}

const caNewInstance = macro.newInstance(
  caExtend,
  'vtkWebGPUGlyph3DCellArrayMapper'
);

// ----------------------------------------------------------------------------
// vtkWebGPUSphereMapper methods
// ----------------------------------------------------------------------------

function vtkWebGPUGlyph3DMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUGlyph3DMapper');

  publicAPI.createCellArrayMapper = () => {
    const mpr = caNewInstance();
    mpr.setSSBO(model.SSBO);
    mpr.setRenderable(model.renderable);
    return mpr;
  };

  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      model.WebGPUActor = publicAPI.getFirstAncestorOfType('vtkWebGPUActor');
      if (!model.renderable.getStatic()) {
        model.renderable.update();
      }

      const gpoly = model.renderable.getInputData(1);

      model.renderable.mapScalars(gpoly, 1.0);

      publicAPI.updateSSBO();

      publicAPI.updateCellArrayMappers(gpoly);

      for (let i = 0; i < model.children.length; i++) {
        const cellMapper = model.children[i];
        cellMapper.setNumberOfInstances(model.numInstances);
      }
    }
  };

  publicAPI.updateSSBO = () => {
    model.currentInput = model.renderable.getInputData(1);

    model.renderable.buildArrays();

    // update the buffer objects if needed
    const garray = model.renderable.getMatrixArray();
    const narray = model.renderable.getNormalArray();
    model.carray = model.renderable.getColorArray();
    model.numInstances = garray.length / 16;

    if (
      model.renderable.getBuildTime().getMTime() >
      model.glyphBOBuildTime.getMTime()
    ) {
      // In Core class all arrays are rebuilt when this happens
      // but these arrays can be shared between all primType
      model.WebGPURenderWindow = publicAPI.getFirstAncestorOfType(
        'vtkWebGPURenderWindow'
      );
      const device = model.WebGPURenderWindow.getDevice();

      model.SSBO.clearData();
      model.SSBO.setNumberOfInstances(model.numInstances);
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

  model.SSBO = vtkWebGPUStorageBuffer.newInstance({ label: 'glyphSSBO' });

  // Object methods
  vtkWebGPUGlyph3DMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPUGlyph3DMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };

// Register ourself to WebGPU backend if imported
registerOverride('vtkGlyph3DMapper', newInstance);
