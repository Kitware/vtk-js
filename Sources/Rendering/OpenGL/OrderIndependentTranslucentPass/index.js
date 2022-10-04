import macro from 'vtk.js/Sources/macros';
import vtkOpenGLTexture from 'vtk.js/Sources/Rendering/OpenGL/Texture';
import vtkOpenGLFramebuffer from 'vtk.js/Sources/Rendering/OpenGL/Framebuffer';
import vtkRenderPass from 'vtk.js/Sources/Rendering/SceneGraph/RenderPass';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkHelper from 'vtk.js/Sources/Rendering/OpenGL/Helper';
import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';
import vtkShaderProgram from 'vtk.js/Sources/Rendering/OpenGL/ShaderProgram';
import vtkVertexArrayObject from 'vtk.js/Sources/Rendering/OpenGL/VertexArrayObject';

const { Representation } = vtkProperty;
const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------

function translucentShaderReplacement(shaders) {
  const substituteRes = vtkShaderProgram.substitute(
    shaders.Fragment,
    '//VTK::RenderPassFragmentShader::Impl',
    `
      float weight = gl_FragData[0].a * pow(max(1.1 - gl_FragCoord.z, 0.0), 2.0);
      gl_FragData[0] = vec4(gl_FragData[0].rgb*weight, gl_FragData[0].a);
      gl_FragData[1].r = weight;
    `,
    false
  );
  shaders.Fragment = substituteRes.result;
}

const oitpFragTemplate = `//VTK::System::Dec

in vec2 tcoord;

uniform sampler2D translucentRTexture;
uniform sampler2D translucentRGBATexture;

// the output of this shader
//VTK::Output::Dec

void main()
{
  vec4 t1Color = texture(translucentRGBATexture, tcoord);
  float t2Color = texture(translucentRTexture, tcoord).r;
  gl_FragData[0] = vec4(t1Color.rgb/max(t2Color,0.01), 1.0 - t1Color.a);
}
`;

function vtkOpenGLOrderIndependentTranslucentPass(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLOrderIndependentTranslucentPass');

  // build vertices etc
  publicAPI.createVertexBuffer = () => {
    // 4 corner points in clipping space in order (x, y, z) where z is always set to -1
    // prettier-ignore
    const ptsArray = new Float32Array([
      -1, -1, -1, 1,
      -1, -1, -1, 1,
      -1, 1, 1, -1,
    ]);

    // 4 corresponding corner points in texture space in order (x, y)
    const tcoordArray = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);

    // a square defined as cell relation ship in order (cell_size, v1, v2, v3, v4)
    const cellArray = new Uint16Array([4, 0, 1, 3, 2]);

    const points = vtkDataArray.newInstance({
      numberOfComponents: 3,
      values: ptsArray,
    });
    points.setName('points');
    const tcoords = vtkDataArray.newInstance({
      numberOfComponents: 2,
      values: tcoordArray,
    });
    tcoords.setName('tcoords');
    const cells = vtkDataArray.newInstance({
      numberOfComponents: 1,
      values: cellArray,
    });
    model.tris.getCABO().createVBO(cells, 'polys', Representation.SURFACE, {
      points,
      tcoords,
      cellOffset: 0,
    });

    model.VBOBuildTime.modified();
  };

  publicAPI.createFramebuffer = (viewNode) => {
    const size = viewNode.getSize();
    const gl = viewNode.getContext();

    model.framebuffer = vtkOpenGLFramebuffer.newInstance();
    model.framebuffer.setOpenGLRenderWindow(viewNode);
    model.framebuffer.create(...size);
    model.framebuffer.saveCurrentBindingsAndBuffers();
    model.framebuffer.bind();

    model.translucentRGBATexture = vtkOpenGLTexture.newInstance();
    model.translucentRGBATexture.setInternalFormat(gl.RGBA16F);
    model.translucentRGBATexture.setFormat(gl.RGBA);
    model.translucentRGBATexture.setOpenGLDataType(gl.HALF_FLOAT);
    model.translucentRGBATexture.setOpenGLRenderWindow(viewNode);
    model.translucentRGBATexture.create2DFromRaw(
      size[0],
      size[1],
      4,
      'Float32Array',
      null
    );

    model.translucentRTexture = vtkOpenGLTexture.newInstance();
    model.translucentRTexture.setInternalFormat(gl.R16F);
    model.translucentRTexture.setFormat(gl.RED);
    model.translucentRTexture.setOpenGLDataType(gl.HALF_FLOAT);
    model.translucentRTexture.setOpenGLRenderWindow(viewNode);
    model.translucentRTexture.create2DFromRaw(
      size[0],
      size[1],
      1,
      'Float32Array',
      null
    );

    model.translucentZTexture = vtkOpenGLTexture.newInstance();
    model.translucentZTexture.setOpenGLRenderWindow(viewNode);
    model.translucentZTexture.createDepthFromRaw(
      size[0],
      size[1],
      'Float32Array',
      null
    );

    model.framebuffer.setColorBuffer(model.translucentRGBATexture, 0);
    model.framebuffer.setColorBuffer(model.translucentRTexture, 1);
    model.framebuffer.setDepthBuffer(model.translucentZTexture);
  };

  publicAPI.createCopyShader = (viewNode) => {
    model.copyShader = viewNode
      .getShaderCache()
      .readyShaderProgramArray(
        [
          '//VTK::System::Dec',
          'attribute vec4 vertexDC;',
          'attribute vec2 tcoordTC;',
          'varying vec2 tcoord;',
          'void main() { tcoord = tcoordTC; gl_Position = vertexDC; }',
        ].join('\n'),
        oitpFragTemplate,
        ''
      );
  };

  publicAPI.createVBO = (viewNode) => {
    const gl = viewNode.getContext();
    model.tris.setOpenGLRenderWindow(viewNode);
    publicAPI.createVertexBuffer();

    const program = model.copyShader;
    // prepare the vertex and triangle data for the image plane to render to

    model.tris.getCABO().bind();
    if (
      !model.copyVAO.addAttributeArray(
        program,
        model.tris.getCABO(),
        'vertexDC',
        model.tris.getCABO().getVertexOffset(),
        model.tris.getCABO().getStride(),
        gl.FLOAT,
        3,
        gl.FALSE
      )
    ) {
      vtkErrorMacro('Error setting vertexDC in copy shader VAO.');
    }
    if (
      !model.copyVAO.addAttributeArray(
        program,
        model.tris.getCABO(),
        'tcoordTC',
        model.tris.getCABO().getTCoordOffset(),
        model.tris.getCABO().getStride(),
        gl.FLOAT,
        2,
        gl.FALSE
      )
    ) {
      vtkErrorMacro('Error setting vertexDC in copy shader VAO.');
    }
  };

  publicAPI.traverse = (viewNode, renNode, forwardPass) => {
    if (model.deleted) {
      return;
    }

    const size = viewNode.getSize();
    const gl = viewNode.getContext();

    // if we lack the webgl2 and half floatsupport just do
    // basic alpha blending
    model._supported = false;
    if (
      renNode.getSelector() ||
      !gl ||
      !viewNode.getWebgl2() ||
      (!gl.getExtension('EXT_color_buffer_half_float') &&
        !gl.getExtension('EXT_color_buffer_float'))
    ) {
      publicAPI.setCurrentOperation('translucentPass');
      renNode.traverse(publicAPI);
      return;
    }

    model._supported = true;

    // prepare framebuffer // allocate framebuffer if needed and bind it
    if (model.framebuffer === null) {
      publicAPI.createFramebuffer(viewNode);
    } else {
      const fbSize = model.framebuffer.getSize();
      if (fbSize === null || fbSize[0] !== size[0] || fbSize[1] !== size[1]) {
        model.framebuffer.releaseGraphicsResources();
        model.translucentRGBATexture.releaseGraphicsResources(viewNode);
        model.translucentRTexture.releaseGraphicsResources(viewNode);
        model.translucentZTexture.releaseGraphicsResources(viewNode);
        publicAPI.createFramebuffer(viewNode);
      } else {
        // store framebuffer bindings to restore them later
        model.framebuffer.saveCurrentBindingsAndBuffers();
        model.framebuffer.bind();
      }
    }

    gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
    gl.clearBufferfv(gl.COLOR, 0, [0.0, 0.0, 0.0, 0.0]);
    gl.clearBufferfv(gl.DEPTH, 0, [1.0]);

    gl.colorMask(false, false, false, false);

    // rerender the opaque pass to set the depth buffer
    // TODO remove when webgl1 is deprecated and instead
    // have the forward pass use a texture backed zbuffer
    if (forwardPass.getOpaqueActorCount() > 0) {
      forwardPass.setCurrentOperation('opaquePass');
      renNode.traverse(forwardPass);
    }

    gl.colorMask(true, true, true, true);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);

    // make sure to clear the entire framebuffer as we will
    // be blitting the entire thing all of it needs good initial values
    gl.viewport(0, 0, size[0], size[1]);
    gl.scissor(0, 0, size[0], size[1]);

    gl.clearBufferfv(gl.COLOR, 0, [0.0, 0.0, 0.0, 1.0]);
    gl.clearBufferfv(gl.COLOR, 1, [0.0, 0.0, 0.0, 0.0]);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);

    // basic gist is we accumulate color into RGB We compute final opacity
    // into A We store accumulated opacity into R of the R texture.
    gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE_MINUS_SRC_ALPHA);

    // now do the translucent rendering
    publicAPI.setCurrentOperation('translucentPass');
    renNode.traverse(publicAPI);

    gl.drawBuffers([gl.NONE]);
    model.framebuffer.restorePreviousBindingsAndBuffers();
    // gl.drawBuffers([gl.BACK]);

    // make sure the copy shader is ready
    if (model.copyShader === null) {
      publicAPI.createCopyShader(viewNode);
    } else {
      viewNode.getShaderCache().readyShaderProgram(model.copyShader);
    }

    // make sure we have a VAO
    if (!model.copyVAO) {
      model.copyVAO = vtkVertexArrayObject.newInstance();
      model.copyVAO.setOpenGLRenderWindow(viewNode);
    }
    model.copyVAO.bind();

    // make sure the VBO is up to date
    if (model.VBOBuildTime.getMTime() < publicAPI.getMTime()) {
      publicAPI.createVBO(viewNode);
    }

    gl.blendFuncSeparate(
      gl.SRC_ALPHA,
      gl.ONE_MINUS_SRC_ALPHA,
      gl.ONE,
      gl.ONE_MINUS_SRC_ALPHA
    );
    gl.depthMask(false);
    gl.depthFunc(gl.ALWAYS);

    gl.viewport(0, 0, size[0], size[1]);
    gl.scissor(0, 0, size[0], size[1]);

    // activate texture
    model.translucentRGBATexture.activate();
    model.copyShader.setUniformi(
      'translucentRGBATexture',
      model.translucentRGBATexture.getTextureUnit()
    );
    model.translucentRTexture.activate();
    model.copyShader.setUniformi(
      'translucentRTexture',
      model.translucentRTexture.getTextureUnit()
    );

    // render quad
    gl.drawArrays(gl.TRIANGLES, 0, model.tris.getCABO().getElementCount());

    gl.depthMask(true);
    gl.depthFunc(gl.LEQUAL);
    model.translucentRGBATexture.deactivate();
    model.translucentRTexture.deactivate();
  };

  publicAPI.getShaderReplacement = () => {
    if (model._supported) {
      return translucentShaderReplacement;
    }
    return null;
  };

  publicAPI.releaseGraphicsResources = (viewNode) => {
    if (model.framebuffer) {
      model.framebuffer.releaseGraphicsResources(viewNode);
      model.framebuffer = null;
    }
    if (model.translucentRGBATexture) {
      model.translucentRGBATexture.releaseGraphicsResources(viewNode);
      model.translucentRGBATexture = null;
    }
    if (model.translucentRTexture) {
      model.translucentRTexture.releaseGraphicsResources(viewNode);
      model.translucentRTexture = null;
    }
    if (model.translucentZTexture) {
      model.translucentZTexture.releaseGraphicsResources(viewNode);
      model.translucentZTexture = null;
    }
    if (model.copyVAO) {
      model.copyVAO.releaseGraphicsResources(viewNode);
      model.copyVAO = null;
    }
    if (model.copyShader) {
      model.copyShader.releaseGraphicsResources(viewNode);
      model.copyShader = null;
    }
    if (model.tris) {
      model.tris.releaseGraphicsResources(viewNode);
      model.tris = null;
    }
    publicAPI.modified();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  framebuffer: null,
  copyShader: null,
  tris: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  vtkRenderPass.extend(publicAPI, model, initialValues);

  model.VBOBuildTime = {};
  macro.obj(model.VBOBuildTime, { mtime: 0 });

  model.tris = vtkHelper.newInstance();

  macro.get(publicAPI, model, ['framebuffer']);

  // Object methods
  vtkOpenGLOrderIndependentTranslucentPass(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkOpenGLOrderIndependentTranslucentPass'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
