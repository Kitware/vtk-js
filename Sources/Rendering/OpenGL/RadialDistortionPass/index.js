import macro from 'vtk.js/Sources/macro';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkHelper from 'vtk.js/Sources/Rendering/OpenGL/Helper';
import vtkOpenGLFramebuffer from 'vtk.js/Sources/Rendering/OpenGL/Framebuffer';
import vtkRenderPass from 'vtk.js/Sources/Rendering/SceneGraph/RenderPass';
import vtkVertexArrayObject from 'vtk.js/Sources/Rendering/OpenGL/VertexArrayObject';

import { Representation } from 'vtk.js/Sources/Rendering/Core/Property/Constants';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------

function vtkRadialDistortionPass(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkRadialDistortionPass');

  // handles radial distortion and calll delegate
  publicAPI.traverse = (viewNode, parent = null) => {
    if (model.deleted) {
      return;
    }

    // if values are zero then we are a no-op
    if (model.k1 === 0.0 && model.k2 === 0.0) {
      model.delegates.forEach((val) => {
        val.traverse(viewNode, publicAPI);
      });
      return;
    }

    // allocate framebuffer if needed and bind it
    if (model.framebuffer === null) {
      model.framebuffer = vtkOpenGLFramebuffer.newInstance();
    }

    // rebuild vbo if needed
    if (model.VBOBuildTime.getMTime() < publicAPI.getMTime()) {
      model.tris.setOpenGLRenderWindow(viewNode);
      publicAPI.buildVBO();
    }

    const size = viewNode.getSize();

    model.framebuffer.setOpenGLRenderWindow(viewNode);
    model.framebuffer.saveCurrentBindingsAndBuffers();
    const fbSize = model.framebuffer.getSize();

    const targetSize = [
      model.renderRatio * size[0],
      model.renderRatio * size[1],
    ];

    if (
      fbSize === null ||
      fbSize[0] !== targetSize[0] ||
      fbSize[1] !== targetSize[1]
    ) {
      model.framebuffer.create(targetSize[0], targetSize[1]);
      model.framebuffer.populateFramebuffer();
    }
    model.framebuffer.bind();

    model.delegates.forEach((val) => {
      val.traverse(viewNode, publicAPI);
    });

    // now draw the distorted values
    model.framebuffer.restorePreviousBindingsAndBuffers();

    const gl = viewNode.getContext();

    if (model.copyShader === null) {
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
          [
            '//VTK::System::Dec',
            '//VTK::Output::Dec',
            'uniform sampler2D distTexture;',
            'varying vec2 tcoord;',
            'void main() { gl_FragData[0] = texture2D(distTexture,tcoord); }',
          ].join('\n'),
          ''
        );
      const program = model.copyShader;

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
      viewNode.getShaderCache().readyShaderProgram(model.copyShader);
    }

    gl.viewport(0, 0, size[0], size[1]);
    gl.scissor(0, 0, size[0], size[1]);

    // activate texture
    const tex = model.framebuffer.getColorTexture();
    tex.activate();
    model.copyShader.setUniformi('distTexture', tex.getTextureUnit());

    // render quad
    gl.drawArrays(gl.TRIANGLES, 0, model.tris.getCABO().getElementCount());
    tex.deactivate();
  };

  publicAPI.buildVBO = () => {
    const xdim = 20;
    const xtotal = xdim * 2;
    const ydim = 20;

    const ptsArray = new Float32Array(3 * xtotal * ydim);
    const tcoordArray = new Float32Array(2 * xtotal * ydim);
    let count = 0;

    model.renderRatio = 1.0 + model.k1 + model.k2;
    const shrink = 1.0 / model.renderRatio;

    for (let y = 0; y < ydim; ++y) {
      const yo = 2.0 * (y / (ydim - 1.0)) - 1.0;
      const ydo = yo - model.cameraCenterY;
      for (let x = 0; x < xdim; ++x) {
        ptsArray[count * 3] = x / (xdim - 1.0) - 1.0;
        ptsArray[count * 3 + 1] = yo;
        ptsArray[count * 3 + 2] = -1.0;
        const xo = 2.0 * (x / (xdim - 1.0)) - 1.0;
        const xdo = xo - model.cameraCenterX1;
        const ro = Math.sqrt(xdo * xdo + ydo * ydo);
        const rf = shrink * (1 + ro * ro * (model.k1 + ro * ro * model.k2));
        tcoordArray[count * 2] =
          0.25 + 0.25 * (xdo * rf + model.cameraCenterX1);
        tcoordArray[count * 2 + 1] =
          0.5 + 0.5 * (ydo * rf + model.cameraCenterY);
        count++;
      }
      for (let x = 0; x < xdim; ++x) {
        ptsArray[count * 3] = x / (xdim - 1.0);
        ptsArray[count * 3 + 1] = yo;
        ptsArray[count * 3 + 2] = -1.0;
        const xo = 2.0 * (x / (xdim - 1.0)) - 1.0;
        const xdo = xo - model.cameraCenterX2;
        const ro = Math.sqrt(xdo * xdo + ydo * ydo);
        const rf = shrink * (1 + ro * ro * (model.k1 + ro * ro * model.k2));
        tcoordArray[count * 2] =
          0.75 + 0.25 * (xdo * rf + model.cameraCenterX2);
        tcoordArray[count * 2 + 1] =
          0.5 + 0.5 * (ydo * rf + model.cameraCenterY);
        count++;
      }
    }

    const cellArray = new Uint16Array((xtotal - 1) * (ydim - 1) * 2 * 4);
    count = 0;
    for (let y = 0; y < ydim - 1; ++y) {
      for (let x = 0; x < xtotal - 1; ++x) {
        cellArray[count] = 3;
        cellArray[count + 1] = x + y * xtotal;
        cellArray[count + 2] = x + y * xtotal + 1;
        cellArray[count + 3] = x + (y + 1) * xtotal + 1;
        cellArray[count + 4] = 3;
        cellArray[count + 5] = x + y * xtotal;
        cellArray[count + 6] = x + (y + 1) * xtotal + 1;
        cellArray[count + 7] = x + (y + 1) * xtotal;
        count += 8;
      }
    }

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
  copyShader: null,
  framebuffer: null,
  tris: null,
  k1: 0.0,
  k2: 0.0,
  cameraCenterX1: 0.0,
  cameraCenterX2: 0.0,
  cameraCenterY: 0.0,
  renderRatio: 2.0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  vtkRenderPass.extend(publicAPI, model, initialValues);

  model.VBOBuildTime = {};
  macro.obj(model.VBOBuildTime, { mtime: 0 });

  model.tris = vtkHelper.newInstance();

  macro.setGet(publicAPI, model, [
    'k1',
    'k2',
    'cameraCenterY',
    'cameraCenterX1',
    'cameraCenterX2',
  ]);

  macro.get(publicAPI, model, ['framebuffer']);

  // Object methods
  vtkRadialDistortionPass(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkRadialDistortionPass');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
