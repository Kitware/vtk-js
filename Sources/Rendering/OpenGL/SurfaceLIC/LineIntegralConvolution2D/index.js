import macro from 'vtk.js/Sources/macros';

/* eslint-disable camelcase */
import vtkLineIntegralConvolution2D_LIC0 from 'vtk.js/Sources/Rendering/OpenGL/SurfaceLIC/glsl/vtkLineIntegralConvolution2D_LIC0.glsl';
import vtkLineIntegralConvolution2D_LICI from 'vtk.js/Sources/Rendering/OpenGL/SurfaceLIC/glsl/vtkLineIntegralConvolution2D_LICI.glsl';
import vtkLineIntegralConvolution2D_LICN from 'vtk.js/Sources/Rendering/OpenGL/SurfaceLIC/glsl/vtkLineIntegralConvolution2D_LICN.glsl';
import vtkLineIntegralConvolution2D_CE from 'vtk.js/Sources/Rendering/OpenGL/SurfaceLIC/glsl/vtkLineIntegralConvolution2D_CE.glsl';
import vtkLineIntegralConvolution2D_EE from 'vtk.js/Sources/Rendering/OpenGL/SurfaceLIC/glsl/vtkLineIntegralConvolution2D_EE.glsl';
import vtkLineIntegralConvolution2D_AAH from 'vtk.js/Sources/Rendering/OpenGL/SurfaceLIC/glsl/vtkLineIntegralConvolution2D_AAH.glsl';
import vtkLineIntegralConvolution2D_VT from 'vtk.js/Sources/Rendering/OpenGL/SurfaceLIC/glsl/vtkLineIntegralConvolution2D_VT.glsl';
import vtkLineIntegralConvolution2D_AAV from 'vtk.js/Sources/Rendering/OpenGL/SurfaceLIC/glsl/vtkLineIntegralConvolution2D_AAV.glsl';
import vtkLineIntegralConvolution2D_quadVS from 'vtk.js/Sources/Rendering/OpenGL/SurfaceLIC/glsl/vtkLineIntegralConvolution2D_quadVS.glsl';
/* eslint-enable camelcase */

import vtkShaderProgram from 'vtk.js/Sources/Rendering/OpenGL/ShaderProgram';
import vtkFrameBuffer from 'vtk.js/Sources/Rendering/OpenGL/Framebuffer';

import vtkLICPingPongBufferManager from 'vtk.js/Sources/Rendering/OpenGL/SurfaceLIC/LineIntegralConvolution2D/pingpong';

import { ContrastEnhanceMode } from 'vtk.js/Sources/Rendering/Core/SurfaceLICInterface/Constants';

function getVectorLookupProgram(normalize = true) {
  // lookup the vector and normalize
  const getNormVecSrc = `
    vec2 getVector( vec2 vectc )\n
      {\n
      vec2 V = texture2D( texVectors, vectc ).xy;\n
      // normalize if |V| not 0\n
      float lenV = length( V );\n
      if ( lenV > 1.0e-8 )\n
        {\n
        return V/lenV;\n
        }\n
      else\n
        {\n
        return vec2( 0.0, 0.0 );\n
        }\n
      }\n
    `;

  // lookup the vector
  const getVecSrc = `
    vec2 getVector( vec2 vectc )\n
      {\n
      return texture2D( texVectors, vectc ).xy;\n
      }\n
    `;

  if (normalize) {
    return getNormVecSrc;
  }
  return getVecSrc;
}

function vtkLineIntegralConvolution2D(publicAPI, model) {
  model.classHierarchy.push('vtkLineIntegralConvolution2D');

  publicAPI.buildAShader = (fSource) =>
    model._openGLRenderWindow
      .getShaderCache()
      .readyShaderProgramArray(
        vtkLineIntegralConvolution2D_quadVS,
        fSource,
        ''
      );

  publicAPI.dumpTextureValues = (
    texture,
    [width, height],
    context = model.context,
    openGLRenderWindow = model._openGLRenderWindow,
    nComp = 4
  ) => {
    // To get texture values in es 2.0, we need to attach the texture to a fbo,
    // then use glReadPixels
    const fb = vtkFrameBuffer.newInstance();
    const gl = context;
    let pixels = null;
    fb.setOpenGLRenderWindow(openGLRenderWindow);
    fb.saveCurrentBindingsAndBuffers();
    fb.create(width, height);
    fb.populateFramebuffer();
    fb.setColorBuffer(texture);
    pixels = new Float32Array(width * height * nComp);
    gl.readPixels(
      0,
      0,
      width,
      height,
      nComp === 4 ? gl.RGBA : gl.RGB,
      gl.FLOAT,
      pixels
    );
    fb.restorePreviousBindingsAndBuffers();
    return pixels;
  };

  publicAPI.getTextureMinMax = (
    texture,
    size,
    context = model.context,
    openGLRenderWindow = model._openGLRenderWindow
  ) => {
    const values = publicAPI.dumpTextureValues(
      texture,
      size,
      context,
      openGLRenderWindow,
      4
    );

    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;
    for (let i = 0; i < values.length; i += 4) {
      // Make sure the current pixel is inside the rendered geometry (g === 0)
      if (values[i + 1] === 0.0) {
        const val = values[i];
        if (val < min) {
          min = val;
        }
        if (val > max) {
          max = val;
        }
      }
    }

    return { min, max };
  };

  publicAPI.getComponentSelectionProgram = (ids) => {
    const compNames = 'xyzw';
    return `.${compNames[ids[0]]}${compNames[ids[1]]}`;
  };

  publicAPI.buildShaders = () => {
    model.LIC0ShaderProgram = publicAPI.buildAShader(
      vtkLineIntegralConvolution2D_LIC0
    );

    const VTFSource = vtkShaderProgram.substitute(
      vtkLineIntegralConvolution2D_VT,
      '//VTK::LICComponentSelection::Impl',
      `vec2 V = texture2D(texVectors, tcoordVC.st)${publicAPI.getComponentSelectionProgram(
        model.componentIds
      )};`
    ).result;
    model.VTProgram = publicAPI.buildAShader(VTFSource);

    const LICISource = vtkShaderProgram.substitute(
      vtkLineIntegralConvolution2D_LICI,
      '//VTK::LICVectorLookup::Impl',
      getVectorLookupProgram(model.normalizeVectors),
      true
    ).result;

    model.LICIShaderProgram = publicAPI.buildAShader(LICISource);
    model.LICNShaderProgram = publicAPI.buildAShader(
      vtkLineIntegralConvolution2D_LICN
    );
    model.CEProgram = publicAPI.buildAShader(vtkLineIntegralConvolution2D_CE);
    model.EEProgram = publicAPI.buildAShader(vtkLineIntegralConvolution2D_EE);
    model.AAHProgram = publicAPI.buildAShader(vtkLineIntegralConvolution2D_AAH);
    model.AAVProgram = publicAPI.buildAShader(vtkLineIntegralConvolution2D_AAV);
  };

  // factorized out frequent patterns
  function setLICUniforms(program, bufs) {
    program.setUniformi('texLIC', bufs.getLICTextureUnit());
    program.setUniformi('texSeedPts', bufs.getSeedTextureUnit());
  }

  function renderPingPong(bufs, size, program) {
    bufs.attachLICBuffers();
    bufs.renderQuad(size, program);
    bufs.detachLICBuffers();
    bufs.swap();
  }

  publicAPI.executeLIC = (
    size,
    vectorTexture,
    maskVectorTexture,
    noiseTexture,
    openGLRenderWindow,
    options
  ) => {
    model._openGLRenderWindow = openGLRenderWindow;
    model.context = openGLRenderWindow.getContext();
    Object.assign(model, options);
    if (size[0] <= 0.0 || size[1] <= 0.0) {
      return null;
    }

    const tcScale = [1.0 / size[0], 1.0 / size[1]];
    let stepSize =
      model.stepSize *
      Math.sqrt(tcScale[0] * tcScale[0] + tcScale[1] * tcScale[1]);
    if (stepSize <= 0) {
      stepSize = 1.0e-10;
    }

    const gl = model.context;

    let fb = model.framebuffer;
    if (!fb || size[0] !== fb.getSize()[0] || size[1] !== fb.getSize()[1]) {
      fb = vtkFrameBuffer.newInstance();
      fb.setOpenGLRenderWindow(model._openGLRenderWindow);
      fb.saveCurrentBindingsAndBuffers();
      fb.create(...size);
      fb.populateFramebuffer();
      fb.restorePreviousBindingsAndBuffers();
      model.framebuffer = fb;
    }
    fb.saveCurrentBindingsAndBuffers();
    fb.bind();

    gl.viewport(0, 0, ...size);
    gl.scissor(0, 0, ...size);

    if (model.shadersNeedBuild) {
      publicAPI.buildShaders();
      model.shadersNeedBuild = false;
    }

    if (!model.bufs) {
      model.bufs = vtkLICPingPongBufferManager.newInstance({
        openGLRenderWindow,
        doEEPass: model.enhancedLIC,
        doVTPass: model.transformVectors,
        vectorTexture,
        maskVectorTexture,
        noiseTexture,
        framebuffer: fb,
        size,
      });
    } else {
      model.bufs.setVectorTexture(vectorTexture);
      model.bufs.setMaskVectorTexture(maskVectorTexture);
      model.bufs.setNoiseTexture(noiseTexture);
    }

    const noiseBoundsPt1 = [
      (noiseTexture.getWidth() + 1) / size[0],
      (noiseTexture.getHeight() + 1) / size[1],
    ];

    const dx = 1.0 / size[0];
    const dy = 1.0 / size[1];

    const shaderCache = model._openGLRenderWindow.getShaderCache();

    if (model.transformVectors) {
      const VTShaderProgram = model.VTProgram;
      shaderCache.readyShaderProgram(VTShaderProgram);
      model.bufs.attachImageVectorBuffer();
      VTShaderProgram.setUniform2f('uTexSize', ...size);
      VTShaderProgram.setUniformi(
        'texVectors',
        model.bufs.getVectorTextureUnit()
      );
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      model.bufs.renderQuad(size, VTShaderProgram);
      model.bufs.detachImageVectorBuffer();
    }

    // first pass
    // initialize convolution and seeds
    model.bufs.clearBuffers(model.enhancedLIC);

    model.bufs.activateVectorTextures();
    model.bufs.activateNoiseTexture(0);

    const { LIC0ShaderProgram } = model;
    shaderCache.readyShaderProgram(LIC0ShaderProgram);
    LIC0ShaderProgram.setUniformi('uStepNo', 0);
    LIC0ShaderProgram.setUniformi('uPassNo', 0);
    LIC0ShaderProgram.setUniformf('uMaskThreshold', model.maskThreshold);
    LIC0ShaderProgram.setUniform2f('uNoiseBoundsPt1', ...noiseBoundsPt1);
    LIC0ShaderProgram.setUniformi(
      'texMaskVectors',
      model.bufs.getMaskVectorTextureUnit()
    );
    LIC0ShaderProgram.setUniformi('texLIC', model.bufs.getLICTextureUnit());
    LIC0ShaderProgram.setUniformi(
      'texNoise',
      model.bufs.getNoiseTextureUnit(0)
    );
    renderPingPong(model.bufs, size, LIC0ShaderProgram);

    // backward lic
    const { LICIShaderProgram } = model;
    shaderCache.readyShaderProgram(LICIShaderProgram);
    LICIShaderProgram.setUniformi('uPassNo', 0);
    LICIShaderProgram.setUniformf('uStepSize', -stepSize);
    LICIShaderProgram.setUniform2f('uNoiseBoundsPt1', ...noiseBoundsPt1);
    LICIShaderProgram.setUniformi(
      'texVectors',
      model.bufs.getImageVectorTextureUnit()
    );
    LICIShaderProgram.setUniformi(
      'texNoise',
      model.bufs.getNoiseTextureUnit(0)
    );
    for (let stepIdx = 0; stepIdx < model.numberOfSteps; ++stepIdx) {
      setLICUniforms(LICIShaderProgram, model.bufs);
      renderPingPong(model.bufs, size, LICIShaderProgram);
    }

    // initialize seeds
    shaderCache.readyShaderProgram(LIC0ShaderProgram);
    LIC0ShaderProgram.setUniformi('uStepNo', 1);
    setLICUniforms(LIC0ShaderProgram, model.bufs);
    renderPingPong(model.bufs, size, LIC0ShaderProgram);

    // forward LIC
    shaderCache.readyShaderProgram(LICIShaderProgram);
    LICIShaderProgram.setUniformf('uStepSize', stepSize);
    for (let stepIdx = 0; stepIdx < model.numberOfSteps; ++stepIdx) {
      setLICUniforms(LICIShaderProgram, model.bufs);
      renderPingPong(model.bufs, size, LICIShaderProgram);
    }

    model.bufs.deactivateNoiseTexture(0);
    model.bufs.deactivateVectorTextures();

    // finalize LIC
    const { LICNShaderProgram } = model;
    shaderCache.readyShaderProgram(LICNShaderProgram);
    LICNShaderProgram.setUniformi('texLIC', model.bufs.getLICTextureUnit());
    renderPingPong(model.bufs, size, LICNShaderProgram);

    // end of first-pass lic
    if (model.enhancedLIC) {
      if (
        model.enhanceContrast === ContrastEnhanceMode.LIC ||
        model.enhanceContrast === ContrastEnhanceMode.BOTH
      ) {
        publicAPI.contrastEnhance(false, size);
      }

      // EE stage
      model.bufs.attachEEBuffer();
      const { EEProgram } = model;
      shaderCache.readyShaderProgram(EEProgram);
      EEProgram.setUniformi('texLIC', model.bufs.getLICTextureUnit());
      EEProgram.setUniformf('uDx', dx);
      EEProgram.setUniformf('uDy', dy);
      model.bufs.renderQuad(size, EEProgram);
      model.bufs.detachEEBuffer();

      // begin second pass LIC
      // clear buffers
      model.bufs.detachBuffers();
      model.bufs.clearBuffers(false);
      model.bufs.activateVectorTextures();
      model.bufs.activateNoiseTexture(1);

      // initialize convolution and seeds
      shaderCache.readyShaderProgram(LIC0ShaderProgram);
      LIC0ShaderProgram.setUniformi('uStepNo', 0);
      LIC0ShaderProgram.setUniformi('uPassNo', 1);
      setLICUniforms(LIC0ShaderProgram, model.bufs);
      LIC0ShaderProgram.setUniformi(
        'texNoise',
        model.bufs.getNoiseTextureUnit(1)
      );
      renderPingPong(model.bufs, size, LIC0ShaderProgram);

      // backward LIC
      shaderCache.readyShaderProgram(LICIShaderProgram);
      LICIShaderProgram.setUniformi('uPassNo', 1);
      LICIShaderProgram.setUniformf('uStepSize', -stepSize);
      LICIShaderProgram.setUniformi(
        'texNoise',
        model.bufs.getNoiseTextureUnit(1)
      );
      const nSteps = model.numberOfSteps / 2;
      for (let stepIdx = 0; stepIdx < nSteps; ++stepIdx) {
        setLICUniforms(LICIShaderProgram, model.bufs);
        renderPingPong(model.bufs, size, LICIShaderProgram);
      }

      // initialize seeds
      shaderCache.readyShaderProgram(LIC0ShaderProgram);
      LIC0ShaderProgram.setUniformi('uStepNo', 1);
      setLICUniforms(LIC0ShaderProgram, model.bufs);
      renderPingPong(model.bufs, size, LIC0ShaderProgram);

      // forward LIC
      shaderCache.readyShaderProgram(LICIShaderProgram);
      LICIShaderProgram.setUniformf('uStepSize', stepSize);
      for (let stepIdx = 0; stepIdx < nSteps; ++stepIdx) {
        setLICUniforms(LICIShaderProgram, model.bufs);
        renderPingPong(model.bufs, size, LICIShaderProgram);
      }

      model.bufs.deactivateNoiseTexture(1);
      model.bufs.deactivateVectorTextures();

      // finalize LIC
      shaderCache.readyShaderProgram(LICNShaderProgram);
      LICNShaderProgram.setUniformi('texLIC', model.bufs.getLICTextureUnit());
      LICNShaderProgram.setUniformi(
        'texSeedPts',
        model.bufs.getSeedTextureUnit()
      );
      renderPingPong(model.bufs, size, LICNShaderProgram);
    }

    if (model.antiAlias) {
      const AAHShaderProgram = model.AAHProgram;
      shaderCache.readyShaderProgram(AAHShaderProgram);
      AAHShaderProgram.setUniformi('texLIC', model.bufs.getLICTextureUnit());
      AAHShaderProgram.setUniformf('uDx', dx);

      const AAVShaderProgram = model.AAVProgram;
      shaderCache.readyShaderProgram(AAVShaderProgram);
      AAVShaderProgram.setUniformi('texLIC', model.bufs.getLICTextureUnit());
      AAVShaderProgram.setUniformf('uDy', dy);

      for (let i = 0; i < model.antiAlias; ++i) {
        // Vertical pass
        shaderCache.readyShaderProgram(AAHShaderProgram);
        setLICUniforms(AAHShaderProgram, model.bufs);
        renderPingPong(model.bufs, size, AAHShaderProgram);
        // Horizontal pass
        shaderCache.readyShaderProgram(AAVShaderProgram);
        setLICUniforms(AAVShaderProgram, model.bufs);
        renderPingPong(model.bufs, size, AAVShaderProgram);
      }
    }

    if (
      model.enhanceContrast === ContrastEnhanceMode.LIC ||
      model.enhanceContrast === ContrastEnhanceMode.BOTH
    ) {
      publicAPI.contrastEnhance(true, size);
    }

    model.bufs.detachBuffers();
    fb.restorePreviousBindingsAndBuffers();
    return model.bufs.getLastLICBuffer();
  };

  publicAPI.contrastEnhance = (isSecondStage, size) => {
    const shaderCache = model._openGLRenderWindow.getShaderCache();

    let { min, max } = publicAPI.getTextureMinMax(
      model.bufs.getLastLICBuffer(),
      size,
      model.context,
      model._openGLRenderWindow
    );

    if (max <= min || max > 1.0 || min < 0) {
      console.error('Invalid color range: ', min, max);
      min = 0.0;
      max = 1.0;
    }

    let diff = max - min;
    if (isSecondStage) {
      min += diff * model.lowLICContrastEnhancementFactor;
      max -= diff * model.highLICContrastEnhancementFactor;
      diff = max - min;
    }

    const { CEProgram } = model;
    shaderCache.readyShaderProgram(CEProgram);
    CEProgram.setUniformi('texLIC', model.bufs.getLICTextureUnit());
    CEProgram.setUniformf('uMin', min);
    CEProgram.setUniformf('uMaxMinDiff', diff);
    renderPingPong(model.bufs, size, CEProgram);
  };
}

const DEFAULT_VALUES = {
  shadersNeedBuild: true,
  stepSize: 1,
  numberOfSteps: 10,
  enhancedLIC: true,
  enhanceContrast: false,
  lowContrastEnhancementFactor: 0,
  highContrastEnhancementFactor: 0,
  antiAlias: 0,
  componentIds: [0, 1],
  normalizeVectors: true,
  maskThreshold: 0.0,
  transformVectors: true,
  bufs: null,

  isComposite: true,
};

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);

  macro.setGet(publicAPI, model, [
    'context',
    '_openGLRenderWindow',

    'nuberOfSteps',
    'stepSize',
    'normalizeVectors',
    'maskThreshold',
    'enhancedLIC',
    'enhanceContrast',
    'lowLICContrastEnhancementFactor',
    'highLICContrastEnhancementFactor',
    'antiAlias',
    'componentIds',
    'isComposite',
  ]);
  macro.moveToProtected(publicAPI, model, ['openGLRenderWindow']);

  // Object methods
  vtkLineIntegralConvolution2D(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkLineIntegralConvolution2D'
);

export default { newInstance, extend };
