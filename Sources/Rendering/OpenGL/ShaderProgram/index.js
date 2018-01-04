import macro from 'vtk.js/Sources/macro';
import vtkShader from 'vtk.js/Sources/Rendering/OpenGL/Shader';

const { vtkErrorMacro } = macro;

// perform in place string substitutions, indicate if a substitution was done
// this is useful for building up shader strings which typically involve
// lots of string substitutions. Return true if a substitution was done.
function substitute(source, search, replace, all = true) {
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

function vtkShaderProgram(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkShaderProgram');

  publicAPI.compileShader = () => {
    if (!model.vertexShader.compile()) {
      vtkErrorMacro(
        model.vertexShader
          .getSource()
          .split('\n')
          .map((line, index) => `${index}: ${line}`)
          .join('\n')
      );
      vtkErrorMacro(model.vertexShader.getError());
      return 0;
    }
    if (!model.fragmentShader.compile()) {
      vtkErrorMacro(
        model.fragmentShader
          .getSource()
          .split('\n')
          .map((line, index) => `${index}: ${line}`)
          .join('\n')
      );
      vtkErrorMacro(model.fragmentShader.getError());
      return 0;
    }
    // skip geometry for now
    if (!publicAPI.attachShader(model.vertexShader)) {
      vtkErrorMacro(model.error);
      return 0;
    }
    if (!publicAPI.attachShader(model.fragmentShader)) {
      vtkErrorMacro(model.error);
      return 0;
    }

    if (!publicAPI.link()) {
      vtkErrorMacro(`Links failed: ${model.error}`);
      return 0;
    }

    publicAPI.setCompiled(true);
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
    publicAPI.setBound(true);
    return true;
  };

  publicAPI.isBound = () => !!model.bound;

  publicAPI.release = () => {
    model.context.useProgram(null);
    publicAPI.setBound(false);
  };

  publicAPI.setContext = (ctx) => {
    model.vertexShader.setContext(ctx);
    model.fragmentShader.setContext(ctx);
    model.geometryShader.setContext(ctx);
  };

  publicAPI.link = () => {
    if (model.inked) {
      return true;
    }

    if (model.handle === 0) {
      model.error =
        'Program has not been initialized, and/or does not have shaders.';
      return false;
    }

    // clear out the list of uniforms used
    model.uniformLocs = {};

    model.context.linkProgram(model.handle);
    const isCompiled = model.context.getProgramParameter(
      model.handle,
      model.context.LINK_STATUS
    );
    if (!isCompiled) {
      const lastError = model.context.getProgramInfoLog(model.handle);
      vtkErrorMacro(`Error linking shader ${lastError}`);
      model.handle = 0;
      return false;
    }

    publicAPI.setLinked(true);
    model.attributeLocs = {};
    return true;
  };

  publicAPI.setUniformMatrix = (name, v) => {
    const location = publicAPI.findUniform(name);
    if (location === -1) {
      model.error = `Could not set uniform ${name} . No such uniform.`;
      return false;
    }
    model.context.uniformMatrix4fv(location, false, v);
    return true;
  };

  publicAPI.setUniformMatrix3x3 = (name, v) => {
    const location = publicAPI.findUniform(name);
    if (location === -1) {
      model.error = `Could not set uniform ${name} . No such uniform.`;
      return false;
    }
    model.context.uniformMatrix3fv(location, false, v);
    return true;
  };

  publicAPI.setUniformf = (name, v) => {
    const location = publicAPI.findUniform(name);
    if (location === -1) {
      model.error = `Could not set uniform ${name} . No such uniform.`;
      return false;
    }
    model.context.uniform1f(location, v);
    return true;
  };

  publicAPI.setUniformfv = (name, v) => {
    const location = publicAPI.findUniform(name);
    if (location === -1) {
      model.error = `Could not set uniform ${name} . No such uniform.`;
      return false;
    }
    model.context.uniform1fv(location, v);
    return true;
  };

  publicAPI.setUniformi = (name, v) => {
    const location = publicAPI.findUniform(name);
    if (location === -1) {
      model.error = `Could not set uniform ${name} . No such uniform.`;
      return false;
    }
    model.context.uniform1i(location, v);
    return true;
  };

  publicAPI.setUniformiv = (name, v) => {
    const location = publicAPI.findUniform(name);
    if (location === -1) {
      model.error = `Could not set uniform ${name} . No such uniform.`;
      return false;
    }
    model.context.uniform1iv(location, v);
    return true;
  };

  publicAPI.setUniform2f = (name, v1, v2) => {
    const location = publicAPI.findUniform(name);
    if (location === -1) {
      model.error = `Could not set uniform ${name} . No such uniform.`;
      return false;
    }
    if (v2 === undefined) {
      throw new RangeError('Invalid number of values for array');
    }
    model.context.uniform2f(location, v1, v2);
    return true;
  };

  publicAPI.setUniform2fv = (name, v) => {
    const location = publicAPI.findUniform(name);
    if (location === -1) {
      model.error = `Could not set uniform ${name} . No such uniform.`;
      return false;
    }
    model.context.uniform2fv(location, v);
    return true;
  };

  publicAPI.setUniform2i = (name, v1, v2) => {
    const location = publicAPI.findUniform(name);
    if (location === -1) {
      model.error = `Could not set uniform ${name} . No such uniform.`;
      return false;
    }
    if (v2 === undefined) {
      throw new RangeError('Invalid number of values for array');
    }
    model.context.uniform2i(location, v1, v2);
    return true;
  };

  publicAPI.setUniform2iv = (name, v) => {
    const location = publicAPI.findUniform(name);
    if (location === -1) {
      model.error = `Could not set uniform ${name} . No such uniform.`;
      return false;
    }
    model.context.uniform2iv(location, v);
    return true;
  };

  publicAPI.setUniform3f = (name, a1, a2, a3) => {
    const location = publicAPI.findUniform(name);
    if (location === -1) {
      model.error = `Could not set uniform ${name} . No such uniform.`;
      return false;
    }
    if (a3 === undefined) {
      throw new RangeError('Invalid number of values for array');
    }
    model.context.uniform3f(location, a1, a2, a3);
    return true;
  };

  publicAPI.setUniform3fArray = (name, a) => {
    const location = publicAPI.findUniform(name);
    if (location === -1) {
      model.error = `Could not set uniform ${name} . No such uniform.`;
      return false;
    }
    if (!Array.isArray(a) || a.length !== 3) {
      throw new RangeError('Invalid number of values for array');
    }
    model.context.uniform3f(location, a[0], a[1], a[2]);
    return true;
  };

  publicAPI.setUniform3fv = (name, v) => {
    const location = publicAPI.findUniform(name);
    if (location === -1) {
      model.error = `Could not set uniform ${name} . No such uniform.`;
      return false;
    }
    model.context.uniform3fv(location, v);
    return true;
  };

  publicAPI.setUniform3i = (name, ...args) => {
    const location = publicAPI.findUniform(name);
    if (location === -1) {
      model.error = `Could not set uniform ${name} . No such uniform.`;
      return false;
    }
    let array = args;
    // allow an array passed as a single argument
    if (array.length === 1 && Array.isArray(array[0])) {
      array = array[0];
    }
    if (array.length !== 3) {
      throw new RangeError('Invalid number of values for array');
    }
    model.context.uniform3i(location, array[0], array[1], array[2]);
    return true;
  };

  publicAPI.setUniform3iv = (name, v) => {
    const location = publicAPI.findUniform(name);
    if (location === -1) {
      model.error = `Could not set uniform ${name} . No such uniform.`;
      return false;
    }
    model.context.uniform3iv(location, v);
    return true;
  };

  publicAPI.setUniform4f = (name, ...args) => {
    const location = publicAPI.findUniform(name);
    if (location === -1) {
      model.error = `Could not set uniform ${name} . No such uniform.`;
      return false;
    }
    let array = args;
    // allow an array passed as a single argument
    if (array.length === 1 && Array.isArray(array[0])) {
      array = array[0];
    }
    if (array.length !== 4) {
      throw new RangeError('Invalid number of values for array');
    }
    model.context.uniform4f(location, array[0], array[1], array[2], array[3]);
    return true;
  };

  publicAPI.setUniform4fv = (name, v) => {
    const location = publicAPI.findUniform(name);
    if (location === -1) {
      model.error = `Could not set uniform ${name} . No such uniform.`;
      return false;
    }
    model.context.uniform4fv(location, v);
    return true;
  };

  publicAPI.setUniform4i = (name, ...args) => {
    const location = publicAPI.findUniform(name);
    if (location === -1) {
      model.error = `Could not set uniform ${name} . No such uniform.`;
      return false;
    }
    let array = args;
    // allow an array passed as a single argument
    if (array.length === 1 && Array.isArray(array[0])) {
      array = array[0];
    }
    if (array.length !== 4) {
      throw new RangeError('Invalid number of values for array');
    }
    model.context.uniform4i(location, array[0], array[1], array[2], array[3]);
    return true;
  };

  publicAPI.setUniform4iv = (name, v) => {
    const location = publicAPI.findUniform(name);
    if (location === -1) {
      model.error = `Could not set uniform ${name} . No such uniform.`;
      return false;
    }
    model.context.uniform4iv(location, v);
    return true;
  };

  publicAPI.setUniform4fv = (name, count, v) => {
    const location = publicAPI.findUniform(name);
    if (location === -1) {
      model.error = `Could not set uniform ${name} . No such uniform.`;
      return false;
    }
    model.context.uniform4fv(location, v);
    return true;
  };

  publicAPI.findUniform = (name) => {
    if (!name || !model.linked) {
      return -1;
    }

    // see if we have cached the result
    let loc = model.uniformLocs[name];
    if (loc !== undefined) {
      return loc;
    }

    loc = model.context.getUniformLocation(model.handle, name);
    if (loc === null) {
      model.error = `Uniform ${name} not found in current shader program.`;
      model.uniformLocs[name] = -1;
      return -1;
    }

    model.uniformLocs[name] = loc;
    return loc;
  };

  publicAPI.isUniformUsed = (name) => {
    if (!name) {
      return false;
    }

    // see if we have cached the result
    let loc = model.uniformLocs[name];
    if (loc !== undefined) {
      return loc !== null;
    }

    if (!model.linked) {
      vtkErrorMacro(
        'attempt to find uniform when the shader program is not linked'
      );
      return false;
    }

    loc = model.context.getUniformLocation(model.handle, name);
    model.uniformLocs[name] = loc;

    if (loc === null) {
      return false;
    }

    return true;
  };

  publicAPI.isAttributeUsed = (name) => {
    if (!name) {
      return false;
    }

    // see if we have cached the result
    let loc = Object.keys(model.attributeLocs).indexOf(name);
    if (loc !== -1) {
      return true;
    }

    if (!model.linked) {
      vtkErrorMacro(
        'attempt to find uniform when the shader program is not linked'
      );
      return false;
    }

    loc = model.context.getAttribLocation(model.handle, name);
    if (loc === -1) {
      return false;
    }
    model.attributeLocs[name] = loc;

    return true;
  };

  publicAPI.attachShader = (shader) => {
    if (shader.getHandle() === 0) {
      model.error = 'Shader object was not initialized, cannot attach it.';
      return false;
    }
    if (shader.getShaderType() === 'Unknown') {
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

    if (shader.getShaderType() === 'Vertex') {
      if (model.vertexShaderHandle !== 0) {
        model.comntext.detachShader(model.handle, model.vertexShaderHandle);
      }
      model.vertexShaderHandle = shader.getHandle();
    }
    if (shader.getShaderType() === 'Fragment') {
      if (model.fragmentShaderHandle !== 0) {
        model.context.detachShader(model.handle, model.fragmentShaderHandle);
      }
      model.fragmentShaderHandle = shader.getHandle();
    }

    model.context.attachShader(model.handle, shader.getHandle());
    publicAPI.setLinked(false);
    return true;
  };

  publicAPI.detachShader = (shader) => {
    if (shader.getHandle() === 0) {
      model.error = 'shader object was not initialized, cannot attach it.';
      return false;
    }
    if (shader.getShaderType() === 'Unknown') {
      model.error = 'Shader object is of type Unknown and cannot be used.';
      return false;
    }
    if (model.handle === 0) {
      model.errror = 'This shader prorgram has not been initialized yet.';
    }

    switch (shader.getShaderType()) {
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
    model.context = ctx;
    model.vertexShader.setContext(ctx);
    model.fragmentShader.setContext(ctx);
    model.geometryShader.setContext(ctx);
  };

  publicAPI.setLastCameraMTime = (mtime) => {
    model.lastCameraMTime = mtime;
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
  lastCameraMTime: null,
};

// ----------------------------------------------------------------------------

function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Instanciate internal objects
  model.attributesLocs = {};
  model.uniformLocs = {};
  model.vertexShader = vtkShader.newInstance();
  model.vertexShader.setShaderType('Vertex');
  model.fragmentShader = vtkShader.newInstance();
  model.fragmentShader.setShaderType('Fragment');
  model.geometryShader = vtkShader.newInstance();
  model.geometryShader.setShaderType('Geometry');

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['lastCameraMTime']);
  macro.setGet(publicAPI, model, [
    'error',
    'handle',
    'compiled',
    'bound',
    'md5Hash',
    'vertexShader',
    'fragmentShader',
    'geometryShader',
    'linked',
  ]);

  // Object methods
  vtkShaderProgram(publicAPI, model);
}

// ----------------------------------------------------------------------------

const newInstance = macro.newInstance(extend, 'vtkShaderProgram');

// ----------------------------------------------------------------------------

export default { newInstance, extend, substitute };
