import macro from 'vtk.js/Sources/macros';
import vtkOpenGLTexture from 'vtk.js/Sources/Rendering/OpenGL/Texture';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkHelper from 'vtk.js/Sources/Rendering/OpenGL/Helper';
import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';
import vtkVertexArrayObject from 'vtk.js/Sources/Rendering/OpenGL/VertexArrayObject';
import vtkFrameBuffer from 'vtk.js/Sources/Rendering/OpenGL/Framebuffer';

import vtkLineIntegralConvolution2D from 'vtk.js/Sources/Rendering/OpenGL/SurfaceLIC/LineIntegralConvolution2D';
/* eslint-disable camelcase */
import vtkLineIntegralConvolution2D_quadVS from 'vtk.js/Sources/Rendering/OpenGL/SurfaceLIC/glsl/vtkLineIntegralConvolution2D_quadVS.glsl';
import vtkLineIntegralConvolution2D_SC from 'vtk.js/Sources/Rendering/OpenGL/SurfaceLIC/glsl/vtkLineIntegralConvolution2D_SC.glsl';
import vtkSurfaceLICInterface_DCpy from 'vtk.js/Sources/Rendering/OpenGL/SurfaceLIC/glsl/vtkSurfaceLICInterface_DCpy.glsl';
import vtkSurfaceLICInterface_CE from 'vtk.js/Sources/Rendering/OpenGL/SurfaceLIC/glsl/vtkSurfaceLICInterface_CE.glsl';
/* eslint-enable camelcase */
import seedrandom from 'seedrandom';

import {
  ContrastEnhanceMode,
  NoiseType,
} from 'vtk.js/Sources/Rendering/Core/SurfaceLICInterface/Constants';
import vtkSurfaceLICInterface from 'vtk.js/Sources/Rendering/Core/SurfaceLICInterface';

const { Representation } = vtkProperty;

// ----------------------------------------------------------------------------
// vtkLICInterface methods
// ----------------------------------------------------------------------------
function getQuadPoly(openGLRenderWindow) {
  const quad = vtkHelper.newInstance();
  quad.setOpenGLRenderWindow(openGLRenderWindow);
  // build the CABO
  const ptsArray = new Float32Array(12);
  for (let i = 0; i < 4; i++) {
    ptsArray[i * 3] = (i % 2) * 2 - 1.0;
    ptsArray[i * 3 + 1] = i > 1 ? 1.0 : -1.0;
    ptsArray[i * 3 + 2] = 0.0;
  }

  const tCoord = new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0]);

  const cellArray = new Uint16Array(8);
  cellArray[0] = 3;
  cellArray[1] = 0;
  cellArray[2] = 1;
  cellArray[3] = 3;
  cellArray[4] = 3;
  cellArray[5] = 0;
  cellArray[6] = 3;
  cellArray[7] = 2;
  const points = vtkDataArray.newInstance({
    numberOfComponents: 3,
    values: ptsArray,
  });
  points.setName('points');
  const cells = vtkDataArray.newInstance({
    numberOfComponents: 1,
    values: cellArray,
  });
  const tArray = vtkDataArray.newInstance({
    numberOfComponents: 2,
    values: tCoord,
  });

  quad.getCABO().createVBO(cells, 'polys', Representation.SURFACE, {
    points,
    cellOffset: 0,
    tcoords: tArray,
  });
  return quad;
}

function vtkOpenGLSurfaceLICInterface(publicAPI, model) {
  model.classHierarchy.push('vtkOpenGLSurfaceLICInterface');

  publicAPI.renderQuad = (bounds, program) => {
    const poly = model.licQuad;
    const gl = model.context;
    let VAO = model.licQuadVAO;
    if (!VAO) {
      VAO = vtkVertexArrayObject.newInstance();
      VAO.setOpenGLRenderWindow(model._openGLRenderWindow);
      model.licQuadVAO = VAO;
    }

    if (model.previousProgramHash !== program.getMd5Hash()) {
      VAO.shaderProgramChanged();
      poly.getCABO().bind();
      VAO.addAttributeArray(
        program,
        poly.getCABO(),
        'vertexDC',
        poly.getCABO().getVertexOffset(),
        poly.getCABO().getStride(),
        model.context.FLOAT,
        3,
        model.context.FALSE
      );
      VAO.addAttributeArray(
        program,
        poly.getCABO(),
        'tcoordDC',
        poly.getCABO().getTCoordOffset(),
        poly.getCABO().getStride(),
        model.context.FLOAT,
        2,
        model.context.FALSE
      );
      model.previousProgramHash = program.getMd5Hash();
    }
    gl.drawArrays(gl.TRIANGLES, 0, poly.getCABO().getElementCount());
    VAO.release();
  };

  function generateGaussianNoise(
    length,
    numberOfNoiseLevels,
    noiseImpulseProbability,
    noiseImpulseBackgroundValue,
    min,
    max
  ) {
    const N = 2048;
    const impulseProb = Math.max(0.0, Math.min(1.0, noiseImpulseProbability));
    const noise = Float32Array.from({ length: length * length }, () => {
      let val = 0;
      if (impulseProb === 1.0 || Math.random() > 1.0 - impulseProb) {
        for (let i = 0; i < N; ++i) {
          val += Math.random();
        }
      }
      return val;
    });
    // Normalize
    let maxVal = 0.0;
    let minVal = N + 1;
    noise.forEach((val) => {
      // Don't count 0s for minVal if impulseProb < 1.0
      if (impulseProb === 1.0) {
        minVal = val < minVal ? val : minVal;
      } else {
        minVal = val < minVal && val > 0.0 ? val : minVal;
      }
      maxVal = val > maxVal ? val : maxVal;
    });
    let diff = maxVal - minVal;
    if (diff === 0.0) {
      minVal = 0.0;
      if (maxVal === 0.0) {
        diff = 1.0;
      } else {
        diff = maxVal;
      }
    }
    const maxLevel = numberOfNoiseLevels - 1;
    const delta = maxLevel !== 0 ? 1.0 / maxLevel : 0.0;
    const noiseRange = max - min;
    return noise.map((val) => {
      const normalized = val < minVal ? val : (val - minVal) / diff;
      const l = Math.floor(normalized * numberOfNoiseLevels);
      const quantized = l > maxLevel ? maxLevel : l;
      if (val >= minVal) {
        if (numberOfNoiseLevels === 1) {
          return max;
        }
        return min + quantized * delta * noiseRange;
      }
      return noiseImpulseBackgroundValue;
    });
  }

  function generateUniformNoise(
    [width, height],
    numberOfNoiseLevels,
    min,
    max
  ) {
    const diff = max - min;
    return Float32Array.from({ length: width * height }, () => {
      let r = Math.random();
      r = Math.floor(r * numberOfNoiseLevels) / numberOfNoiseLevels;
      r = r * diff + min;
      if (r > 1.0) {
        return 1.0;
      }
      if (r < 0.0) {
        return 0.0;
      }
      return r;
    });
  }
  publicAPI.generateNoiseTexture = (length) => {
    if (!model.noiseTexture || model.licInterface.getRebuildNoiseTexture()) {
      model.licInterface.setRebuildNoiseTexture(false);
      if (model.noiseTexture) {
        model.noiseTexture.releaseGraphicsResources();
      }
      // Reseed RNG
      seedrandom(model.noiseGeneratorSeed, { global: true });
      let base = [];

      const {
        noiseTextureType,
        noiseGrainSize,
        numberOfNoiseLevels,
        noiseImpulseProbability,
        noiseImpulseBackgroundValue,
        minNoiseValue,
        maxNoiseValue,
      } = model.licInterface.get(
        'noiseTextureType',
        'noiseGrainSize',
        'numberOfNoiseLevels',
        'noiseImpulseProbability',
        'noiseImpulseBackgroundValue',
        'minNoiseValue',
        'maxNoiseValue'
      );
      switch (noiseTextureType) {
        case NoiseType.GAUSSIAN:
          base = generateGaussianNoise(
            Math.floor(length / noiseGrainSize),
            numberOfNoiseLevels,
            noiseImpulseProbability,
            noiseImpulseBackgroundValue,
            minNoiseValue,
            maxNoiseValue
          );
          break;
        case NoiseType.UNIFORM:
        default:
          base = generateUniformNoise(
            [
              Math.ceil(length / noiseGrainSize),
              Math.ceil(length / noiseGrainSize),
            ],
            numberOfNoiseLevels,
            minNoiseValue,
            maxNoiseValue
          );
      }
      const invGrainSize = 1.0 / noiseGrainSize;
      const values = Float32Array.from(
        { length: length * length * 4 },
        (val, index) => {
          const baseIndex = index / 4;
          if (index % 4 === 0) {
            const x = Math.floor((baseIndex % length) * invGrainSize);
            const y = Math.floor((baseIndex / length) * invGrainSize);
            return base[y * (length / noiseGrainSize) + x];
          }
          if (index % 4 === 1 || index % 4 === 3) {
            return 1.0;
          }
          return 0.0;
        }
      );

      const texture = vtkOpenGLTexture.newInstance({
        wrapS: vtkOpenGLTexture.Wrap.REPEAT,
        wrapT: vtkOpenGLTexture.Wrap.REPEAT,
        minificationFilter: vtkOpenGLTexture.Filter.NEAREST,
        magnificationFilter: vtkOpenGLTexture.Filter.NEAREST,
        generateMipMap: false,
        openGLDataType: model.context.FLOAT,
        baseLevel: 0,
        maxLevel: 0,
        autoParameters: false,
      });
      texture.setOpenGLRenderWindow(model._openGLRenderWindow);
      texture.create2DFromRaw(length, length, 4, 'Float32Array', values);
      texture.activate();
      texture.sendParameters();
      texture.deactivate();

      model.noiseTexture = texture;
    }
  };

  publicAPI.buildAShader = (fSource) =>
    model._openGLRenderWindow
      .getShaderCache()
      .readyShaderProgramArray(
        vtkLineIntegralConvolution2D_quadVS,
        fSource,
        ''
      );

  publicAPI.allocateTextures = () => {
    const nearest = vtkOpenGLTexture.Filter.NEAREST;
    const linear = vtkOpenGLTexture.Filter.LINEAR;
    const rw = model._openGLRenderWindow;
    if (!model.geometryImage) {
      model.geometryImage = publicAPI.allocateTexture(rw, nearest);
    }
    if (!model.vectorImage) {
      model.vectorImage = publicAPI.allocateTexture(rw, linear);
    }
    if (!model.maskVectorImage) {
      model.maskVectorImage = publicAPI.allocateTexture(rw, linear);
    }
    if (!model.LICImage) {
      model.LICImage = publicAPI.allocateTexture(rw, nearest);
    }
    if (!model.RGBColorImage) {
      model.RGBColorImage = publicAPI.allocateTexture(rw, nearest);
    }
    if (!model.HSLColorImage) {
      model.HSLColorImage = publicAPI.allocateTexture(rw, nearest);
    }
    if (!model.depthTexture) {
      model.depthTexture = publicAPI.allocateDepthTexture(rw);
    }
  };

  publicAPI.allocateTexture = (openGLRenderWindow, filter) => {
    const gl = model.context;
    const texture = vtkOpenGLTexture.newInstance({
      wrapS: vtkOpenGLTexture.Wrap.CLAMP_TO_EDGE,
      wrapT: vtkOpenGLTexture.Wrap.CLAMP_TO_EDGE,
      minificationFilter: filter,
      magnificationFilter: filter,
      generateMipmap: false,
      openGLDataType: gl.FLOAT,
      baseLevel: 0,
      maxLevel: 0,
      autoParameters: false,
    });
    texture.setOpenGLRenderWindow(openGLRenderWindow);
    texture.setInternalFormat(gl.RGBA32F);
    texture.create2DFromRaw(...model.size, 4, 'Float32Array', null);
    texture.activate();
    texture.sendParameters();
    texture.deactivate();
    return texture;
  };

  publicAPI.allocateDepthTexture = (openGLRenderWindow) => {
    const gl = model.context;
    const texture = vtkOpenGLTexture.newInstance({
      generateMipmap: false,
      openGLDataType: gl.FLOAT,
      autoParameters: false,
    });
    texture.setOpenGLRenderWindow(openGLRenderWindow);
    texture.createDepthFromRaw(...model.size, 'Float32Array', null);
    texture.activate();
    texture.sendParameters();
    texture.deactivate();
    return texture;
  };

  publicAPI.createFBO = () => {
    if (!model.framebuffer) {
      model.licHelper = null; // All buffers need rebuilding
      const fb = vtkFrameBuffer.newInstance();
      fb.setOpenGLRenderWindow(model._openGLRenderWindow);
      fb.saveCurrentBindingsAndBuffers();
      fb.create(...model.size);
      fb.populateFramebuffer();
      model.framebuffer = fb;
      fb.restorePreviousBindingsAndBuffers();
    }
  };

  publicAPI.completedGeometry = () => {
    const gl = model.context;
    const fb = model.framebuffer;
    fb.removeColorBuffer(0);
    fb.removeColorBuffer(1);
    fb.removeColorBuffer(2);
    fb.removeDepthBuffer();

    gl.drawBuffers([gl.NONE]);
    fb.restorePreviousBindingsAndBuffers();
  };

  publicAPI.buildAllShaders = () => {
    if (model.shadersNeedBuilding) {
      model.licColorPass = publicAPI.buildAShader(
        vtkLineIntegralConvolution2D_SC
      );
      model.licCopyPass = publicAPI.buildAShader(vtkSurfaceLICInterface_DCpy);
      model.enhanceContrastPass = publicAPI.buildAShader(
        vtkSurfaceLICInterface_CE
      );
      model.shadersNeedBuilding = false;
    }
  };

  publicAPI.initializeResources = () => {
    publicAPI.createFBO();
    publicAPI.generateNoiseTexture(model.licInterface.getNoiseTextureSize());
    publicAPI.allocateTextures();
    publicAPI.buildAllShaders();
    if (!model.licQuad) {
      model.licQuad = getQuadPoly(model._openGLRenderWindow);
    }
    if (!model.licHelper) {
      model.licHelper = vtkLineIntegralConvolution2D.newInstance();
    }
  };

  publicAPI.prepareForGeometry = () => {
    const fb = model.framebuffer;
    fb.saveCurrentBindingsAndBuffers();
    fb.bind();
    model.geometryImage.activate();
    model.vectorImage.activate();
    model.maskVectorImage.activate();
    fb.removeColorBuffer(0);
    fb.removeColorBuffer(1);
    fb.removeColorBuffer(2);
    fb.setColorBuffer(model.geometryImage, 0);
    fb.setColorBuffer(model.vectorImage, 1);
    fb.setColorBuffer(model.maskVectorImage, 2);
    fb.setDepthBuffer(model.depthTexture);

    const gl = model.context;
    gl.drawBuffers([
      gl.COLOR_ATTACHMENT0,
      gl.COLOR_ATTACHMENT1,
      gl.COLOR_ATTACHMENT2,
    ]);
    gl.viewport(0, 0, ...model.size);
    gl.scissor(0, 0, ...model.size);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.SCISSOR_TEST);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    // eslint-disable-next-line no-bitwise
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
  };

  // Copies the LIC image to the renderWindow. Will try to upscale the image to match the rw's size.
  publicAPI.copyToScreen = (windowSize) => {
    model.RGBColorImage.activate();
    model.depthTexture.activate();

    if (!model.licCopyPass) {
      publicAPI.initializeResources();
    }
    const copyPass = model.licCopyPass;
    model._openGLRenderWindow.getShaderCache().readyShaderProgram(copyPass);

    const gl = model.context;
    gl.viewport(0, 0, ...windowSize);
    gl.scissor(0, 0, ...windowSize);
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.SCISSOR_TEST);

    copyPass.setUniformi('texDepth', model.depthTexture.getTextureUnit());
    copyPass.setUniformi('texRGBColors', model.RGBColorImage.getTextureUnit());

    publicAPI.renderQuad(windowSize, copyPass);

    model.RGBColorImage.deactivate();
    model.depthTexture.deactivate();
  };

  publicAPI.combineColorsAndLIC = () => {
    const gl = model.context;
    const fb = model.framebuffer;
    fb.saveCurrentBindingsAndBuffers();
    fb.bind();
    fb.create(...model.size);
    fb.removeColorBuffer(0);
    fb.removeColorBuffer(1);
    fb.setColorBuffer(model.RGBColorImage, 0);
    fb.setColorBuffer(model.HSLColorImage, 1);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    gl.disable(gl.DEPTH_TEST);

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    model.vectorImage.activate();
    model.geometryImage.activate();
    model.LICImage.activate();

    if (!model.licColorPass) {
      publicAPI.initializeResources();
    }
    const colorPass = model.licColorPass;
    model._openGLRenderWindow.getShaderCache().readyShaderProgram(colorPass);
    colorPass.setUniformi('texVectors', model.vectorImage.getTextureUnit());
    colorPass.setUniformi(
      'texGeomColors',
      model.geometryImage.getTextureUnit()
    );

    const {
      colorMode,
      LICIntensity,
      mapModeBias,
      maskIntensity,
      maskColor,
      enhanceContrast,
      lowColorContrastEnhancementFactor,
      highColorContrastEnhancementFactor,
    } = model.licInterface.get(
      'colorMode',
      'LICIntensity',
      'mapModeBias',
      'maskIntensity',
      'maskColor',
      'enhanceContrast',
      'lowColorContrastEnhancementFactor',
      'highColorContrastEnhancementFactor'
    );
    colorPass.setUniformi('texLIC', model.LICImage.getTextureUnit());
    colorPass.setUniformi('uScalarColorMode', colorMode);
    colorPass.setUniformf('uLICIntensity', LICIntensity);
    colorPass.setUniformf('uMapBias', mapModeBias);
    colorPass.setUniformf('uMaskIntensity', maskIntensity);
    colorPass.setUniform3f('uMaskColor', ...maskColor);

    publicAPI.renderQuad(model.size, colorPass);

    model.vectorImage.deactivate();
    model.geometryImage.deactivate();
    model.LICImage.deactivate();

    fb.removeColorBuffer(0);
    fb.removeColorBuffer(1);
    gl.drawBuffers([gl.NONE]);

    if (
      enhanceContrast === ContrastEnhanceMode.COLOR ||
      enhanceContrast === ContrastEnhanceMode.BOTH
    ) {
      // min and max luminance values. Most of the time close to 0 and 1
      let min = 0.0;
      let max = 1.0;
      let lDiff = max - min;
      min += lDiff * lowColorContrastEnhancementFactor;
      max -= lDiff * highColorContrastEnhancementFactor;
      lDiff = max - min;

      fb.setColorBuffer(model.RGBColorImage);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

      model.geometryImage.activate();
      model.HSLColorImage.activate();
      model.LICImage.activate();

      if (!model.enhanceContrastPass) {
        publicAPI.initializeResources();
      }
      const { enhanceContrastPass } = model;
      model._openGLRenderWindow
        .getShaderCache()
        .readyShaderProgram(enhanceContrastPass);
      enhanceContrastPass.setUniformi(
        'texGeomColors',
        model.geometryImage.getTextureUnit()
      );
      enhanceContrastPass.setUniformi(
        'texHSLColors',
        model.HSLColorImage.getTextureUnit()
      );
      enhanceContrastPass.setUniformi(
        'texLIC',
        model.LICImage.getTextureUnit()
      );
      enhanceContrastPass.setUniformf('uLMin', min);
      enhanceContrastPass.setUniformf('uLMaxMinDiff', lDiff);
      publicAPI.renderQuad(model.size, enhanceContrastPass);

      model.geometryImage.deactivate();
      model.HSLColorImage.deactivate();
      model.LICImage.deactivate();

      fb.removeColorBuffer(0);
      gl.drawBuffers([gl.NONE]);
    }

    fb.restorePreviousBindingsAndBuffers();
  };

  publicAPI.applyLIC = () => {
    const options = model.licInterface.get(
      'stepSize',
      'numberOfSteps',
      'enhancedLIC',
      'enhanceContrast',
      'lowLICContrastEnhancementFactor',
      'highLICContrastEnhancementFactor',
      'antiAlias',
      'normalizeVectors',
      'maskThreshold',
      'transformVectors'
    );
    const resultTexture = model.licHelper.executeLIC(
      model.size,
      model.vectorImage,
      model.maskVectorImage,
      model.noiseTexture,
      model._openGLRenderWindow,
      options
    );

    if (!resultTexture) {
      console.error('Failed to compute image LIC');
      model.LICImage = null;
      return;
    }
    model.LICImage = resultTexture;
  };

  publicAPI.setSize = (size) => {
    // If size changed, reallocate fb and textures
    if (Array.isArray(size) && size.length === 2) {
      if (
        !model.size ||
        model.size[0] !== size[0] ||
        model.size[1] !== size[1]
      ) {
        model.size = size;
        publicAPI.releaseGraphicsResources();
      }
    }
  };

  publicAPI.releaseGraphicsResources = () => {
    if (model.geometryImage) {
      model.geometryImage.releaseGraphicsResources();
      model.geometryImage = null;
    }
    if (model.vectorImage) {
      model.vectorImage.releaseGraphicsResources();
      model.vectorImage = null;
    }
    if (model.maskVectorImage) {
      model.maskVectorImage.releaseGraphicsResources();
      model.maskVectorImage = null;
    }
    if (model.LICImage) {
      model.LICImage.releaseGraphicsResources();
      model.LICImage = null;
    }
    if (model.RGBColorImage) {
      model.RGBColorImage.releaseGraphicsResources();
      model.RGBColorImage = null;
    }
    if (model.HSLColorImage) {
      model.HSLColorImage.releaseGraphicsResources();
      model.HSLColorImage = null;
    }
    if (model.depthTexture) {
      model.depthTexture.releaseGraphicsResources();
      model.depthTexture = null;
    }
    if (model.framebuffer) {
      model.framebuffer.releaseGraphicsResources();
      model.framebuffer = null;
    }
  };
}

const DEFAULT_VALUES = {
  context: null,
  // _openGLRenderWindow: null,
  shadersNeedBuilding: true,
  reallocateTextures: true,
  size: null,

  licInterface: null,
};

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inherit
  vtkSurfaceLICInterface.extend(publicAPI, model, initialValues);

  macro.obj(publicAPI, model);

  macro.setGet(publicAPI, model, [
    'context',
    '_openGLRenderWindow',
    'reallocateTextures',
    'licInterface',
    'size',
  ]);
  macro.moveToProtected(publicAPI, model, ['openGLRenderWindow']);

  // Object methods
  vtkOpenGLSurfaceLICInterface(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkSurfaceLICInterface');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
