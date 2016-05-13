import * as macro from '../../../macro';
import Shader from '../Shader';

// perform in place string substitutions, indicate if a substitution was done
// this is useful for building up shader strings which typically involve
// lots of string substitutions. Return true if a substitution was done.
export function substitute(source, search, replace, all = true) {
  const replaceStr = Array.isArray(replace) ? replace.join('\n') : replace;
  let replaced = false;
  if (source.search(search) !== -1) {
    replaced = true;
  }
  let gflag = '';
  if (all) {
    gflag = 'g';
  }
  const regex = new RegExp(search, gflag);
  const resultstr = source.replace(regex, replaceStr);
  return { replace: replaced, result: resultstr };
}

// ----------------------------------------------------------------------------
// vtkShaderProgram methods
// ----------------------------------------------------------------------------

export function shaderProgram(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkShaderProgram');

  publicAPI.compileShader = () => {
    if (!model.vertexShader.compile()) {
      console.log(model.vertexShader.getSource().split('\n').map((line, index) => `${index}: ${line}`).join('\n'));
      console.log(model.vertexShader.getError());
      return 0;
    }
    if (!model.fragmentShader.compile()) {
      console.log(model.fragmentShader.getSource().split('\n').map((line, index) => `${index}: ${line}`).join('\n'));
      console.log(model.fragmentShader.getError());
      return 0;
    }
    // skip geometry for now
    if (!publicAPI.attachShader(model.vertexShader)) {
      console.log(model.error);
      return 0;
    }
    if (!publicAPI.attachShader(model.fragmentShader)) {
      console.log(model.error);
      return 0;
    }

    if (!publicAPI.link()) {
      console.log(`Links failed: ${model.error}`);
      return 0;
    }

    model.setCompiled(true);
    return 1;
  };

  publicAPI.cleanup = () => {
    if (model.shaderType === 'Unknown' || model.handle === 0) {
      return;
    }

    model.context.deleteShader(model.handle);
    model.handle = 0;
  };

  publicAPI.bind = () => {
    if (!model.linked && !model.link()) {
      return false;
    }

    model.context.useProgram(model.handle);
    model.setBound(true);
    return true;
  };

  publicAPI.release = () => {
    model.context.useProgram(0);
    model.setBound(false);
  };

  publicAPI.link = () => {
    if (model.inked) {
      return true;
    }

    if (model.handle === 0) {
      model.error = 'Program has not been initialized, and/or does not have shaders.';
      return false;
    }

    // clear out the list of uniforms used
    model.uniformLocs = {};

    model.context.linkProgram(model.handle);
    const isCompiled = model.context.getProgramParameter(model.handle, model.context.LINK_STATUS);
    if (!isCompiled) {
      const lastError = model.context.getProgramInfoLog(model.handle);
      console.error(`Error linking shader ${lastError}`);
      model.handle = 0;
      return false;
    }

    model.setLinked(true);
    model.attributeLocs = {};
    return true;
  };

  publicAPI.setUniformf = (name, v) => {
    const location = model.findUniform(name);
    if (location === -1) {
      model.error = `Could not set uniform ${name} . No such uniform.`;
      return false;
    }
    model.context.uniform1f(location, v);
    return true;
  };

  publicAPI.setUniformi = (name, v) => {
    const location = model.findUniform(name);
    if (location === -1) {
      model.error = `Could not set uniform ${name} . No such uniform.`;
      return false;
    }
    model.context.uniform1i(location, v);
    return true;
  };

  publicAPI.setUniformMatrix = (name, v) => {
    const location = model.findUniform(name);
    if (location === -1) {
      model.error = `Could not set uniform ${name} . No such uniform.`;
      return false;
    }
    model.context.uniformMatrix4fv(location, 1, model.context.FALSE, v);
    return true;
  };

  publicAPI.setUniform3fv = (name, count, v) => {
    const location = model.findUniform(name);
    if (location === -1) {
      model.error = `Could not set uniform ${name} . No such uniform.`;
      return false;
    }
    model.context.uniform3fv(location, count, v);
    return true;
  };

  publicAPI.findUniform = (name) => {
    if (!name || !model.linked) {
      return -1;
    }

    let loc = Object.keys(model.uniformLocs).indexOf(name);

    if (loc !== -1) {
      return model.uniformLocs[name];
    }

    loc = model.context.getUniformLocation(model.handle, name);
    if (loc === -1) {
      model.error = `Uniform ${name} not found in current shader program.`;
    }
    model.uniformLocs[name] = loc;

    return loc;
  };

  publicAPI.isUniformUsed = (name) => {
    if (!name) {
      return false;
    }

    // see if we have cached the result
    let loc = Object.keys(model.uniformLocs).indexOf(name);
    if (loc !== -1) {
      return true;
    }

    if (!model.linked) {
      console.log('attempt to find uniform when the shader program is not linked');
      return false;
    }

    loc = model.context.getUniformLocation(model.handle, name);
    if (loc === -1) {
      return false;
    }
    model.uniformLocs[name] = loc;

    return true;
  };

  publicAPI.attachShader = (shader) => {
    if (shader.getHandle() === 0) {
      model.error = 'Shader object was not initialized, cannot attach it.';
      return false;
    }
    if (shader.getType() === 'Unknown') {
      model.error = 'Shader object is of type Unknown and cannot be used.';
      return false;
    }

    if (model.handle === 0) {
      const thandle = model.context.createProgram();
      if (thandle === 0) {
        model.error = 'Could not create shader program.';
        return false;
      }
      model.handle = thandle;
      model.linked = false;
    }

    if (shader.getType() === 'Vertex') {
      if (model.vertexShaderHandle !== 0) {
        model.comntext.detachShader(model.handle, model.vertexShaderHandle);
      }
      model.vertexShaderHandle = shader.getHandle();
    }
    if (shader.getType() === 'Fragment') {
      if (model.fragmentShaderHandle !== 0) {
        model.context.detachShader(model.handle, model.fragmentShaderHandle);
      }
      model.fragmentShaderHandle = shader.getHandle();
    }

    model.context.attachShader(model.handle, shader.getHandle());
    model.setLinked(false);
    return true;
  };

  publicAPI.detachShader = (shader) => {
    if (shader.getHandle() === 0) {
      model.error = 'shader object was not initialized, cannot attach it.';
      return false;
    }
    if (shader.getType() === 'Unknown') {
      model.error = 'Shader object is of type Unknown and cannot be used.';
      return false;
    }
    if (model.handle === 0) {
      model.errror = 'This shader prorgram has not been initialized yet.';
    }

    switch (shader.getType()) {
      case 'Vertex':
        if (model.vertexShaderHandle !== shader.getHandle()) {
          model.error = 'The supplied shader was not attached to this program.';
          return false;
        }
        model.context.detachShader(model.handle, shader.getHandle());
        model.vertexShaderHandle = 0;
        model.linked = false;
        return true;
      case 'Fragment':
        if (model.fragmentShaderHandle !== shader.getHandle()) {
          model.error = 'The supplied shader was not attached to this program.';
          return false;
        }
        model.context.detachShader(model.handle, shader.getHandle());
        model.fragmentShaderHandle = 0;
        model.linked = false;
        return true;
      default:
        return false;
    }
  };

  publicAPI.setContext = (ctx) => {
    model.vertexShader.setContext(ctx);
    model.fragmentShader.setContext(ctx);
    model.geometryShader.setContext(ctx);
  };

  // publicAPI.enableAttributeArray = (name) => {
  //   const location = publicAPI.findAttributeArray(name);
  //   if (location === -1) {
  //     model.error = `Could not enable attribute ${name} No such attribute.`;
  //     return false;
  //   }
  //   model.context.enableVertexAttribArray(location);
  //   return true;
  // };

  // publicAPI.disableAttributeArray = (name) => {
  //   const location = publicAPI.findAttributeArray(name);
  //   if (location === -1) {
  //     model.error = `Could not enable attribute ${name} No such attribute.`;
  //     return false;
  //   }
  //   model.context.disableVertexAttribArray(location);
  //   return true;
  // };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  vertexShaderHandle: 0,
  fragmentShaderHandle: 0,
  geometryShaderHandle: 0,
  vertexShader: null,
  fragmentShader: null,
  geometryShader: null,

  linked: false,
  bound: false,
  compiled: false,
  error: '',
  handle: 0,
  numberOfOutputs: 0,
  attributesLocs: null,
  uniformLocs: null,
  md5Hash: 0,
  context: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Instanciate internal objects
  model.attributesLocs = {};
  model.uniformLocs = {};
  model.vertexShader = Shader.newInstance();
  model.fragmentShader = Shader.newInstance();
  model.geometryShader = Shader.newInstance();

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, [
    'error',
    'handle',
    'compiled',
    'bound',
    'linked',
    'md5Hash',
    'vertexShader',
    'fragmentShader',
    'geometryShader',
  ]);

  // Object methods
  shaderProgram(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
