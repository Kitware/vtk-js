import { mat4 }           from 'gl-matrix';
import Constants          from 'vtk.js/Sources/Rendering/Core/ImageMapper/Constants';
import macro              from 'vtk.js/Sources/macro';
import vtkDataArray       from 'vtk.js/Sources/Common/Core/DataArray';
import vtkHelper          from 'vtk.js/Sources/Rendering/OpenGL/Helper';
import vtkMath            from 'vtk.js/Sources/Common/Core/Math';
import vtkOpenGLTexture   from 'vtk.js/Sources/Rendering/OpenGL/Texture';
import vtkShaderProgram   from 'vtk.js/Sources/Rendering/OpenGL/ShaderProgram';
import vtkViewNode        from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';
import { Representation } from 'vtk.js/Sources/Rendering/Core/Property/Constants';
import { Wrap, Filter }   from 'vtk.js/Sources/Rendering/OpenGL/Texture/Constants';

import vtkPolyDataVS      from 'vtk.js/Sources/Rendering/OpenGL/glsl/vtkPolyDataVS.glsl';
import vtkPolyDataFS      from 'vtk.js/Sources/Rendering/OpenGL/glsl/vtkPolyDataFS.glsl';

const { vtkErrorMacro } = macro;

const { SlicingMode } = Constants;

// ----------------------------------------------------------------------------
// vtkOpenGLImageMapper methods
// ----------------------------------------------------------------------------

function vtkOpenGLImageMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLImageMapper');

  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      model.openGLImageSlice = publicAPI.getFirstAncestorOfType('vtkOpenGLImageSlice');
      model.openGLRenderer = publicAPI.getFirstAncestorOfType('vtkOpenGLRenderer');
      model.openGLRenderWindow = model.openGLRenderer.getParent();
      model.context = model.openGLRenderWindow.getContext();
      model.tris.setWindow(model.openGLRenderWindow);
      model.openGLTexture.setWindow(model.openGLRenderWindow);
      model.openGLTexture.setContext(model.context);
      const ren = model.openGLRenderer.getRenderable();
      model.openGLCamera = model.openGLRenderer.getViewNodeFor(ren.getActiveCamera());
      // is zslice set by the camera
      if (model.renderable.getSliceAtFocalPoint()) {
        model.renderable.setZSliceFromCamera(ren.getActiveCamera());
      }
    }
  };

  publicAPI.translucentPass = (prepass) => {
    if (prepass) {
      publicAPI.render();
    }
  };

  publicAPI.opaquePass = (prepass) => {
    if (prepass) {
      publicAPI.render();
    }
  };

  // Renders myself
  publicAPI.render = () => {
    const actor = model.openGLImageSlice.getRenderable();
    const ren = model.openGLRenderer.getRenderable();
    publicAPI.renderPiece(ren, actor);
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

    cellBO.getVAO().bind();
    publicAPI.setMapperShaderParameters(cellBO, ren, actor);
    publicAPI.setCameraShaderParameters(cellBO, ren, actor);
    publicAPI.setPropertyShaderParameters(cellBO, ren, actor);
  };

  publicAPI.setMapperShaderParameters = (cellBO, ren, actor) => {
    // Now to update the VAO too, if necessary.

    if (cellBO.getCABO().getElementCount() && (model.VBOBuildTime > cellBO.getAttributeUpdateTime().getMTime() ||
        cellBO.getShaderSourceTime().getMTime() > cellBO.getAttributeUpdateTime().getMTime())) {
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
      cellBO.getAttributeUpdateTime().modified();
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

    const image = model.currentInput;
    const i2wmat4 = image.getIndexToWorld();

    const keyMats = model.openGLCamera.getKeyMatrices(ren);
    mat4.multiply(model.imagemat, keyMats.wcdc, i2wmat4);
    program.setUniformMatrix('MCDCMatrix', model.imagemat);
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

    // activate the texture
    model.openGLTexture.activate();

    // draw polygons
    if (model.tris.getCABO().getElementCount()) {
      // First we do the triangles, update the shader, set uniforms, etc.
      publicAPI.updateShaders(model.tris, ren, actor);
      gl.drawArrays(gl.TRIANGLES, 0,
        model.tris.getCABO().getElementCount());
      model.tris.getVAO().release();
    }

    model.openGLTexture.deactivate();
  };

  publicAPI.renderPieceFinish = (ren, actor) => {
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
      vtkMath.uninitializeBounds(model.bounds);
      return;
    }
    model.bounds = publicAPI.getInput().getBounds();
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
        model.VBOBuildTime.getMTime() < model.renderable.getMTime() ||
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
    let nSlice = model.renderable.getZSlice();
    if (model.renderable.getCurrentSlicingMode() === SlicingMode.X) {
      nSlice = model.renderable.getXSlice();
    }
    if (model.renderable.getCurrentSlicingMode() === SlicingMode.Y) {
      nSlice = model.renderable.getYSlice();
    }
    const toString = `${nSlice}A${image.getMTime()}A${image.getPointData().getScalars().getMTime()}B${publicAPI.getMTime()}`;
    if (model.VBOBuildString !== toString) {
      // Build the VBOs
      const dims = image.getDimensions();
      if (image.getPointData().getScalars().getNumberOfComponents() === 4) {
        model.openGLTexture.setGenerateMipmap(true);
        model.openGLTexture.setMinificationFilter(Filter.LINEAR_MIPMAP_LINEAR);
      } else {
        model.openGLTexture.setMinificationFilter(Filter.LINEAR);
      }
      model.openGLTexture.setMagnificationFilter(Filter.LINEAR);
      model.openGLTexture.setWrapS(Wrap.CLAMP_TO_EDGE);
      model.openGLTexture.setWrapT(Wrap.CLAMP_TO_EDGE);
      const numComp = image.getPointData().getScalars().getNumberOfComponents();
      const sliceSize = dims[0] * dims[1] * numComp;

      const ext = image.getExtent();
      const ptsArray = new Float32Array(12);
      const tcoordArray = new Float32Array(8);
      for (let i = 0; i < 4; i++) {
        ptsArray[(i * 3)] = ((i % 2) ? ext[1] : ext[0]);
        ptsArray[(i * 3) + 1] = ((i > 1) ? ext[3] : ext[2]);
        ptsArray[(i * 3) + 2] = nSlice;
        tcoordArray[(i * 2)] = (i % 2) ? 1.0 : 0.0;
        tcoordArray[(i * 2) + 1] = (i > 1) ? 1.0 : 0.0;
      }

      const basicScalars = image.getPointData().getScalars().getData();
      let scalars = basicScalars.subarray(nSlice * sliceSize, (nSlice + 1) * sliceSize);
      // Get right scalars according to slicing mode
      if (model.renderable.getCurrentSlicingMode() === SlicingMode.X) {
        scalars = [];
        for (let k = 0; k < dims[2]; k++) {
          for (let j = 0; j < dims[1]; j++) {
            scalars.push(basicScalars[nSlice + (j * dims[0]) + (k * dims[0] * dims[1])]);
          }
        }
        dims[0] = dims[1];
        dims[1] = dims[2];
        ptsArray[0] = nSlice;
        ptsArray[1] = ext[2];
        ptsArray[2] = ext[4];
        ptsArray[3] = nSlice;
        ptsArray[4] = ext[3];
        ptsArray[5] = ext[4];
        ptsArray[6] = nSlice;
        ptsArray[7] = ext[2];
        ptsArray[8] = ext[5];
        ptsArray[9] = nSlice;
        ptsArray[10] = ext[3];
        ptsArray[11] = ext[5];
      }
      if (model.renderable.getCurrentSlicingMode() === SlicingMode.Y) {
        scalars = [];
        for (let k = 0; k < dims[2]; k++) {
          for (let i = 0; i < dims[0]; i++) {
            scalars.push(basicScalars[i + (nSlice * dims[0]) + (k * dims[0] * dims[1])]);
          }
        }
        dims[1] = dims[2];
        ptsArray[0] = ext[0];
        ptsArray[1] = nSlice;
        ptsArray[2] = ext[4];
        ptsArray[3] = ext[1];
        ptsArray[4] = nSlice;
        ptsArray[5] = ext[4];
        ptsArray[6] = ext[0];
        ptsArray[7] = nSlice;
        ptsArray[8] = ext[5];
        ptsArray[9] = ext[1];
        ptsArray[10] = nSlice;
        ptsArray[11] = ext[5];
      }

      if (model.renderable.getCurrentSlicingMode() === SlicingMode.Z) {
        ptsArray[0] = ext[0];
        ptsArray[1] = ext[2];
        ptsArray[2] = nSlice;
        ptsArray[3] = ext[1];
        ptsArray[4] = ext[2];
        ptsArray[5] = nSlice;
        ptsArray[6] = ext[0];
        ptsArray[7] = ext[3];
        ptsArray[8] = nSlice;
        ptsArray[9] = ext[1];
        ptsArray[10] = ext[3];
        ptsArray[11] = nSlice;
      }

      model.openGLTexture.create2DFromRaw(dims[0], dims[1],
        numComp,
        image.getPointData().getScalars().getDataType(),
        scalars);
      model.openGLTexture.activate();
      model.openGLTexture.sendParameters();
      model.openGLTexture.deactivate();

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

      model.tris.getCABO().createVBO(cells,
        'polys', Representation.SURFACE,
        { points, tcoords, cellOffset: 0 });
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
  openGLTexture: null,
  tris: null,
  imagemat: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  model.tris = vtkHelper.newInstance();
  model.openGLTexture = vtkOpenGLTexture.newInstance();

  model.imagemat = mat4.create();

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

export const newInstance = macro.newInstance(extend, 'vtkOpenGLImageMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
