import { mat3, mat4 } from 'gl-matrix';

import * as macro from 'vtk.js/Sources/macros';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkHelper from 'vtk.js/Sources/Rendering/OpenGL/Helper';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';
import vtkOpenGLTexture from 'vtk.js/Sources/Rendering/OpenGL/Texture';

import { Representation } from 'vtk.js/Sources/Rendering/Core/Property/Constants';

import { registerOverride } from 'vtk.js/Sources/Rendering/OpenGL/ViewNodeFactory';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkOpenGLSkybox methods
// ----------------------------------------------------------------------------

function vtkOpenGLSkybox(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLSkybox');

  // Builds myself.
  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      model.openGLRenderer =
        publicAPI.getFirstAncestorOfType('vtkOpenGLRenderer');
      model._openGLRenderWindow = model.openGLRenderer.getParent();
      model.context = model._openGLRenderWindow.getContext();
      model.tris.setOpenGLRenderWindow(model._openGLRenderWindow);
      model.openGLTexture.setOpenGLRenderWindow(model._openGLRenderWindow);
      const ren = model.openGLRenderer.getRenderable();
      model.openGLCamera = model.openGLRenderer.getViewNodeFor(
        ren.getActiveCamera()
      );
    }
  };

  publicAPI.queryPass = (prepass, renderPass) => {
    if (prepass) {
      if (!model.renderable || !model.renderable.getVisibility()) {
        return;
      }
      renderPass.incrementOpaqueActorCount();
    }
  };

  publicAPI.opaquePass = (prepass, renderPass) => {
    if (prepass && !model.openGLRenderer.getSelector()) {
      publicAPI.updateBufferObjects();

      model.context.depthMask(true);

      model._openGLRenderWindow
        .getShaderCache()
        .readyShaderProgram(model.tris.getProgram());

      model.openGLTexture.render(model._openGLRenderWindow);

      const texUnit = model.openGLTexture.getTextureUnit();
      model.tris.getProgram().setUniformi('sbtexture', texUnit);

      const ren = model.openGLRenderer.getRenderable();

      const keyMats = model.openGLCamera.getKeyMatrices(ren);
      const imat = new Float64Array(16);
      mat4.invert(imat, keyMats.wcpc);
      model.tris.getProgram().setUniformMatrix('IMCPCMatrix', imat);

      if (model.lastFormat === 'box') {
        const camPos = ren.getActiveCamera().getPosition();
        model.tris
          .getProgram()
          .setUniform3f('camPos', camPos[0], camPos[1], camPos[2]);
      }

      model.tris.getVAO().bind();

      // draw polygons
      model.context.drawArrays(
        model.context.TRIANGLES,
        0,
        model.tris.getCABO().getElementCount()
      );
      model.tris.getVAO().release();

      model.openGLTexture.deactivate();
    }
  };

  publicAPI.updateBufferObjects = () => {
    // build the VBO if needed, only happens once
    if (!model.tris.getCABO().getElementCount()) {
      const ptsArray = new Float32Array(12);
      for (let i = 0; i < 4; i++) {
        ptsArray[i * 3] = (i % 2) * 2 - 1.0;
        ptsArray[i * 3 + 1] = i > 1 ? 1.0 : -1.0;
        ptsArray[i * 3 + 2] = 1.0;
      }
      const points = vtkDataArray.newInstance({
        numberOfComponents: 3,
        values: ptsArray,
      });
      points.setName('points');

      const cellArray = new Uint16Array(8);
      cellArray[0] = 3;
      cellArray[1] = 0;
      cellArray[2] = 1;
      cellArray[3] = 3;
      cellArray[4] = 3;
      cellArray[5] = 0;
      cellArray[6] = 3;
      cellArray[7] = 2;
      const cells = vtkDataArray.newInstance({
        numberOfComponents: 1,
        values: cellArray,
      });

      model.tris.getCABO().createVBO(cells, 'polys', Representation.SURFACE, {
        points,
        cellOffset: 0,
      });
    }

    // update the program?
    if (model.renderable.getFormat() !== model.lastFormat) {
      model.lastFormat = model.renderable.getFormat();

      if (model.lastFormat === 'box') {
        // we invert Y below because opengl is messed up!
        // Cube Maps have been specified to follow the RenderMan
        // specification (for whatever reason), and RenderMan
        // assumes the images' origin being in the upper left,
        // contrary to the usual OpenGL behaviour of having the
        // image origin in the lower left. That's why things get
        // swapped in the Y direction. It totally breaks with the usual
        // OpenGL semantics and doesn't make sense at all.
        // But now we're stuck with it.  From
        // https://stackoverflow.com/questions/11685608/convention-of-faces-in-opengl-cubemapping
        //
        model.tris.setProgram(
          model._openGLRenderWindow.getShaderCache().readyShaderProgramArray(
            `//VTK::System::Dec
             attribute vec3 vertexMC;
             uniform mat4 IMCPCMatrix;
             varying vec3 TexCoords;
             void main () {
              gl_Position = vec4(vertexMC.xyz, 1.0);
              vec4 wpos = IMCPCMatrix * gl_Position;
              TexCoords = wpos.xyz/wpos.w;
             }`,
            `//VTK::System::Dec
             //VTK::Output::Dec
             varying vec3 TexCoords;
             uniform samplerCube sbtexture;
             uniform vec3 camPos;
             void main () {
               // skybox looks from inside out
               // which means we have to adjust
               // our tcoords. Otherwise text would
               // be flipped
               vec3 tc = normalize(TexCoords - camPos);
               if (abs(tc.z) < max(abs(tc.x),abs(tc.y)))
               {
                 tc = vec3(1.0, 1.0, -1.0) * tc;
               }
               else
               {
                 tc = vec3(-1.0, 1.0, 1.0) * tc;
               }
               gl_FragData[0] = textureCube(sbtexture, tc);
             }`,
            ''
          )
        );
      }

      if (model.lastFormat === 'background') {
        // maps the texture to the window
        model.tris.setProgram(
          model._openGLRenderWindow.getShaderCache().readyShaderProgramArray(
            `//VTK::System::Dec
             attribute vec3 vertexMC;
             uniform mat4 IMCPCMatrix;
             varying vec2 TexCoords;
             void main () {
              gl_Position = vec4(vertexMC.xyz, 1.0);
              vec4 wpos = IMCPCMatrix * gl_Position;
              TexCoords = vec2(vertexMC.x, vertexMC.y)*0.5 + 0.5;
             }`,
            `//VTK::System::Dec
             //VTK::Output::Dec
             varying vec2 TexCoords;
             uniform sampler2D sbtexture;
             void main () {
               gl_FragData[0] = texture2D(sbtexture, TexCoords);
             }`,
            ''
          )
        );
      }

      model.tris.getShaderSourceTime().modified();

      model.tris.getVAO().bind();

      if (
        !model.tris
          .getVAO()
          .addAttributeArray(
            model.tris.getProgram(),
            model.tris.getCABO(),
            'vertexMC',
            model.tris.getCABO().getVertexOffset(),
            model.tris.getCABO().getStride(),
            model.context.FLOAT,
            3,
            model.context.FALSE
          )
      ) {
        vtkErrorMacro('Error setting vertexMC in shader VAO.');
      }
    }

    // set/update the texture map if needed
    const tmaps = model.renderable.getTextures();
    if (!tmaps.length) {
      vtkErrorMacro('vtkSkybox requires a texture map');
    }
    if (model.openGLTexture.getRenderable() !== tmaps[0]) {
      model.openGLTexture.releaseGraphicsResources(model._openGLRenderWindow);
      model.openGLTexture.setRenderable(tmaps[0]);
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  context: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  model.openGLTexture = vtkOpenGLTexture.newInstance();
  model.tris = vtkHelper.newInstance();

  model.keyMatrixTime = {};
  macro.obj(model.keyMatrixTime, { mtime: 0 });
  model.keyMatrices = {
    normalMatrix: mat3.identity(new Float64Array(9)),
    mcwc: mat4.identity(new Float64Array(16)),
  };

  // Build VTK API
  macro.setGet(publicAPI, model, ['context']);

  macro.get(publicAPI, model, ['activeTextures']);

  // Object methods
  vtkOpenGLSkybox(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };

// Register ourself to OpenGL backend if imported
registerOverride('vtkSkybox', newInstance);
