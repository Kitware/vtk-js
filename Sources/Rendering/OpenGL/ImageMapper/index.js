import { mat4 } from 'gl-matrix';
import Constants from 'vtk.js/Sources/Rendering/Core/ImageMapper/Constants';
import macro from 'vtk.js/Sources/macro';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import vtkHelper from 'vtk.js/Sources/Rendering/OpenGL/Helper';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkOpenGLTexture from 'vtk.js/Sources/Rendering/OpenGL/Texture';
import vtkShaderProgram from 'vtk.js/Sources/Rendering/OpenGL/ShaderProgram';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';
import { Representation } from 'vtk.js/Sources/Rendering/Core/Property/Constants';
import {
  Wrap,
  Filter,
} from 'vtk.js/Sources/Rendering/OpenGL/Texture/Constants';
import { InterpolationType } from 'vtk.js/Sources/Rendering/Core/ImageProperty/Constants';

import vtkPolyDataVS from 'vtk.js/Sources/Rendering/OpenGL/glsl/vtkPolyDataVS.glsl';
import vtkPolyDataFS from 'vtk.js/Sources/Rendering/OpenGL/glsl/vtkPolyDataFS.glsl';

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
      model.openGLImageSlice = publicAPI.getFirstAncestorOfType(
        'vtkOpenGLImageSlice'
      );
      model.openGLRenderer = publicAPI.getFirstAncestorOfType(
        'vtkOpenGLRenderer'
      );
      model.openGLRenderWindow = model.openGLRenderer.getParent();
      model.context = model.openGLRenderWindow.getContext();
      model.tris.setOpenGLRenderWindow(model.openGLRenderWindow);
      model.openGLTexture.setOpenGLRenderWindow(model.openGLRenderWindow);
      model.colorTexture.setOpenGLRenderWindow(model.openGLRenderWindow);
      model.opacityTexture.setOpenGLRenderWindow(model.openGLRenderWindow);
      const ren = model.openGLRenderer.getRenderable();
      model.openGLCamera = model.openGLRenderer.getViewNodeFor(
        ren.getActiveCamera()
      );
      // is slice set by the camera
      if (model.renderable.getSliceAtFocalPoint()) {
        model.renderable.setSliceFromCamera(ren.getActiveCamera());
      }
    }
  };

  publicAPI.translucentPass = (prepass) => {
    if (prepass) {
      publicAPI.render();
    }
  };

  publicAPI.opaqueZBufferPass = (prepass) => {
    if (prepass) {
      model.haveSeenDepthRequest = true;
      model.renderDepth = true;
      publicAPI.render();
      model.renderDepth = false;
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

    VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Camera::Dec', [
      'uniform mat4 MCDCMatrix;',
    ]).result;
    VSSource = vtkShaderProgram.substitute(
      VSSource,
      '//VTK::PositionVC::Impl',
      ['  gl_Position = MCDCMatrix * vertexMC;']
    ).result;

    VSSource = vtkShaderProgram.substitute(
      VSSource,
      '//VTK::TCoord::Impl',
      'tcoordVCVSOutput = tcoordMC;'
    ).result;

    const tNumComp = model.openGLTexture.getComponents();

    VSSource = vtkShaderProgram.substitute(
      VSSource,
      '//VTK::TCoord::Dec',
      'attribute vec2 tcoordMC; varying vec2 tcoordVCVSOutput;'
    ).result;

    FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::TCoord::Dec', [
      'varying vec2 tcoordVCVSOutput;',
      // color shift and scale
      'uniform float shift;',
      'uniform float scale;',
      // opacity shift and scale
      'uniform float oshift;',
      'uniform float oscale;',
      'uniform sampler2D texture1;',
      'uniform sampler2D colorTexture1;',
      'uniform sampler2D opacityTexture1;',
      'uniform float opacity;',
    ]).result;
    switch (tNumComp) {
      case 1:
        FSSource = vtkShaderProgram.substitute(
          FSSource,
          '//VTK::TCoord::Impl',
          [
            'float intensity = texture2D(texture1, tcoordVCVSOutput).r;',
            'vec3 tcolor = texture2D(colorTexture1, vec2(intensity * scale + shift, 0.5)).rgb;',
            'float scalarOpacity = texture2D(opacityTexture1, vec2(intensity * oscale + oshift, 0.5)).r;',
            'gl_FragData[0] = vec4(tcolor, scalarOpacity * opacity);',
          ]
        ).result;
        break;
      case 2:
        FSSource = vtkShaderProgram.substitute(
          FSSource,
          '//VTK::TCoord::Impl',
          [
            'vec4 tcolor = texture2D(texture1, tcoordVCVSOutput);',
            'float intensity = tcolor.r*scale + shift;',
            'gl_FragData[0] = vec4(texture2D(colorTexture1, vec2(intensity, 0.5)), scale*tcolor.g + shift);',
          ]
        ).result;
        break;
      default:
        FSSource = vtkShaderProgram.substitute(
          FSSource,
          '//VTK::TCoord::Impl',
          [
            'vec4 tcolor = scale*texture2D(texture1, tcoordVCVSOutput.st) + shift;',
            'gl_FragData[0] = vec4(texture2D(colorTexture1, vec2(tcolor.r,0.5)).r,',
            '  texture2D(colorTexture1, vec2(tcolor.g,0.5)).r,',
            '  texture2D(colorTexture1, vec2(tcolor.b,0.5)).r, tcolor.a);',
          ]
        ).result;
    }

    if (model.haveSeenDepthRequest) {
      FSSource = vtkShaderProgram.substitute(
        FSSource,
        '//VTK::ZBuffer::Dec',
        'uniform int depthRequest;'
      ).result;
      FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::ZBuffer::Impl', [
        'if (depthRequest == 1) {',
        'float iz = floor(gl_FragCoord.z*65535.0 + 0.1);',
        'float rf = floor(iz/256.0)/255.0;',
        'float gf = mod(iz,256.0)/255.0;',
        'gl_FragData[0] = vec4(rf, gf, 0.0, 1.0); }',
      ]).result;
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

    const tNumComp = model.openGLTexture.getComponents();

    if (
      model.lastHaveSeenDepthRequest !== model.haveSeenDepthRequest ||
      cellBO.getProgram() === 0 ||
      model.lastTextureComponents !== tNumComp
    ) {
      model.lastHaveSeenDepthRequest = model.haveSeenDepthRequest;
      model.lastTextureComponents = tNumComp;
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
      const newShader = model.openGLRenderWindow
        .getShaderCache()
        .readyShaderProgramArray(
          shaders.Vertex,
          shaders.Fragment,
          shaders.Geometry
        );

      // if the shader changed reinitialize the VAO
      if (newShader !== cellBO.getProgram()) {
        cellBO.setProgram(newShader);
        // reset the VAO as the shader has changed
        cellBO.getVAO().releaseGraphicsResources();
      }

      cellBO.getShaderSourceTime().modified();
    } else {
      model.openGLRenderWindow
        .getShaderCache()
        .readyShaderProgram(cellBO.getProgram());
    }

    cellBO.getVAO().bind();
    publicAPI.setMapperShaderParameters(cellBO, ren, actor);
    publicAPI.setCameraShaderParameters(cellBO, ren, actor);
    publicAPI.setPropertyShaderParameters(cellBO, ren, actor);
  };

  publicAPI.setMapperShaderParameters = (cellBO, ren, actor) => {
    // Now to update the VAO too, if necessary.

    if (
      cellBO.getCABO().getElementCount() &&
      (model.VBOBuildTime > cellBO.getAttributeUpdateTime().getMTime() ||
        cellBO.getShaderSourceTime().getMTime() >
          cellBO.getAttributeUpdateTime().getMTime())
    ) {
      if (cellBO.getProgram().isAttributeUsed('vertexMC')) {
        if (
          !cellBO
            .getVAO()
            .addAttributeArray(
              cellBO.getProgram(),
              cellBO.getCABO(),
              'vertexMC',
              cellBO.getCABO().getVertexOffset(),
              cellBO.getCABO().getStride(),
              model.context.FLOAT,
              3,
              model.context.FALSE
            )
        ) {
          vtkErrorMacro('Error setting vertexMC in shader VAO.');
        }
      }
      if (
        cellBO.getProgram().isAttributeUsed('tcoordMC') &&
        cellBO.getCABO().getTCoordOffset()
      ) {
        if (
          !cellBO
            .getVAO()
            .addAttributeArray(
              cellBO.getProgram(),
              cellBO.getCABO(),
              'tcoordMC',
              cellBO.getCABO().getTCoordOffset(),
              cellBO.getCABO().getStride(),
              model.context.FLOAT,
              cellBO.getCABO().getTCoordComponents(),
              model.context.FALSE
            )
        ) {
          vtkErrorMacro('Error setting tcoordMC in shader VAO.');
        }
      }
      cellBO.getAttributeUpdateTime().modified();
    }

    const texUnit = model.openGLTexture.getTextureUnit();
    cellBO.getProgram().setUniformi('texture1', texUnit);

    let cw = actor.getProperty().getColorWindow();
    let cl = actor.getProperty().getColorLevel();
    const cfun = actor.getProperty().getRGBTransferFunction();
    if (cfun) {
      const cRange = cfun.getRange();
      cw = cRange[1] - cRange[0];
      cl = 0.5 * (cRange[1] + cRange[0]);
    }
    const oglShiftScale = model.openGLTexture.getShiftAndScale();

    const scale = oglShiftScale.scale / cw;
    const shift = (oglShiftScale.shift - cl) / cw + 0.5;

    // opacity shift/scale
    const ofun = actor.getProperty().getScalarOpacity();
    let oscale = 1.0;
    let oshift = 0.0;
    if (ofun) {
      const oRange = ofun.getRange();
      const length = oRange[1] - oRange[0];
      const mid = 0.5 * (oRange[0] + oRange[1]);
      oscale = oglShiftScale.scale / length;
      oshift = (oglShiftScale.shift - mid) / length + 0.5;
    }

    if (model.haveSeenDepthRequest) {
      cellBO
        .getProgram()
        .setUniformi('depthRequest', model.renderDepth ? 1 : 0);
    }

    cellBO.getProgram().setUniformf('shift', shift);
    cellBO.getProgram().setUniformf('scale', scale);

    cellBO.getProgram().setUniformf('oshift', oshift);
    cellBO.getProgram().setUniformf('oscale', oscale);

    const texColorUnit = model.colorTexture.getTextureUnit();
    const texOpacityUnit = model.opacityTexture.getTextureUnit();
    cellBO.getProgram().setUniformi('colorTexture1', texColorUnit);
    cellBO.getProgram().setUniformi('opacityTexture1', texOpacityUnit);
  };

  publicAPI.setCameraShaderParameters = (cellBO, ren, actor) => {
    const program = cellBO.getProgram();

    const actMats = model.openGLImageSlice.getKeyMatrices();
    const image = model.currentInput;
    const i2wmat4 = image.getIndexToWorld();
    mat4.multiply(model.imagemat, actMats.mcwc, i2wmat4);

    const keyMats = model.openGLCamera.getKeyMatrices(ren);
    mat4.multiply(model.imagemat, keyMats.wcdc, model.imagemat);

    program.setUniformMatrix('MCDCMatrix', model.imagemat);
  };

  publicAPI.setPropertyShaderParameters = (cellBO, ren, actor) => {
    const program = cellBO.getProgram();

    const ppty = actor.getProperty();

    const opacity = ppty.getOpacity();
    program.setUniformf('opacity', opacity);
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
    model.colorTexture.activate();
    model.opacityTexture.activate();

    // draw polygons
    if (model.tris.getCABO().getElementCount()) {
      // First we do the triangles, update the shader, set uniforms, etc.
      publicAPI.updateShaders(model.tris, ren, actor);
      gl.drawArrays(gl.TRIANGLES, 0, model.tris.getCABO().getElementCount());
      model.tris.getVAO().release();
    }

    model.openGLTexture.deactivate();
    model.colorTexture.deactivate();
    model.opacityTexture.deactivate();
  };

  publicAPI.renderPieceFinish = (ren, actor) => {};

  publicAPI.renderPiece = (ren, actor) => {
    // Make sure that we have been properly initialized.
    // if (ren.getRenderWindow().checkAbortStatus()) {
    //   return;
    // }

    publicAPI.invokeEvent({ type: 'StartEvent' });
    model.renderable.update();
    model.currentInput = model.renderable.getInputData();
    publicAPI.invokeEvent({ type: 'EndEvent' });

    if (!model.currentInput) {
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
    if (
      model.VBOBuildTime.getMTime() < publicAPI.getMTime() ||
      model.VBOBuildTime.getMTime() < actor.getMTime() ||
      model.VBOBuildTime.getMTime() < model.renderable.getMTime() ||
      model.VBOBuildTime.getMTime() < actor.getProperty().getMTime() ||
      model.VBOBuildTime.getMTime() < model.currentInput.getMTime()
    ) {
      return true;
    }
    return false;
  };

  publicAPI.buildBufferObjects = (ren, actor) => {
    const image = model.currentInput;

    if (image === null) {
      return;
    }

    // set interpolation on the texture based on property setting
    const iType = actor.getProperty().getInterpolationType();
    if (iType === InterpolationType.NEAREST) {
      model.colorTexture.setMinificationFilter(Filter.NEAREST);
      model.colorTexture.setMagnificationFilter(Filter.NEAREST);
      model.opacityTexture.setMinificationFilter(Filter.NEAREST);
      model.opacityTexture.setMagnificationFilter(Filter.NEAREST);
    } else {
      model.colorTexture.setMinificationFilter(Filter.LINEAR);
      model.colorTexture.setMagnificationFilter(Filter.LINEAR);
      model.opacityTexture.setMinificationFilter(Filter.LINEAR);
      model.opacityTexture.setMagnificationFilter(Filter.LINEAR);
    }

    const cWidth = 1024;
    const cTable = new Uint8Array(cWidth * 3);
    const cfun = actor.getProperty().getRGBTransferFunction();
    if (cfun) {
      const cfunToString = `${cfun.getMTime()}`;
      if (model.colorTextureString !== cfunToString) {
        const cRange = cfun.getRange();
        const cfTable = new Float32Array(cWidth * 3);
        cfun.getTable(cRange[0], cRange[1], cWidth, cfTable, 1);
        for (let i = 0; i < cWidth * 3; ++i) {
          cTable[i] = 255.0 * cfTable[i];
        }
        model.colorTextureString = cfunToString;
        model.colorTexture.create2DFromRaw(
          cWidth,
          1,
          3,
          VtkDataTypes.UNSIGNED_CHAR,
          cTable
        );
      }
    } else {
      const cfunToString = '0';
      if (model.colorTextureString !== cfunToString) {
        for (let i = 0; i < cWidth * 3; ++i) {
          cTable[i] = (255.0 * i) / ((cWidth - 1) * 3);
          cTable[i + 1] = (255.0 * i) / ((cWidth - 1) * 3);
          cTable[i + 2] = (255.0 * i) / ((cWidth - 1) * 3);
        }
        model.colorTextureString = cfunToString;
        model.colorTexture.create2DFromRaw(
          cWidth,
          1,
          3,
          VtkDataTypes.UNSIGNED_CHAR,
          cTable
        );
      }
    }

    const oWidth = 1024;
    const oTable = new Uint8Array(oWidth);
    const ofun = actor.getProperty().getScalarOpacity();
    if (ofun) {
      const ofunToString = `${ofun.getMTime()}`;
      if (model.opacityTextureString !== ofunToString) {
        const oRange = ofun.getRange();
        const ofTable = new Float32Array(oWidth);
        ofun.getTable(oRange[0], oRange[1], oWidth, ofTable, 1);
        for (let i = 0; i < oWidth; ++i) {
          oTable[i] = 255.0 * ofTable[i];
        }
        model.opacityTextureString = ofunToString;
        model.opacityTexture.create2DFromRaw(
          oWidth,
          1,
          1,
          VtkDataTypes.UNSIGNED_CHAR,
          oTable
        );
      }
    } else {
      const ofunToString = '0';
      if (model.opacityTextureString !== ofunToString) {
        // default is opaque
        oTable.fill(255.0);
        model.opacityTextureString = ofunToString;
        model.opacityTexture.create2DFromRaw(
          oWidth,
          1,
          1,
          VtkDataTypes.UNSIGNED_CHAR,
          oTable
        );
      }
    }

    // Find what IJK axis and what direction to slice along
    const { ijkMode } = model.renderable.getClosestIJKAxis();

    // Find the IJK slice
    let nSlice = model.renderable.getSlice();
    if (ijkMode !== model.renderable.getSlicingMode()) {
      // If not IJK slicing, get the IJK slice from the XYZ position/slice
      nSlice = model.renderable.getSliceAtPosition(nSlice);
    }

    // Find sliceOffset
    const ext = image.getExtent();
    let sliceOffset;
    if (ijkMode === SlicingMode.I) {
      sliceOffset = nSlice - ext[0];
    }
    if (ijkMode === SlicingMode.J) {
      sliceOffset = nSlice - ext[2];
    }
    if (ijkMode === SlicingMode.K || ijkMode === SlicingMode.NONE) {
      sliceOffset = nSlice - ext[4];
    }

    // rebuild the VBO if the data has changed
    const toString = `${nSlice}A${image.getMTime()}A${image
      .getPointData()
      .getScalars()
      .getMTime()}B${publicAPI.getMTime()}C${model.renderable.getSlicingMode()}D${actor
      .getProperty()
      .getMTime()}`;
    if (model.VBOBuildString !== toString) {
      // Build the VBOs
      const dims = image.getDimensions();
      const numComponents = image
        .getPointData()
        .getScalars()
        .getNumberOfComponents();
      if (iType === InterpolationType.NEAREST) {
        if (numComponents === 4) {
          model.openGLTexture.setGenerateMipmap(true);
          model.openGLTexture.setMinificationFilter(Filter.NEAREST);
        } else {
          model.openGLTexture.setMinificationFilter(Filter.NEAREST);
        }
        model.openGLTexture.setMagnificationFilter(Filter.NEAREST);
      } else {
        if (numComponents === 4) {
          model.openGLTexture.setGenerateMipmap(true);
          model.openGLTexture.setMinificationFilter(
            Filter.LINEAR_MIPMAP_LINEAR
          );
        } else {
          model.openGLTexture.setMinificationFilter(Filter.LINEAR);
        }
        model.openGLTexture.setMagnificationFilter(Filter.LINEAR);
      }
      model.openGLTexture.setWrapS(Wrap.CLAMP_TO_EDGE);
      model.openGLTexture.setWrapT(Wrap.CLAMP_TO_EDGE);
      const numComp = image
        .getPointData()
        .getScalars()
        .getNumberOfComponents();
      const sliceSize = dims[0] * dims[1] * numComp;

      const ptsArray = new Float32Array(12);
      const tcoordArray = new Float32Array(8);
      for (let i = 0; i < 4; i++) {
        tcoordArray[i * 2] = i % 2 ? 1.0 : 0.0;
        tcoordArray[i * 2 + 1] = i > 1 ? 1.0 : 0.0;
      }

      const basicScalars = image
        .getPointData()
        .getScalars()
        .getData();
      let scalars = null;
      // Get right scalars according to slicing mode
      if (ijkMode === SlicingMode.I) {
        scalars = new basicScalars.constructor(dims[2] * dims[1] * numComp);
        let id = 0;
        for (let k = 0; k < dims[2]; k++) {
          for (let j = 0; j < dims[1]; j++) {
            const bsIdx =
              (sliceOffset + j * dims[0] + k * dims[0] * dims[1]) * numComp;
            id = (k * dims[1] + j) * numComp;
            scalars.set(basicScalars.subarray(bsIdx, bsIdx + numComp), id);
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
      } else if (ijkMode === SlicingMode.J) {
        scalars = new basicScalars.constructor(dims[2] * dims[0] * numComp);
        let id = 0;
        for (let k = 0; k < dims[2]; k++) {
          for (let i = 0; i < dims[0]; i++) {
            const bsIdx =
              (i + sliceOffset * dims[0] + k * dims[0] * dims[1]) * numComp;
            id = (k * dims[0] + i) * numComp;
            scalars.set(basicScalars.subarray(bsIdx, bsIdx + numComp), id);
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
      } else if (ijkMode === SlicingMode.K || ijkMode === SlicingMode.NONE) {
        scalars = basicScalars.subarray(
          sliceOffset * sliceSize,
          (sliceOffset + 1) * sliceSize
        );
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
      } else {
        vtkErrorMacro('Reformat slicing not yet supported.');
      }

      model.openGLTexture.create2DFromRaw(
        dims[0],
        dims[1],
        numComp,
        image
          .getPointData()
          .getScalars()
          .getDataType(),
        scalars
      );
      model.openGLTexture.activate();
      model.openGLTexture.sendParameters();
      model.openGLTexture.deactivate();

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
        tcoords,
        cellOffset: 0,
      });
      model.VBOBuildTime.modified();
      model.VBOBuildString = toString;
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  VBOBuildTime: 0,
  VBOBuildString: null,
  openGLTexture: null,
  tris: null,
  imagemat: null,
  colorTexture: null,
  opacityTexture: null,
  lastHaveSeenDepthRequest: false,
  haveSeenDepthRequest: false,
  lastTextureComponents: 0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  model.tris = vtkHelper.newInstance();
  model.openGLTexture = vtkOpenGLTexture.newInstance();
  model.colorTexture = vtkOpenGLTexture.newInstance();
  model.opacityTexture = vtkOpenGLTexture.newInstance();

  model.imagemat = mat4.create();

  // Build VTK API
  macro.setGet(publicAPI, model, []);

  model.VBOBuildTime = {};
  macro.obj(model.VBOBuildTime);

  // Object methods
  vtkOpenGLImageMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOpenGLImageMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
