import * as macro from '../../../macro';
import ShaderProgram from '../ShaderProgram';
import Shader from '../Shader';
import md5 from 'blueimp-md5';

// ----------------------------------------------------------------------------

const SET_GET_FIELDS = [
  'lastShaderBound',
];

// ----------------------------------------------------------------------------
// vtkShader methods
// ----------------------------------------------------------------------------

function shaderCache(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkShader');

  publicAPI.replaceShaderValues = (VSSource, FSSource, GSSource) => {
    // first handle renaming any Fragment shader inputs
    // if we have a geometry shader. By deafult fragment shaders
    // assume their inputs come from a Vertex Shader. When we
    // have a Geometry shader we rename the frament shader inputs
    // to come from the geometry shader

    let nFSSource = FSSource;
    if (GSSource.length > 0) {
      nFSSource = ShaderProgram.substitute(nFSSource, 'VSOut', 'GSOut').result;
    }

    const version = '#version 100\n';

    const nVSSource = ShaderProgram.substitute(VSSource, '//VTK::System::Dec',
      version).result;

    nFSSource = ShaderProgram.substitute(nFSSource, '//VTK::System::Dec',
      version);

    const nGSSource = ShaderProgram.substitute(GSSource, '//VTK::System::Dec',
      version);

    return { VSSource: nVSSource, FSSource: nFSSource, GSSource: nGSSource };
  };

  // return NULL if there is an issue
  publicAPI.readyShaderProgram = (vertexCode, fragmentCode, geometryCode) => {
    const data = model.replaceShaderValues(vertexCode, fragmentCode, geometryCode);

    const shader =
      model.getShaderProgram(
        data.VSSource, data.FSSource, data.GSSource);

    return model.readyShaderProgram(shader);
  };

  publicAPI.readyShaderProgram = (shader) => {
    if (!shader) {
      return null;
    }

    // compile if needed
    if (!shader.getCompiled() && !shader.compileShader()) {
      return null;
    }

    // bind if needed
    if (!model.bindShader(shader)) {
      return null;
    }

    return shader;
  };

  publicAPI.getShaderProgram = (vertexCode, fragmentCode, geometryCode) => {
    // compute the MD5 and the check the map
    const hashInput = `${vertexCode}${fragmentCode}${geometryCode}`;
    const result = md5(hashInput);

    // does it already exist?
    const loc = Object.keys(model.shaderPrograms).indexOf(result);

    if (loc === -1) {
      // create one
      const sps = ShaderProgram.newInstance();
      sps.getVertexShader().setSource(vertexCode);
      sps.getFragmentShader().setSource(fragmentCode);
      if (geometryCode) {
        sps.getGeometryShader().setSource(geometryCode);
      }
      sps.setMD5Hash(result);
      model.shaderPrograms[result] = sps;
      return sps;
    }

    return model.shaderPrograms[result];
  };

  publicAPI.releaseGraphicsResources = (win) => {
    // NOTE:
    // In the current implementation as of October 26th, if a shader
    // program is created by ShaderCache then it should make sure
    // that it releases the graphics resouces used by these programs.
    // It is not wisely for callers to do that since then they would
    // have to loop over all the programs were in use and invoke
    // release graphics resources individually.

    model.releaseCurrentShader();

    Object.values(model.shaderPrograms).forEach(sp => {
      sp.releaseGraphicsResources(win);
    });
  };

  publicAPI.releaseGraphicsResources = () => {
    // release prior shader
    if (model.astShaderBound) {
      model.lastShaderBound.release();
      model.lastShaderBound = null;
    }
  };

  publicAPI.bindShader = (shader) => {
    if (model.lastShaderBound === shader) {
      return 1;
    }

    // release prior shader
    if (model.lastShaderBound) {
      model.lastShaderBound.release();
    }
    shader.bind();
    model.lastShaderBound = shader;
    return 1;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  lastShaderBound: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Internal objects
  model.attributesLocs = {};
  model.uniformLocs = {};
  model.vertexShader = Shader.newInstance();
  model.fragmentShader = Shader.newInstance();
  model.geometryShader = Shader.newInstance();

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, SET_GET_FIELDS);

  // Object methods
  shaderCache(publicAPI, model);

  return Object.freeze(publicAPI);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
