import macro from 'vtk.js/Sources/macros';
import vtkOpenGLFramebuffer from 'vtk.js/Sources/Rendering/OpenGL/Framebuffer';
import vtkRenderPass from 'vtk.js/Sources/Rendering/SceneGraph/RenderPass';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkHelper from 'vtk.js/Sources/Rendering/OpenGL/Helper';
import vtkVertexArrayObject from 'vtk.js/Sources/Rendering/OpenGL/VertexArrayObject';

import { Representation } from 'vtk.js/Sources/Rendering/Core/Property/Constants';

const { vtkErrorMacro } = macro;
// ----------------------------------------------------------------------------

function vtkConvolution2DPass(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkConvolution2DPass');

  publicAPI.computeKernelWeight = function computeKernelWeight(kernel) {
    const weight = kernel.reduce((prev, curr) => prev + curr);
    return weight <= 0 ? 1 : weight;
  };

  // handles post-processing via convolution kernel and call delegate
  publicAPI.traverse = (viewNode, parent = null) => {
    if (model.deleted) {
      return;
    }

    // check if kernel dimension is valid
    if (model.kernelDimension % 2 !== 1) {
      vtkErrorMacro(
        'Invalid kernel dimension! Kernel dimension must be odd (e.g. 3, 5, 7, ...).'
      );
      return;
    }

    // if no kernel is set, use the default kernel (no post-processing)
    if (model.kernel === null) {
      model.kernel = new Float32Array(model.kernelDimension);
      model.kernel[Math.floor(model.kernelDimension / 2)] = 1;
    }

    const kernelLength = model.kernelDimension * model.kernelDimension;
    if (model.kernel.length !== kernelLength) {
      vtkErrorMacro(
        `The given kernel is invalid. 2D convolution kernels have to be 1D arrays with ${kernelLength} components representing the ${model.kernelDimension}x${model.kernelDimension} kernel in row-major form.`
      );
      return;
    }

    // prepare framebuffer // allocate framebuffer if needed and bind it
    if (model.framebuffer === null) {
      model.framebuffer = vtkOpenGLFramebuffer.newInstance();
    }

    const size = viewNode.getSize();
    const gl = viewNode.getContext();

    if (gl === null) {
      // nothing to do -> no render context
      // traverse delegate passes -> has to be done in order for the vtk render-pipeline to work correctly
      model.delegates.forEach((val) => {
        val.traverse(viewNode, publicAPI);
      });
      return;
    }

    // prepare rendering
    if (model.VBOBuildTime.getMTime() < publicAPI.getMTime()) {
      model.tris.setOpenGLRenderWindow(viewNode);
      publicAPI.buildVertexBuffer();
    }

    // store framebuffer bindings to restore them later
    model.framebuffer.setOpenGLRenderWindow(viewNode);
    model.framebuffer.saveCurrentBindingsAndBuffers();

    const fbSize = model.framebuffer.getSize();

    if (fbSize === null || fbSize[0] !== size[0] || fbSize[1] !== size[1]) {
      // create post-processing framebuffer if not already existing
      model.framebuffer.create(size[0], size[1]);
      model.framebuffer.populateFramebuffer();
    }

    // bind framebuffer to re-direct the render-output of the delegate passes to the buffer
    model.framebuffer.bind();

    // do the delegate rendering
    model.delegates.forEach((val) => {
      val.traverse(viewNode, publicAPI);
    });

    // now draw the convolved values
    model.framebuffer.restorePreviousBindingsAndBuffers();

    // check if kernel dimension has changed and convolution shader needs to be re-compiled
    if (
      model.convolutionShader !== null &&
      model.oldKernelDimension !== model.kernelDimension
    ) {
      model.convolutionShader = null;
      model.oldKernelDimension = model.kernelDimension;
    }

    // make sure the convolution shader is ready
    if (model.convolutionShader === null) {
      model.convolutionShader = viewNode
        .getShaderCache()
        .readyShaderProgramArray(
          [
            '//VTK::System::Dec',
            'attribute vec4 vertexDC;',
            'attribute vec2 tcoordTC;',
            'varying vec2 tcoord;',
            'void main() { tcoord = tcoordTC; gl_Position = vertexDC; }',
          ].join('\n'),
          publicAPI.getFragmentShaderCode(model.kernelDimension),
          ''
        );
      const program = model.convolutionShader;

      // prepare the vertex and triangle data for the image plane to render to
      model.copyVAO = vtkVertexArrayObject.newInstance();
      model.copyVAO.setOpenGLRenderWindow(viewNode);

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
    } else {
      viewNode.getShaderCache().readyShaderProgram(model.convolutionShader);
    }

    gl.viewport(0, 0, size[0], size[1]);
    gl.scissor(0, 0, size[0], size[1]);

    // activate texture
    const tex = model.framebuffer.getColorTexture();
    tex.activate();
    model.convolutionShader.setUniformi('u_image', tex.getTextureUnit());
    model.convolutionShader.setUniform2f(
      'u_textureSize',
      tex.getWidth(),
      tex.getHeight()
    );
    model.convolutionShader.setUniformfv('u_kernel', model.kernel);
    model.convolutionShader.setUniformf(
      'u_kernelWeight',
      publicAPI.computeKernelWeight(model.kernel)
    );

    // render quad
    gl.drawArrays(gl.TRIANGLES, 0, model.tris.getCABO().getElementCount());
    tex.deactivate();
  };

  publicAPI.getFragmentShaderCode = (kernelDimension) => {
    // generate new shader code
    const kernelLength = kernelDimension * kernelDimension;
    let shaderCode = [
      '//VTK::System::Dec',
      '//VTK::Output::Dec',
      'uniform sampler2D u_image;',
      'uniform vec2 u_textureSize;',
      `uniform float u_kernel[${kernelLength}];`,
      'uniform float u_kernelWeight;',
      'varying vec2 tcoord;',
      'void main(){',
      '    vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;',
      '    vec4 colorSum =\n',
    ].join('\n');

    const halfDim = Math.floor(kernelDimension / 2);

    // generate sum per pixel
    let i = 0;
    for (let y = -halfDim; y <= halfDim; ++y) {
      for (let x = -halfDim; x <= halfDim; ++x) {
        shaderCode += `        texture2D(u_image, tcoord + onePixel * vec2(${x}, ${y})) * u_kernel[${i}]`;
        ++i;

        if (i !== kernelLength) {
          shaderCode += ' +\n';
        }
      }
    }

    // finish code
    shaderCode += [
      ';',
      '    gl_FragData[0] = vec4((colorSum / u_kernelWeight).rgb, texture2D(u_image, tcoord).a);',
      '}',
    ].join('\n');

    return shaderCode;
  };

  // build vertices etc
  publicAPI.buildVertexBuffer = () => {
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
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  framebuffer: null,
  convolutionShader: null,
  tris: null,
  kernel: [0, 0, 0, 0, 1, 0, 0, 0, 0],
  oldKernelDimension: 3,
  kernelDimension: 3,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  vtkRenderPass.extend(publicAPI, model, initialValues);

  model.VBOBuildTime = {};
  macro.obj(model.VBOBuildTime, { mtime: 0 });

  model.tris = vtkHelper.newInstance();

  macro.setGet(publicAPI, model, ['kernel', 'kernelDimension']);

  macro.get(publicAPI, model, ['framebuffer']);

  // Object methods
  vtkConvolution2DPass(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkConvolution2DPass');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
