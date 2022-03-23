import Md5 from 'spark-md5';

import macro from 'vtk.js/Sources/macros';
import vtkShaderProgram from 'vtk.js/Sources/Rendering/OpenGL/ShaderProgram';

// ----------------------------------------------------------------------------

const SET_GET_FIELDS = ['lastShaderBound', 'context', '_openGLRenderWindow'];

// ----------------------------------------------------------------------------
// vtkShaderCache methods
// ----------------------------------------------------------------------------

function vtkShaderCache(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkShaderCache');

  publicAPI.replaceShaderValues = (VSSource, FSSource, GSSource) => {
    // first handle renaming any Fragment shader inputs
    // if we have a geometry shader. By default fragment shaders
    // assume their inputs come from a Vertex Shader. When we
    // have a Geometry shader we rename the frament shader inputs
    // to come from the geometry shader

    let nFSSource = FSSource;
    if (GSSource.length > 0) {
      nFSSource = vtkShaderProgram.substitute(
        nFSSource,
        'VSOut',
        'GSOut'
      ).result;
    }

    const gl2 = model._openGLRenderWindow.getWebgl2();

    let fragDepthString = '\n';

    let version = '#version 100\n';
    if (gl2) {
      version =
        '#version 300 es\n' +
        '#define attribute in\n' +
        '#define textureCube texture\n' +
        '#define texture2D texture\n' +
        '#define textureCubeLod textureLod\n' +
        '#define texture2DLod textureLod\n';
    } else {
      model.context.getExtension('OES_standard_derivatives');
      if (model.context.getExtension('EXT_frag_depth')) {
        fragDepthString = '#extension GL_EXT_frag_depth : enable\n';
      }
      if (model.context.getExtension('EXT_shader_texture_lod')) {
        fragDepthString +=
          '#extension GL_EXT_shader_texture_lod : enable\n' +
          '#define textureCubeLod textureCubeLodEXT\n' +
          '#define texture2DLod texture2DLodEXT';
      }
    }

    nFSSource = vtkShaderProgram.substitute(nFSSource, '//VTK::System::Dec', [
      `${version}\n`,
      gl2 ? '' : '#extension GL_OES_standard_derivatives : enable\n',
      fragDepthString,
      '#ifdef GL_FRAGMENT_PRECISION_HIGH',
      'precision highp float;',
      'precision highp int;',
      '#else',
      'precision mediump float;',
      'precision mediump int;',
      '#endif',
    ]).result;

    let nVSSource = vtkShaderProgram.substitute(
      VSSource,
      '//VTK::System::Dec',
      [
        `${version}\n`,
        '#ifdef GL_FRAGMENT_PRECISION_HIGH',
        'precision highp float;',
        'precision highp int;',
        '#else',
        'precision mediump float;',
        'precision mediump int;',
        '#endif',
      ]
    ).result;

    if (gl2) {
      nVSSource = vtkShaderProgram.substitute(
        nVSSource,
        'varying',
        'out'
      ).result;
      nFSSource = vtkShaderProgram.substitute(
        nFSSource,
        'varying',
        'in'
      ).result;

      let shaderOutputs = '';
      let outputCount = 0;
      while (nFSSource.includes(`gl_FragData[${outputCount}]`)) {
        nFSSource = vtkShaderProgram.substitute(
          nFSSource,
          `gl_FragData\\[${outputCount}\\]`,
          `fragOutput${outputCount}`
        ).result;
        shaderOutputs += `layout(location = ${outputCount}) out vec4 fragOutput${outputCount};\n`;
        outputCount++;
      }
      nFSSource = vtkShaderProgram.substitute(
        nFSSource,
        '//VTK::Output::Dec',
        shaderOutputs
      ).result;
    }

    // nFSSource = ShaderProgram.substitute(nFSSource, 'gl_FragData\\[0\\]',
    //   'gl_FragColor').result;

    const nGSSource = vtkShaderProgram.substitute(
      GSSource,
      '//VTK::System::Dec',
      version
    ).result;

    return { VSSource: nVSSource, FSSource: nFSSource, GSSource: nGSSource };
  };

  // return NULL if there is an issue
  publicAPI.readyShaderProgramArray = (
    vertexCode,
    fragmentCode,
    geometryCode
  ) => {
    const data = publicAPI.replaceShaderValues(
      vertexCode,
      fragmentCode,
      geometryCode
    );

    const shader = publicAPI.getShaderProgram(
      data.VSSource,
      data.FSSource,
      data.GSSource
    );

    return publicAPI.readyShaderProgram(shader);
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
    if (!publicAPI.bindShader(shader)) {
      return null;
    }

    return shader;
  };

  publicAPI.getShaderProgram = (vertexCode, fragmentCode, geometryCode) => {
    // compute the MD5 and the check the map
    const hashInput = `${vertexCode}${fragmentCode}${geometryCode}`;
    const result = Md5.hash(hashInput);

    // does it already exist?
    const loc = Object.keys(model.shaderPrograms).indexOf(result);

    if (loc === -1) {
      // create one
      const sps = vtkShaderProgram.newInstance();
      sps.setContext(model.context);
      sps.getVertexShader().setSource(vertexCode);
      sps.getFragmentShader().setSource(fragmentCode);
      if (geometryCode) {
        sps.getGeometryShader().setSource(geometryCode);
      }
      sps.setMd5Hash(result);
      model.shaderPrograms[result] = sps;
      return sps;
    }

    return model.shaderPrograms[result];
  };

  publicAPI.releaseGraphicsResources = (win) => {
    // NOTE:
    // In the current implementation as of October 26th, if a shader
    // program is created by ShaderCache then it should make sure
    // that it releases the graphics resources used by these programs.
    // It is not wisely for callers to do that since then they would
    // have to loop over all the programs were in use and invoke
    // release graphics resources individually.

    publicAPI.releaseCurrentShader();

    Object.keys(model.shaderPrograms)
      .map((key) => model.shaderPrograms[key])
      .forEach((sp) => sp.releaseGraphicsResources(win));
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
  shaderPrograms: null,
  context: null,
  // _openGLRenderWindow: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Internal objects
  model.shaderPrograms = {};

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, SET_GET_FIELDS);
  macro.moveToProtected(publicAPI, model, ['openGLRenderWindow']);

  // Object methods
  vtkShaderCache(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkShaderCache');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
