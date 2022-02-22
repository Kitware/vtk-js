import macro from 'vtk.js/Sources/macros';
import vtkOpenGLTexture from 'vtk.js/Sources/Rendering/OpenGL/Texture';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkHelper from 'vtk.js/Sources/Rendering/OpenGL/Helper';
import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';
import vtkVertexArrayObject from 'vtk.js/Sources/Rendering/OpenGL/VertexArrayObject';

const { Representation } = vtkProperty;

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

function allocateBuffer(openGLRenderWindow, [width, height], filter, wrapping) {
  const gl = openGLRenderWindow.getContext();
  const texture = vtkOpenGLTexture.newInstance({
    autoParameters: false,
    wrapS: wrapping,
    wrapT: wrapping,
    minificationFilter: filter,
    magnificationFilter: filter,
    generateMipmap: false,
    openGLDataType: gl.FLOAT,
    baseLevel: 0,
    maxLevel: 0,
  });
  texture.setOpenGLRenderWindow(openGLRenderWindow);
  texture.setInternalFormat(gl.RGBA32F);
  texture.create2DFromRaw(width, height, 4, 'Float32Array', null);
  texture.activate();
  texture.sendParameters();
  texture.deactivate();
  return texture;
}

function allocateLICBuffer(openGLRenderWindow, size) {
  return allocateBuffer(
    openGLRenderWindow,
    size,
    vtkOpenGLTexture.Filter.NEAREST,
    vtkOpenGLTexture.Wrap.CLAMP_TO_EDGE
  );
}

function allocateNoiseBuffer(openGLRenderWindow, size) {
  return allocateBuffer(
    openGLRenderWindow,
    size,
    vtkOpenGLTexture.Filter.NEAREST,
    vtkOpenGLTexture.Wrap.CLAMP_TO_EDGE
  );
}

function allocateVectorBuffer(openGLRenderWindow, size) {
  return allocateBuffer(
    openGLRenderWindow,
    size,
    vtkOpenGLTexture.Filter.LINEAR,
    vtkOpenGLTexture.Wrap.CLAMP_TO_EDGE
  );
}

// ----------------------------------------------------------------------------
// vtkLICPingPongBufferManager methods
// ----------------------------------------------------------------------------

function vtkLICPingPongBufferManager(publicAPI, model) {
  model.classHierarchy.push('vtkLICPingPongBufferManager');
  if (!model._openGLRenderWindow) {
    console.error('Pass renderwindow to ping pong manager');
    return;
  }

  // Don't handle bind/restoring framebuffers, assume it has been done upstream

  model.quad = getQuadPoly(model._openGLRenderWindow);
  model.context = model._openGLRenderWindow.getContext();
  model.licTexture0 = allocateLICBuffer(model._openGLRenderWindow, model.size);
  model.seedTexture0 = allocateLICBuffer(model._openGLRenderWindow, model.size);
  model.licTexture1 = allocateLICBuffer(model._openGLRenderWindow, model.size);
  model.seedTexture1 = allocateLICBuffer(model._openGLRenderWindow, model.size);
  model.eeTexture = model.doEEPass
    ? allocateNoiseBuffer(model._openGLRenderWindow, model.size)
    : null;
  model.imageVectorTexture = model.doVTPass
    ? allocateVectorBuffer(model._openGLRenderWindow, model.size)
    : null;

  model.pingTextures[0] = model.licTexture0;
  model.pingTextures[1] = model.seedTexture0;

  model.pongTextures[0] = model.licTexture1;
  model.pongTextures[1] = model.seedTexture1;

  model.textures[0] = model.pingTextures;
  model.textures[1] = model.pongTextures;

  publicAPI.swap = () => {
    model.readIndex = 1 - model.readIndex;
  };
  publicAPI.renderQuad = (bounds, program) => {
    const poly = model.quad;
    const gl = model.context;
    let VAO = model.quadVAO;
    if (!VAO) {
      VAO = vtkVertexArrayObject.newInstance();
      VAO.setOpenGLRenderWindow(model._openGLRenderWindow);
      model.quadVAO = VAO;
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

  publicAPI.getLastLICBuffer = () =>
    model.readIndex === 0 ? model.licTexture0 : model.licTexture1;

  publicAPI.getLastSeedBuffer = () =>
    model.readIndex === 0 ? model.seedTexture0 : model.seedTexture1;

  publicAPI.getLICBuffer = () =>
    1 - model.readIndex === 0 ? model.licTexture0 : model.licTexture1;

  publicAPI.getSeedBuffer = () =>
    1 - model.readIndex === 0 ? model.seedTexture0 : model.seedTexture1;

  publicAPI.getLICTextureUnit = () => {
    const tex = model.textures[model.readIndex][0];
    tex.activate();
    return tex.getTextureUnit();
  };

  publicAPI.getSeedTextureUnit = () => {
    const tex = model.textures[model.readIndex][1];
    tex.activate();
    return tex.getTextureUnit();
  };

  publicAPI.getNoiseTextureUnit = (licPassNum = 0) => {
    if (licPassNum === 0) {
      model.noiseTexture.activate();
      return model.noiseTexture.getTextureUnit();
    }
    model.eeTexture.activate();
    return model.eeTexture.getTextureUnit();
  };

  publicAPI.getVectorTextureUnit = () => {
    model.vectorTexture.activate();
    return model.vectorTexture.getTextureUnit();
  };

  publicAPI.getImageVectorTextureUnit = () => {
    if (model.imageVectorTexture) {
      model.imageVectorTexture.activate();
      return model.imageVectorTexture.getTextureUnit();
    }
    return publicAPI.getVectorTextureUnit();
  };

  publicAPI.getMaskVectorTextureUnit = () => {
    if (model.maskVectorTexture) {
      model.maskVectorTexture.activate();
      return model.maskVectorTexture.getTextureUnit();
    }
    return publicAPI.getImageVectorTextureUnit();
  };

  publicAPI.clearBuffers = (clearEETex = false) => {
    const fb = model.framebuffer;
    const gl = model.context;

    fb.removeColorBuffer(0);
    fb.removeColorBuffer(1);
    fb.removeColorBuffer(2);
    fb.removeColorBuffer(3);
    fb.setColorBuffer(model.licTexture0, 0);
    fb.setColorBuffer(model.seedTexture0, 1);
    fb.setColorBuffer(model.licTexture1, 2);
    fb.setColorBuffer(model.seedTexture1, 3);
    const attachments = [
      gl.COLOR_ATTACHMENT0,
      gl.COLOR_ATTACHMENT1,
      gl.COLOR_ATTACHMENT2,
      gl.COLOR_ATTACHMENT3,
    ];

    if (clearEETex) {
      fb.removeColorBuffer(4);
      fb.setColorBuffer(model.eeTexture, 4);
      attachments.push(gl.COLOR_ATTACHMENT4);
    }
    gl.drawBuffers(attachments);
    gl.clearColor(0.0, 1.0, 0.0, 0.0);
    gl.disable(gl.SCISSOR_TEST);
    gl.disable(gl.BLEND);
    gl.clear(gl.COLOR_BUFFER_BIT);

    fb.removeColorBuffer(0);
    fb.removeColorBuffer(1);
    fb.removeColorBuffer(2);
    fb.removeColorBuffer(3);
    if (clearEETex) {
      fb.removeColorBuffer(4);
    }
    gl.drawBuffers([gl.NONE]);
  };

  publicAPI.clearBuffer = (texture) => {
    const fb = model.framebuffer;
    const gl = model.context;

    fb.removeColorBuffer(0);
    fb.setColorBuffer(texture, 0);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
    gl.clearColor(0.0, 1.0, 0.0, 0.0);
    gl.disable(gl.SCISSOR_TEST);
    gl.disable(gl.BLEND);
    gl.clear(gl.COLOR_BUFFER_BIT);
    fb.removeColorBuffer(texture, 0);
    gl.drawBuffers([gl.NONE]);
  };

  publicAPI.activateVectorTextures = () => {
    if (model.imageVectorTexture) {
      model.imageVectorTexture.activate();
    } else {
      model.vectorTexture.activate();
    }

    if (model.maskVectorTexture) {
      model.maskVectorTexture.activate();
    }
  };

  publicAPI.deactivateVectorTextures = () => {
    if (model.imageVectorTexture) {
      model.imageVectorTexture.deactivate();
    } else {
      model.vectorTexture.deactivate();
    }

    if (model.maskVectorTexture) {
      model.maskVectorTexture.deactivate();
    }
  };

  publicAPI.activateNoiseTexture = (licPassNum = 0) => {
    switch (licPassNum) {
      case 0:
        model.noiseTexture.activate();
        break;
      case 1:
        model.eeTexture.activate();
        break;
      default:
        console.error('Wrong LIC pass number');
    }
  };

  publicAPI.deactivateNoiseTexture = (licPassNum = 0) => {
    switch (licPassNum) {
      case 0:
        model.noiseTexture.deactivate();
        break;
      case 1:
        model.eeTexture.deactivate();
        break;
      default:
        console.error('Wrong LIC pass number');
    }
  };

  publicAPI.attachLICBuffers = () => {
    const readTex = model.textures[model.readIndex];
    const writeTex = model.textures[1 - model.readIndex];

    const fb = model.framebuffer;
    const gl = model.context;

    readTex[0].activate();
    readTex[1].activate();

    fb.removeColorBuffer(0);
    fb.removeColorBuffer(1);
    fb.setColorBuffer(writeTex[0], 0);
    fb.setColorBuffer(writeTex[1], 1);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
  };

  publicAPI.detachLICBuffers = () => {
    const readTex = model.textures[model.readIndex];

    const gl = model.context;
    const fb = model.framebuffer;

    readTex[0].deactivate();
    readTex[1].deactivate();

    fb.removeColorBuffer(0);
    fb.removeColorBuffer(1);
    gl.drawBuffers([gl.NONE]);
  };

  publicAPI.attachImageVectorBuffer = () => {
    const fb = model.framebuffer;
    const gl = model.context;

    model.vectorTexture.activate();
    fb.removeColorBuffer(0);
    fb.setColorBuffer(model.imageVectorTexture, 0);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
  };

  publicAPI.detachImageVectorBuffer = () => {
    const gl = model.context;
    const fb = model.framebuffer;

    model.vectorTexture.deactivate();
    fb.removeColorBuffer(0);
    gl.drawBuffers([gl.NONE]);
  };

  publicAPI.attachEEBuffer = () => {
    const readTex = model.textures[model.readIndex];
    readTex[0].activate();

    model.framebuffer.removeColorBuffer(0);
    model.framebuffer.setColorBuffer(model.eeTexture, 0);

    const gl = model.context;
    gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
  };

  publicAPI.detachEEBuffer = () => {
    const gl = model.context;
    const fb = model.framebuffer;

    fb.removeColorBuffer(0);
    gl.drawBuffers([gl.NONE]);

    const readTex = model.textures[model.readIndex];
    readTex[0].deactivate();
  };

  publicAPI.detachBuffers = () => {
    const gl = model.context;
    const fb = model.framebuffer;

    fb.removeColorBuffer(0);
    fb.removeColorBuffer(1);

    gl.drawBuffers([gl.NONE]);

    const readTex = model.textures[model.readIndex];
    const writeTex = model.textures[1 - model.readIndex];
    if (readTex[0]) {
      readTex[0].deactivate();
    }
    if (readTex[1]) {
      readTex[1].deactivate();
    }
    if (writeTex[0]) {
      writeTex[0].deactivate();
    }
    if (writeTex[1]) {
      writeTex[1].deactivate();
    }
    if (model.eeTexture) {
      model.eeTexture.deactivate();
    }
    if (model.noiseTexture) {
      model.noiseTexture.deactivate();
    }
  };

  publicAPI.getWriteIndex = () => 1 - model.readIndex;

  publicAPI.detachBuffers();
}

const DEFAULT_VALUES = {
  // _openGLRenderWindow: null,
  vectorTexture: null,
  maskVectorTexture: null,
  noiseTexture: null,
  doEEPass: false,
  doVTPass: false,
  readIndex: 0,
  quad: null,
  lastProgramHash: null,
  framebuffer: null,
  size: null,
  pingTextures: [],
  pongTextures: [],
  textures: [],
};

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);

  macro.get(publicAPI, model, ['readIndex']);
  macro.setGet(publicAPI, model, [
    'doEEPass',
    'doVTPass',
    '_openGLRenderWindow',
    'vectorTexture',
    'maskVectorTexture',
    'noiseTexture',
    'framebuffer',
    'size',
  ]);
  macro.moveToProtected(publicAPI, model, ['openGLRenderWindow']);

  // Object methods
  vtkLICPingPongBufferManager(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkLICPingPongBufferManager'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
