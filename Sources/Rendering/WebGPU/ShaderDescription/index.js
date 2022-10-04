import macro from 'vtk.js/Sources/macros';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';

// ----------------------------------------------------------------------------
// vtkWebGPUShaderDescription methods
// ----------------------------------------------------------------------------

// shader description

function vtkWebGPUShaderDescription(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUShaderDescription');

  publicAPI.hasOutput = (name) => model.outputNames.includes(name);

  publicAPI.addOutput = (type, name, interpolation = undefined) => {
    model.outputTypes.push(type);
    model.outputNames.push(name);
    model.outputInterpolations.push(interpolation);
  };

  publicAPI.addBuiltinOutput = (type, name) => {
    model.builtinOutputTypes.push(type);
    model.builtinOutputNames.push(name);
  };

  publicAPI.addBuiltinInput = (type, name) => {
    model.builtinInputTypes.push(type);
    model.builtinInputNames.push(name);
  };

  // perform shader replacements for the input and outputs
  // of this shader. That includes vertex inputs if specified
  publicAPI.replaceShaderCode = (priorStage, vertexInput) => {
    const inputImpl = [];
    let iodec = [];
    if (vertexInput) {
      inputImpl.push(vertexInput.getShaderCode());
    }
    if (priorStage || model.builtinInputNames.length) {
      const inputStruct = [];
      inputStruct.push(`struct ${model.type}Input\n{`);
      if (priorStage) {
        const inputNames = priorStage.getOutputNamesByReference();
        const inputTypes = priorStage.getOutputTypesByReference();
        const inputInterpolations =
          priorStage.getOutputInterpolationsByReference();
        for (let i = 0; i < inputNames.length; i++) {
          if (inputInterpolations[i] !== undefined) {
            inputStruct.push(
              `  @location(${i}) @interpolate(${inputInterpolations[i]}) ${inputNames[i]} : ${inputTypes[i]},`
            );
          } else {
            inputStruct.push(
              `  @location(${i}) ${inputNames[i]} : ${inputTypes[i]},`
            );
          }
        }
      }
      for (let i = 0; i < model.builtinInputNames.length; i++) {
        inputStruct.push(
          `  ${model.builtinInputNames[i]} : ${model.builtinInputTypes[i]},`
        );
      }
      if (inputStruct.length > 1) {
        inputStruct.push('};');
        iodec = inputStruct;
        inputImpl[inputImpl.length - 1] += ',';
        inputImpl.push(`input: ${model.type}Input`);
      }
    }
    if (inputImpl.length) {
      model.code = vtkWebGPUShaderCache.substitute(
        model.code,
        '//VTK::IOStructs::Input',
        inputImpl
      ).result;
    }

    if (model.outputNames.length + model.builtinOutputNames.length) {
      const outputStruct = [`struct ${model.type}Output\n{`];
      for (let i = 0; i < model.outputNames.length; i++) {
        if (model.outputInterpolations[i] !== undefined) {
          outputStruct.push(
            `  @location(${i}) @interpolate(${model.outputInterpolations[i]}) ${model.outputNames[i]} : ${model.outputTypes[i]},`
          );
        } else {
          outputStruct.push(
            `  @location(${i}) ${model.outputNames[i]} : ${model.outputTypes[i]},`
          );
        }
      }
      for (let i = 0; i < model.builtinOutputNames.length; i++) {
        outputStruct.push(
          `  ${model.builtinOutputNames[i]} : ${model.builtinOutputTypes[i]},`
        );
      }
      outputStruct.push('};');
      iodec = iodec.concat(outputStruct);
      model.code = vtkWebGPUShaderCache.substitute(
        model.code,
        '//VTK::IOStructs::Output',
        [`-> ${model.type}Output`]
      ).result;
    }

    model.code = vtkWebGPUShaderCache.substitute(
      model.code,
      '//VTK::IOStructs::Dec',
      iodec
    ).result;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  type: null, // 'vertex' or 'fragment'
  hash: null,
  code: null,
  outputNames: null,
  outputTypes: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  model.outputNames = [];
  model.outputTypes = [];
  model.outputInterpolations = [];
  model.builtinOutputNames = [];
  model.builtinOutputTypes = [];
  model.builtinInputNames = [];
  model.builtinInputTypes = [];

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['type', 'hash', 'code']);
  macro.getArray(publicAPI, model, [
    'outputTypes',
    'outputNames',
    'outputInterpolations',
  ]);

  // Object methods
  vtkWebGPUShaderDescription(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkWebGPUShaderDescription'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
