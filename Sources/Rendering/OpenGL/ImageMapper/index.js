import * as macro from '../../../macro';
import vtkHelper from '../Helper';
import vtkMath from '../../../Common/Core/Math';
import vtkDataArray from '../../../Common/Core/DataArray';
import vtkOpenGLTexture from '../Texture';
import vtkShaderProgram from '../ShaderProgram';
import vtkTexture from '../../Core/Texture';
import vtkViewNode from '../../SceneGraph/ViewNode';
import { VTK_REPRESENTATION } from '../../Core/Property/Constants';
// import { mat4 } from 'gl-matrix';

import vtkPolyDataVS from '../glsl/vtkPolyDataVS.glsl';
import vtkPolyDataFS from '../glsl/vtkPolyDataFS.glsl';

// ----------------------------------------------------------------------------
// vtkOpenGLImageMapper methods
// ----------------------------------------------------------------------------

export function vtkOpenGLImageMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLImageMapper');

  // Builds myself.
  publicAPI.build = (prepass) => {
    if (prepass) {
      if (!model.renderable) {
        return;
      }
    }
  };

  // Renders myself
  publicAPI.render = (prepass) => {
    if (prepass) {
      model.openGLRenderWindow = publicAPI.getFirstAncestorOfType('vtkOpenGLRenderWindow');
      model.context = model.openGLRenderWindow.getContext();
      model.tris.setContext(model.context);
      model.openGLImageSlice = publicAPI.getFirstAncestorOfType('vtkOpenGLImageSlice');
      const actor = model.openGLImageSlice.getRenderable();
      model.openGLRenderer = publicAPI.getFirstAncestorOfType('vtkOpenGLRenderer');
      const ren = model.openGLRenderer.getRenderable();
      model.openGLCamera = model.openGLRenderer.getViewNodeFor(ren.getActiveCamera());
      publicAPI.renderPiece(ren, actor);
    } else {
      // something
    }
  };

  publicAPI.buildShaders = (shaders, ren, actor) => {
    publicAPI.getShaderTemplate(shaders, ren, actor);
    publicAPI.replaceShaderValues(shaders, ren, actor);
  };

  publicAPI.getShaderTemplate = (shaders, ren, actor) => {
    shaders.Vertex = vtkPolyDataVS;
    shaders.Fragment = vtkPolyDataFS;
    shaders.Geometry = '';
  };

  publicAPI.replaceShaderValues = (shaders, ren, actor) => {
    let VSSource = shaders.Vertex;
    let FSSource = shaders.Fragment;

    VSSource = vtkShaderProgram.substitute(VSSource,
      '//VTK::Camera::Dec', [
        'uniform mat4 MCDCMatrix;']).result;
    VSSource = vtkShaderProgram.substitute(VSSource,
      '//VTK::PositionVC::Impl', [
        '  gl_Position = MCDCMatrix * vertexMC;']).result;

    VSSource = vtkShaderProgram.substitute(VSSource,
      '//VTK::TCoord::Impl',
      'tcoordVCVSOutput = tcoordMC;').result;

    const tNumComp = model.openGLTexture.getComponents();

    VSSource = vtkShaderProgram.substitute(VSSource,
      '//VTK::TCoord::Dec',
      'attribute vec2 tcoordMC; varying vec2 tcoordVCVSOutput;').result;
    FSSource = vtkShaderProgram.substitute(FSSource,
      '//VTK::TCoord::Dec', [
        'varying vec2 tcoordVCVSOutput;',
        'uniform float shift;',
        'uniform float scale;',
        'uniform sampler2D texture1;']).result;
    switch (tNumComp) {
      case 1:
        FSSource = vtkShaderProgram.substitute(FSSource,
          '//VTK::TCoord::Impl', [
            'float intensity = texture2D(texture1, tcoordVCVSOutput).r*scale + shift;',
            'gl_FragData[0] = vec4(intensity,intensity,intensity,1.0);']).result;
        break;
      case 2:
        FSSource = vtkShaderProgram.substitute(FSSource,
          '//VTK::TCoord::Impl', [
            'vec4 tcolor = texture2D(texture1, tcoordVCVSOutput);',
            'float intensity = tcolor.r*scale + shift;',
            'gl_FragData[0] = vec4(intensity, intensity, intensity, scale*tcolor.g + shift);']).result;
        break;
      default:
        FSSource = vtkShaderProgram.substitute(FSSource,
          '//VTK::TCoord::Impl',
          'gl_FragData[0] = scale*texture2D(texture1, tcoordVCVSOutput.st) + shift;').result;
    }
    shaders.Vertex = VSSource;
    shaders.Fragment = FSSource;
  };

  publicAPI.getNeedToRebuildShaders = (cellBO, ren, actor) => {
    // has something changed that would require us to recreate the shader?
    // candidates are
    // property modified (representation interpolation and lighting)
    // input modified
    // light complexity changed
    if (cellBO.getProgram() === 0 ||
        cellBO.getShaderSourceTime().getMTime() < publicAPI.getMTime() ||
        cellBO.getShaderSourceTime().getMTime() < actor.getMTime() ||
        cellBO.getShaderSourceTime().getMTime() < model.currentInput.getMTime()) {
      return true;
    }

    return false;
  };

  publicAPI.updateShaders = (cellBO, ren, actor) => {
    cellBO.getVAO().bind();
    model.lastBoundBO = cellBO;

    // has something changed that would require us to recreate the shader?
    if (publicAPI.getNeedToRebuildShaders(cellBO, ren, actor)) {
      const shaders = { Vertex: null, Fragment: null, Geometry: null };

      publicAPI.buildShaders(shaders, ren, actor);

      // compile and bind the program if needed
      const newShader =
        model.openGLRenderWindow.getShaderCache().readyShaderProgramArray(shaders.Vertex, shaders.Fragment, shaders.Geometry);

      // if the shader changed reinitialize the VAO
      if (newShader !== cellBO.getProgram()) {
        cellBO.setProgram(newShader);
        // reset the VAO as the shader has changed
        cellBO.getVAO().releaseGraphicsResources();
      }

      cellBO.getShaderSourceTime().modified();
    } else {
      model.openGLRenderWindow.getShaderCache().readyShaderProgram(cellBO.getProgram());
    }

    publicAPI.setMapperShaderParameters(cellBO, ren, actor);
    publicAPI.setCameraShaderParameters(cellBO, ren, actor);
    publicAPI.setPropertyShaderParameters(cellBO, ren, actor);
  };

  publicAPI.setMapperShaderParameters = (cellBO, ren, actor) => {
    // Now to update the VAO too, if necessary.

    if (cellBO.getCABO().getElementCount() && (model.VBOBuildTime > cellBO.getAttributeUpdateTime().getMTime() ||
        cellBO.getShaderSourceTime().getMTime() > cellBO.getAttributeUpdateTime().getMTime())) {
      cellBO.getCABO().bind();
      if (cellBO.getProgram().isAttributeUsed('vertexMC')) {
        if (!cellBO.getVAO().addAttributeArray(cellBO.getProgram(), cellBO.getCABO(),
                                           'vertexMC', cellBO.getCABO().getVertexOffset(),
                                           cellBO.getCABO().getStride(), model.context.FLOAT, 3,
                                           model.context.FALSE)) {
          vtkErrorMacro('Error setting vertexMC in shader VAO.');
        }
      }
      if (cellBO.getProgram().isAttributeUsed('tcoordMC') &&
          cellBO.getCABO().getTCoordOffset()) {
        if (!cellBO.getVAO().addAttributeArray(cellBO.getProgram(), cellBO.getCABO(),
                                           'tcoordMC', cellBO.getCABO().getTCoordOffset(),
                                           cellBO.getCABO().getStride(), model.context.FLOAT,
                                           cellBO.getCABO().getTCoordComponents(),
                                           model.context.FALSE)) {
          vtkErrorMacro('Error setting tcoordMC in shader VAO.');
        }
      }
    }

    const texUnit = model.openGLTexture.getTextureUnit();
    cellBO.getProgram().setUniformi('texture1', texUnit);

    const cw = actor.getProperty().getColorWindow();
    const cl = actor.getProperty().getColorLevel();
    const oglShiftScale = model.openGLTexture.getShiftAndScale();

    const scale = oglShiftScale.scale / cw;
    const shift = ((oglShiftScale.shift - cl) / cw) + 0.5;

    cellBO.getProgram().setUniformf('shift', shift);
    cellBO.getProgram().setUniformf('scale', scale);
  };

  publicAPI.setCameraShaderParameters = (cellBO, ren, actor) => {
    const program = cellBO.getProgram();

    // if (model.renderable.getRenderToRectangle()) {
    //   let xscale = 1.0;
    //   let yscale = 1.0;
    //   const actorPos =
    //     actor.getActualPositionCoordinate().getComputedViewValue(ren);
    //   const actorPos2 =
    //     actor.getActualPosition2Coordinate().getComputedViewValue(ren);

    //   const rectwidth  = (actorPos2[0] - actorPos[0]) + 1;
    //   const rectheight = (actorPos2[1] - actorPos[1]) + 1;
    //   const xscale = rectwidth / width;
    //   const yscale = rectheight / height;
    // }

    // points->SetPoint(0, 0.0, 0.0, 0);
    // points->SetPoint(1, width*xscale, 0.0, 0);
    // points->SetPoint(2, width*xscale, height*yscale, 0);
    // points->SetPoint(3, 0.0, height*yscale, 0);

    // // [WMVD]C == {world, model, view, display} coordinates
    // // E.g., WCDC == world to display coordinate transformation
    const keyMats = model.openGLCamera.getKeyMatrices(ren);
    program.setUniformMatrix('MCDCMatrix', keyMats.wcdc);
    // program.setUniformf4('p1', );
    // program.setUniformf4('p2',);
  };

  publicAPI.setPropertyShaderParameters = (cellBO, ren, actor) => {
    const program = cellBO.getProgram();

    const ppty = actor.getProperty();

    const opacity = ppty.getOpacity();
    program.setUniformf('opacityUniform', opacity);
  };

  publicAPI.renderPieceStart = (ren, actor) => {
    // make sure the BOs are up to date
    publicAPI.updateBufferObjects(ren, actor);

    // Bind the OpenGL, this is shared between the different primitive/cell types.
    model.lastBoundBO = null;
  };

  publicAPI.renderPieceDraw = (ren, actor) => {
    const gl = model.context;

    // render the texture
    model.openGLTexture.preRender(model.openGLRenderer);

    // draw polygons
    if (model.tris.getCABO().getElementCount()) {
      // First we do the triangles, update the shader, set uniforms, etc.
      publicAPI.updateShaders(model.tris, ren, actor);
      gl.drawArrays(gl.TRIANGLES, 0,
        model.tris.getCABO().getElementCount());
    }

    model.openGLTexture.deactivate();
  };

  publicAPI.renderPieceFinish = (ren, actor) => {
    if (model.LastBoundBO) {
      model.LastBoundBO.getVAO().release();
    }
  };

  publicAPI.renderPiece = (ren, actor) => {
    // Make sure that we have been properly initialized.
    // if (ren.getRenderWindow().checkAbortStatus()) {
    //   return;
    // }

    publicAPI.invokeEvent({ type: 'StartEvent' });
    model.renderable.update();
    model.currentInput = model.renderable.getInputData();
    publicAPI.invokeEvent({ type: 'EndEvent' });

    if (model.currentInput === null) {
      vtkErrorMacro('No input!');
      return;
    }

    publicAPI.renderPieceStart(ren, actor);
    publicAPI.renderPieceDraw(ren, actor);
    publicAPI.renderPieceFinish(ren, actor);
  };

  publicAPI.computeBounds = (ren, actor) => {
    if (!publicAPI.getInput()) {
      vtkMath.uninitializeBounds(model.Bounds);
      return;
    }
    model.bounnds = publicAPI.getInput().getBounds();
  };

  publicAPI.updateBufferObjects = (ren, actor) => {
    // Rebuild buffers if needed
    if (publicAPI.getNeedToRebuildBufferObjects(ren, actor)) {
      publicAPI.buildBufferObjects(ren, actor);
    }
  };

  publicAPI.getNeedToRebuildBufferObjects = (ren, actor) => {
    // first do a coarse check
    if (model.VBOBuildTime.getMTime() < publicAPI.getMTime() ||
        model.VBOBuildTime.getMTime() < actor.getMTime() ||
        model.VBOBuildTime.getMTime() < actor.getProperty().getMTime() ||
        model.VBOBuildTime.getMTime() < model.currentInput.getMTime()) {
      return true;
    }
    return false;
  };

  publicAPI.buildBufferObjects = (ren, actor) => {
    const image = model.currentInput;

    if (image === null) {
      return;
    }

    // rebuild the VBO if the data has changed
    const toString = `${image.getMTime()}A${image.getPointData().getScalars().getMTime()}B${publicAPI.getMTime()}`;

    if (model.VBOBuildString !== toString) {
      // Build the VBOs
      model.texture.setInputData(image);

      const bounds = model.renderable.getBounds();

      const ptsArray = new Float32Array(12);
      const tcoordArray = new Float32Array(8);
      for (let i = 0; i < 4; i++) {
        ptsArray[(i * 3)] = bounds[i % 2];
        ptsArray[(i * 3) + 1] = bounds[((i > 1) ? 1 : 0) + 2];
        ptsArray[(i * 3) + 2] = bounds[4];
        tcoordArray[(i * 2)] = (i % 2) ? 1.0 : 0.0;
        tcoordArray[(i * 2) + 1] = (i > 1) ? 1.0 : 0.0;
      }

      const points = vtkDataArray.newInstance({ numberOfComponents: 3, values: ptsArray });
      points.setName('points');
      const tcoords = vtkDataArray.newInstance({ numberOfComponents: 2, values: tcoordArray });
      tcoords.setName('tcoords');

      const cellArray = new Uint16Array(8);
      cellArray[0] = 3;
      cellArray[1] = 0;
      cellArray[2] = 1;
      cellArray[3] = 3;
      cellArray[4] = 3;
      cellArray[5] = 0;
      cellArray[6] = 3;
      cellArray[7] = 2;
      const cells = vtkDataArray.newInstance({ numberOfComponents: 1, values: cellArray });

      let cellOffset = 0;
      cellOffset += model.tris.getCABO().createVBO(cells,
        'polys', VTK_REPRESENTATION.SURFACE,
        { points, tcoords, cellOffset });
      console.log('FIXME(Ken) - unused', cellOffset);
      model.VBOBuildTime.modified();
      model.VBOBuildString = toString;
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  context: null,
  VBOBuildTime: 0,
  VBOBuildString: null,
  texture: null,
  openGLTexture: null,
  tris: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model);

  model.tris = vtkHelper.newInstance();
  model.texture = vtkTexture.newInstance();
  model.openGLTexture = vtkOpenGLTexture.newInstance();
  model.openGLTexture.setRenderable(model.texture);

  // Build VTK API
  macro.setGet(publicAPI, model, [
    'context',
  ]);

  model.VBOBuildTime = {};
  macro.obj(model.VBOBuildTime);

  // Object methods
  vtkOpenGLImageMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
