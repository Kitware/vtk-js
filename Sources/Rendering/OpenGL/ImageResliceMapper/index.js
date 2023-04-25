import * as macro from 'vtk.js/Sources/macros';

import { mat4, vec3 } from 'gl-matrix';

import vtkClosedPolyLineToSurfaceFilter from 'vtk.js/Sources/Filters/General/ClosedPolyLineToSurfaceFilter';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import vtkCutter from 'vtk.js/Sources/Filters/Core/Cutter';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkHelper from 'vtk.js/Sources/Rendering/OpenGL/Helper';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkOpenGLTexture from 'vtk.js/Sources/Rendering/OpenGL/Texture';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkReplacementShaderMapper from 'vtk.js/Sources/Rendering/OpenGL/ReplacementShaderMapper';
import vtkShaderProgram from 'vtk.js/Sources/Rendering/OpenGL/ShaderProgram';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

import vtkImageResliceMapperVS from 'vtk.js/Sources/Rendering/OpenGL/glsl/vtkImageResliceMapperVS.glsl';
import vtkImageResliceMapperFS from 'vtk.js/Sources/Rendering/OpenGL/glsl/vtkImageResliceMapperFS.glsl';

import InterpolationType from 'vtk.js/Sources/Rendering/Core/ImageProperty/Constants';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import { Filter } from 'vtk.js/Sources/Rendering/OpenGL/Texture/Constants';
import { Representation } from 'vtk.js/Sources/Rendering/Core/Property/Constants';
import { registerOverride } from 'vtk.js/Sources/Rendering/OpenGL/ViewNodeFactory';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// helper methods
// ----------------------------------------------------------------------------

function computeFnToString(property, fn, numberOfComponents) {
  const pwfun = fn.apply(property);
  if (pwfun) {
    const iComps = property.getIndependentComponents();
    return `${property.getMTime()}-${iComps}-${numberOfComponents}`;
  }
  return '0';
}

function safeMatrixMultiply(matrixArray, matrixType, tmpMat) {
  matrixType.identity(tmpMat);
  return matrixArray.reduce((res, matrix, index) => {
    if (index === 0) {
      return matrix ? matrixType.copy(res, matrix) : matrixType.identity(res);
    }
    return matrix ? matrixType.multiply(res, res, matrix) : res;
  }, tmpMat);
}

// ----------------------------------------------------------------------------
// vtkOpenGLImageResliceMapper methods
// ----------------------------------------------------------------------------

function vtkOpenGLImageResliceMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLImageResliceMapper');

  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      model.currentRenderPass = null;
      model._openGLImageSlice = publicAPI.getFirstAncestorOfType(
        'vtkOpenGLImageSlice'
      );
      model._openGLRenderer =
        publicAPI.getFirstAncestorOfType('vtkOpenGLRenderer');
      const ren = model._openGLRenderer.getRenderable();
      model._openGLCamera = model._openGLRenderer.getViewNodeFor(
        ren.getActiveCamera()
      );
      model._openGLRenderWindow = model._openGLRenderer.getParent();
      model.context = model._openGLRenderWindow.getContext();
      model.tris.setOpenGLRenderWindow(model._openGLRenderWindow);
      if (!model.openGLTexture) {
        model.openGLTexture = vtkOpenGLTexture.newInstance();
      }
      model.openGLTexture.setOpenGLRenderWindow(model._openGLRenderWindow);
      model.colorTexture.setOpenGLRenderWindow(model._openGLRenderWindow);
      model.pwfTexture.setOpenGLRenderWindow(model._openGLRenderWindow);
    }
  };

  publicAPI.translucentPass = (prepass, renderPass) => {
    if (prepass) {
      model.currentRenderPass = renderPass;
      publicAPI.render();
    }
  };

  publicAPI.zBufferPass = (prepass) => {
    if (prepass) {
      model.haveSeenDepthRequest = true;
      model.renderDepth = true;
      publicAPI.render();
      model.renderDepth = false;
    }
  };

  publicAPI.opaqueZBufferPass = (prepass) => publicAPI.zBufferPass(prepass);

  publicAPI.opaquePass = (prepass) => {
    if (prepass) {
      publicAPI.render();
    }
  };

  publicAPI.getCoincidentParameters = (ren, actor) => {
    if (model.renderable.getResolveCoincidentTopology()) {
      return model.renderable.getCoincidentTopologyPolygonOffsetParameters();
    }
    return null;
  };

  // Renders myself
  publicAPI.render = () => {
    const actor = model._openGLImageSlice.getRenderable();
    const ren = model._openGLRenderer.getRenderable();
    publicAPI.renderPiece(ren, actor);
  };

  publicAPI.renderPiece = (ren, actor) => {
    publicAPI.invokeEvent({ type: 'StartEvent' });
    model.renderable.update();
    model.currentInput = model.renderable.getInputData();

    if (!model.currentInput) {
      vtkErrorMacro('No input!');
      return;
    }

    publicAPI.updateResliceGeometry();

    publicAPI.renderPieceStart(ren, actor);
    publicAPI.renderPieceDraw(ren, actor);
    publicAPI.renderPieceFinish(ren, actor);
    publicAPI.invokeEvent({ type: 'EndEvent' });
  };

  publicAPI.renderPieceStart = (ren, actor) => {
    // make sure the BOs are up to date
    publicAPI.updateBufferObjects(ren, actor);
    const iType = actor.getProperty().getInterpolationType();
    if (iType === InterpolationType.NEAREST) {
      model.openGLTexture.setMinificationFilter(Filter.NEAREST);
      model.openGLTexture.setMagnificationFilter(Filter.NEAREST);
      model.colorTexture.setMinificationFilter(Filter.NEAREST);
      model.colorTexture.setMagnificationFilter(Filter.NEAREST);
      model.pwfTexture.setMinificationFilter(Filter.NEAREST);
      model.pwfTexture.setMagnificationFilter(Filter.NEAREST);
    } else {
      model.openGLTexture.setMinificationFilter(Filter.LINEAR);
      model.openGLTexture.setMagnificationFilter(Filter.LINEAR);
      model.colorTexture.setMinificationFilter(Filter.LINEAR);
      model.colorTexture.setMagnificationFilter(Filter.LINEAR);
      model.pwfTexture.setMinificationFilter(Filter.LINEAR);
      model.pwfTexture.setMagnificationFilter(Filter.LINEAR);
    }

    // No buffer objects bound.
    model.lastBoundBO = null;
  };

  publicAPI.renderPieceDraw = (ren, actor) => {
    const gl = model.context;

    // render the texture
    model.openGLTexture.activate();
    model.colorTexture.activate();
    model.pwfTexture.activate();

    // update shaders if required
    publicAPI.updateShaders(model.tris, ren, actor);

    // Finally draw
    gl.drawArrays(gl.TRIANGLES, 0, model.tris.getCABO().getElementCount());
    model.tris.getVAO().release();

    model.openGLTexture.deactivate();
    model.colorTexture.deactivate();
    model.pwfTexture.deactivate();
  };

  publicAPI.renderPieceFinish = (ren, actor) => {};

  publicAPI.updateBufferObjects = (ren, actor) => {
    // Rebuild buffer objects if needed
    if (publicAPI.getNeedToRebuildBufferObjects(ren, actor)) {
      publicAPI.buildBufferObjects(ren, actor);
    }
  };

  publicAPI.getNeedToRebuildBufferObjects = (ren, actor) =>
    model.VBOBuildTime.getMTime() < publicAPI.getMTime() ||
    model.VBOBuildTime.getMTime() < actor.getMTime() ||
    model.VBOBuildTime.getMTime() < model.renderable.getMTime() ||
    model.VBOBuildTime.getMTime() < actor.getProperty().getMTime() ||
    model.VBOBuildTime.getMTime() < model.currentInput.getMTime() ||
    model.VBOBuildTime.getMTime() < model.resliceGeom.getMTime();

  publicAPI.buildBufferObjects = (ren, actor) => {
    const image = model.currentInput;

    if (!image) {
      return;
    }

    const scalars = image.getPointData()?.getScalars();
    if (!scalars) {
      return;
    }

    const numComp = scalars.getNumberOfComponents();

    if (!model._externalOpenGLTexture) {
      const toString = `${image.getMTime()}A${scalars.getMTime()}`;
      if (model.openGLTextureString !== toString) {
        // Build the image scalar texture
        const dims = image.getDimensions();
        // Use norm16 for the 3D texture if the extension is available
        model.openGLTexture.getOglNorm16Ext(
          model.context.getExtension('EXT_texture_norm16')
        );
        model.openGLTexture.releaseGraphicsResources(model._openGLRenderWindow);
        model.openGLTexture.resetFormatAndType();
        model.openGLTexture.create3DFilterableFromDataArray(
          dims[0],
          dims[1],
          dims[2],
          scalars
        );
        model.openGLTextureString = toString;
      }
    }

    const ppty = actor.getProperty();
    const iComps = ppty.getIndependentComponents();
    const numIComps = iComps ? numComp : 1;
    const textureHeight = iComps ? 2 * numIComps : 1;

    const cfunToString = computeFnToString(
      ppty,
      ppty.getRGBTransferFunction,
      numIComps
    );

    if (model.colorTextureString !== cfunToString) {
      const cWidth = 1024;
      const cSize = cWidth * textureHeight * 3;
      const cTable = new Uint8Array(cSize);
      let cfun = ppty.getRGBTransferFunction();
      if (cfun) {
        const tmpTable = new Float32Array(cWidth * 3);

        for (let c = 0; c < numIComps; c++) {
          cfun = ppty.getRGBTransferFunction(c);
          const cRange = cfun.getRange();
          cfun.getTable(cRange[0], cRange[1], cWidth, tmpTable, 1);
          if (iComps) {
            for (let i = 0; i < cWidth * 3; i++) {
              cTable[c * cWidth * 6 + i] = 255.0 * tmpTable[i];
              cTable[c * cWidth * 6 + i + cWidth * 3] = 255.0 * tmpTable[i];
            }
          } else {
            for (let i = 0; i < cWidth * 3; i++) {
              cTable[c * cWidth * 6 + i] = 255.0 * tmpTable[i];
            }
          }
        }
        model.colorTexture.releaseGraphicsResources(model._openGLRenderWindow);
        model.colorTexture.resetFormatAndType();
        model.colorTexture.create2DFromRaw(
          cWidth,
          textureHeight,
          3,
          VtkDataTypes.UNSIGNED_CHAR,
          cTable
        );
      } else {
        for (let i = 0; i < cWidth * 3; ++i) {
          cTable[i] = (255.0 * i) / ((cWidth - 1) * 3);
          cTable[i + 1] = (255.0 * i) / ((cWidth - 1) * 3);
          cTable[i + 2] = (255.0 * i) / ((cWidth - 1) * 3);
        }
        model.colorTexture.create2DFromRaw(
          cWidth,
          1,
          3,
          VtkDataTypes.UNSIGNED_CHAR,
          cTable
        );
      }

      model.colorTextureString = cfunToString;
    }

    // Build piecewise function buffer.  This buffer is used either
    // for component weighting or opacity, depending on whether we're
    // rendering components independently or not.
    const pwfunToString = computeFnToString(
      ppty,
      ppty.getPiecewiseFunction,
      numIComps
    );

    if (model.pwfTextureString !== pwfunToString) {
      const pwfWidth = 1024;
      const pwfSize = pwfWidth * textureHeight;
      const pwfTable = new Uint8Array(pwfSize);
      let pwfun = ppty.getPiecewiseFunction();
      // support case where pwfun is added/removed
      model.pwfTexture.releaseGraphicsResources(model._openGLRenderWindow);
      model.pwfTexture.resetFormatAndType();
      if (pwfun) {
        const pwfFloatTable = new Float32Array(pwfSize);
        const tmpTable = new Float32Array(pwfWidth);

        for (let c = 0; c < numIComps; ++c) {
          pwfun = ppty.getPiecewiseFunction(c);
          if (pwfun === null) {
            // Piecewise constant max if no function supplied for this component
            pwfFloatTable.fill(1.0);
          } else {
            const pwfRange = pwfun.getRange();
            pwfun.getTable(pwfRange[0], pwfRange[1], pwfWidth, tmpTable, 1);
            // adjust for sample distance etc
            if (iComps) {
              for (let i = 0; i < pwfWidth; i++) {
                pwfFloatTable[c * pwfWidth * 2 + i] = tmpTable[i];
                pwfFloatTable[c * pwfWidth * 2 + i + pwfWidth] = tmpTable[i];
              }
            } else {
              for (let i = 0; i < pwfWidth; i++) {
                pwfFloatTable[c * pwfWidth * 2 + i] = tmpTable[i];
              }
            }
          }
        }
        model.pwfTexture.create2DFromRaw(
          pwfWidth,
          textureHeight,
          1,
          VtkDataTypes.FLOAT,
          pwfFloatTable
        );
      } else {
        // default is opaque
        pwfTable.fill(255.0);
        model.pwfTexture.create2DFromRaw(
          pwfWidth,
          1,
          1,
          VtkDataTypes.UNSIGNED_CHAR,
          pwfTable
        );
      }
      model.pwfTextureString = pwfunToString;
    }

    const vboString = `${model.resliceGeom.getMTime()}A${model.renderable.getSlabThickness()}`;
    if (
      !model.tris.getCABO().getElementCount() ||
      model.VBOBuildString !== vboString
    ) {
      const points = vtkDataArray.newInstance({
        numberOfComponents: 3,
        values: model.resliceGeom.getPoints().getData(),
      });
      points.setName('points');
      const cells = vtkDataArray.newInstance({
        numberOfComponents: 1,
        values: model.resliceGeom.getPolys().getData(),
      });

      const options = {
        points,
        cellOffset: 0,
      };
      if (model.renderable.getSlabThickness() > 0.0) {
        const n = model.resliceGeom.getPointData().getNormals();
        if (!n) {
          vtkErrorMacro('Slab mode requested without normals');
        } else {
          options.normals = n;
        }
      }
      model.tris
        .getCABO()
        .createVBO(cells, 'polys', Representation.SURFACE, options);
    }

    model.VBOBuildString = vboString;
    model.VBOBuildTime.modified();
  };

  publicAPI.updateShaders = (cellBO, ren, actor) => {
    model.lastBoundBO = cellBO;

    // has something changed that would require us to recreate the shader?
    if (publicAPI.getNeedToRebuildShaders(cellBO, ren, actor)) {
      const shaders = { Vertex: null, Fragment: null, Geometry: null };
      publicAPI.buildShaders(shaders, ren, actor);

      // compile and bind the program if needed
      const newShader = model._openGLRenderWindow
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
      model._openGLRenderWindow
        .getShaderCache()
        .readyShaderProgram(cellBO.getProgram());
    }

    cellBO.getVAO().bind();
    publicAPI.setMapperShaderParameters(cellBO, ren, actor);
    publicAPI.setCameraShaderParameters(cellBO, ren, actor);
    publicAPI.setPropertyShaderParameters(cellBO, ren, actor);
  };

  publicAPI.setMapperShaderParameters = (cellBO, ren, actor) => {
    const program = cellBO.getProgram();

    if (
      cellBO.getCABO().getElementCount() &&
      (model.VBOBuildTime.getMTime() >
        cellBO.getAttributeUpdateTime().getMTime() ||
        cellBO.getShaderSourceTime().getMTime() >
          cellBO.getAttributeUpdateTime().getMTime())
    ) {
      // Set the 3D texture
      if (program.isUniformUsed('texture1')) {
        program.setUniformi('texture1', model.openGLTexture.getTextureUnit());
      }

      // Set the plane vertex attributes
      if (program.isAttributeUsed('vertexWC')) {
        if (
          !cellBO
            .getVAO()
            .addAttributeArray(
              program,
              cellBO.getCABO(),
              'vertexWC',
              cellBO.getCABO().getVertexOffset(),
              cellBO.getCABO().getStride(),
              model.context.FLOAT,
              3,
              model.context.FALSE
            )
        ) {
          vtkErrorMacro('Error setting vertexWC in shader VAO.');
        }
      }

      // If we are doing slab mode, we need normals
      if (program.isAttributeUsed('normalWC')) {
        if (
          !cellBO
            .getVAO()
            .addAttributeArray(
              program,
              cellBO.getCABO(),
              'normalWC',
              cellBO.getCABO().getNormalOffset(),
              cellBO.getCABO().getStride(),
              model.context.FLOAT,
              3,
              model.context.FALSE
            )
        ) {
          vtkErrorMacro('Error setting normalWC in shader VAO.');
        }
      }
      if (program.isUniformUsed('slabThickness')) {
        program.setUniformf(
          'slabThickness',
          model.renderable.getSlabThickness()
        );
      }
      if (program.isUniformUsed('spacing')) {
        program.setUniform3fv('spacing', model.currentInput.getSpacing());
      }
      if (program.isUniformUsed('slabType')) {
        program.setUniformi('slabType', model.renderable.getSlabType());
      }
      if (program.isUniformUsed('slabType')) {
        program.setUniformi('slabType', model.renderable.getSlabType());
      }
      if (program.isUniformUsed('slabTrapezoid')) {
        program.setUniformi(
          'slabTrapezoid',
          model.renderable.getSlabTrapezoidIntegration()
        );
      }

      const shiftScaleEnabled = cellBO.getCABO().getCoordShiftAndScaleEnabled();
      const inverseShiftScaleMatrix = shiftScaleEnabled
        ? cellBO.getCABO().getInverseShiftAndScaleMatrix()
        : null;

      // Set the world->texture matrix
      if (program.isUniformUsed('WCTCMatrix')) {
        const image = model.currentInput;
        mat4.identity(model.tmpMat4);
        const bounds = image.getBounds();
        const sc = [
          bounds[1] - bounds[0],
          bounds[3] - bounds[2],
          bounds[5] - bounds[4],
        ];
        const o = [bounds[0], bounds[2], bounds[4]];
        const q = [0, 0, 0, 1];
        mat4.fromRotationTranslationScale(model.tmpMat4, q, o, sc);
        mat4.invert(model.tmpMat4, model.tmpMat4);
        if (inverseShiftScaleMatrix) {
          mat4.multiply(model.tmpMat4, model.tmpMat4, inverseShiftScaleMatrix);
        }
        program.setUniformMatrix('WCTCMatrix', model.tmpMat4);
      }
      cellBO.getAttributeUpdateTime().modified();
    }

    // Depth request
    if (model.haveSeenDepthRequest) {
      cellBO
        .getProgram()
        .setUniformi('depthRequest', model.renderDepth ? 1 : 0);
    }

    // handle coincident
    if (cellBO.getProgram().isUniformUsed('coffset')) {
      const cp = publicAPI.getCoincidentParameters(ren, actor);
      cellBO.getProgram().setUniformf('coffset', cp.offset);
      // cfactor isn't always used when coffset is.
      if (cellBO.getProgram().isUniformUsed('cfactor')) {
        cellBO.getProgram().setUniformf('cfactor', cp.factor);
      }
    }
  };

  publicAPI.setCameraShaderParameters = (cellBO, ren, actor) => {
    // [WMVP]C == {world, model, view, projection} coordinates
    // e.g. WCPC == world to projection coordinate transformation
    const keyMats = model._openGLCamera.getKeyMatrices(ren);
    const actMats = model._openGLImageSlice.getKeyMatrices();

    const shiftScaleEnabled = cellBO.getCABO().getCoordShiftAndScaleEnabled();
    const inverseShiftScaleMatrix = shiftScaleEnabled
      ? cellBO.getCABO().getInverseShiftAndScaleMatrix()
      : null;

    const program = cellBO.getProgram();
    if (program.isUniformUsed('MCPCMatrix')) {
      mat4.identity(model.tmpMat4);
      program.setUniformMatrix(
        'MCPCMatrix',
        safeMatrixMultiply(
          [keyMats.wcpc, actMats.mcwc, inverseShiftScaleMatrix],
          mat4,
          model.tmpMat4
        )
      );
    }
    if (program.isUniformUsed('MCVCMatrix')) {
      mat4.identity(model.tmpMat4);
      program.setUniformMatrix(
        'MCVCMatrix',
        safeMatrixMultiply(
          [keyMats.wcvc, actMats.mcwc, inverseShiftScaleMatrix],
          mat4,
          model.tmpMat4
        )
      );
    }
  };

  publicAPI.setPropertyShaderParameters = (cellBO, ren, actor) => {
    const program = cellBO.getProgram();

    const ppty = actor.getProperty();

    const opacity = ppty.getOpacity();
    program.setUniformf('opacity', opacity);

    // Component mix
    // Independent components: Mixed according to component weights
    // Dependent components: Mixed using the following logic:
    //    - 2 comps => LA
    //    - 3 comps => RGB + opacity from pwf
    //    - 4 comps => RGBA
    const numComp = model.openGLTexture.getComponents();
    const iComps = ppty.getIndependentComponents();
    if (iComps) {
      for (let i = 0; i < numComp; ++i) {
        program.setUniformf(`mix${i}`, ppty.getComponentWeight(i));
      }
    }

    // Color opacity map
    const volInfo = model.openGLTexture.getVolumeInfo();

    // three levels of shift scale combined into one
    // for performance in the fragment shader
    for (let i = 0; i < numComp; i++) {
      let cw = ppty.getColorWindow();
      let cl = ppty.getColorLevel();
      const target = iComps ? i : 0;
      const cfun = ppty.getRGBTransferFunction(target);
      if (cfun && ppty.getUseLookupTableScalarRange()) {
        const cRange = cfun.getRange();
        cw = cRange[1] - cRange[0];
        cl = 0.5 * (cRange[1] + cRange[0]);
      }

      const scale = volInfo.scale[i] / cw;
      const shift = (volInfo.offset[i] - cl) / cw + 0.5;
      program.setUniformf(`cshift${i}`, shift);
      program.setUniformf(`cscale${i}`, scale);
    }
    const texColorUnit = model.colorTexture.getTextureUnit();
    program.setUniformi('colorTexture1', texColorUnit);

    // pwf shift/scale
    for (let i = 0; i < numComp; i++) {
      let pwfScale = 1.0;
      let pwfShift = 0.0;
      const target = iComps ? i : 0;
      const pwfun = ppty.getPiecewiseFunction(target);
      if (pwfun) {
        const pwfRange = pwfun.getRange();
        const length = pwfRange[1] - pwfRange[0];
        const mid = 0.5 * (pwfRange[0] + pwfRange[1]);
        pwfScale = volInfo.scale[i] / length;
        pwfShift = (volInfo.offset[i] - mid) / length + 0.5;
      }
      program.setUniformf(`pwfshift${i}`, pwfShift);
      program.setUniformf(`pwfscale${i}`, pwfScale);
    }
    const texOpacityUnit = model.pwfTexture.getTextureUnit();
    program.setUniformi('pwfTexture1', texOpacityUnit);

    // Background color
    program.setUniform4fv(
      'backgroundColor',
      model.renderable.getBackgroundColor()
    );
  };

  publicAPI.getNeedToRebuildShaders = (cellBO, ren, actor) => {
    // has something changed that would require us to recreate the shader?
    // candidates are
    // property modified (representation interpolation and lighting)
    // input modified
    // light complexity changed
    // render pass shader replacement changed
    const tNumComp = model.openGLTexture.getComponents();
    const iComp = actor.getProperty().getIndependentComponents();
    const slabTh = model.renderable.getSlabThickness();
    const slabType = model.renderable.getSlabType();
    const slabTrap = model.renderable.getSlabTrapezoidIntegration();

    // has the render pass shader replacement changed? Two options
    let needRebuild = false;
    if (
      (!model.currentRenderPass && model.lastRenderPassShaderReplacement) ||
      (model.currentRenderPass &&
        model.currentRenderPass.getShaderReplacement() !==
          model.lastRenderPassShaderReplacement)
    ) {
      needRebuild = true;
    }

    if (
      needRebuild ||
      model.lastHaveSeenDepthRequest !== model.haveSeenDepthRequest ||
      cellBO.getProgram() === 0 ||
      model.lastTextureComponents !== tNumComp ||
      model.lastIndependentComponents !== iComp ||
      model.lastSlabThickness !== slabTh ||
      model.lastSlabType !== slabType ||
      model.lastSlabTrapezoidIntegration !== slabTrap
    ) {
      model.lastHaveSeenDepthRequest = model.haveSeenDepthRequest;
      model.lastTextureComponents = tNumComp;
      model.lastIndependentComponents = iComp;
      model.lastSlabThickness = slabTh;
      model.lastSlabType = slabType;
      model.lastSlabTrapezoidIntegration = slabTrap;
      return true;
    }

    return false;
  };

  publicAPI.getShaderTemplate = (shaders, ren, actor) => {
    shaders.Vertex = vtkImageResliceMapperVS;
    shaders.Fragment = vtkImageResliceMapperFS;
    shaders.Geometry = '';
  };

  publicAPI.replaceShaderValues = (shaders, ren, actor) => {
    publicAPI.replaceShaderTCoord(shaders, ren, actor);
    publicAPI.replaceShaderPositionVC(shaders, ren, actor);

    if (model.haveSeenDepthRequest) {
      let FSSource = shaders.Fragment;
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
      shaders.Fragment = FSSource;
    }
    publicAPI.replaceShaderCoincidentOffset(shaders, ren, actor);
  };

  publicAPI.replaceShaderTCoord = (shaders, ren, actor) => {
    let VSSource = shaders.Vertex;
    const GSSource = shaders.Geometry;
    let FSSource = shaders.Fragment;

    const tcoordVSDec = ['uniform mat4 WCTCMatrix;', 'out vec3 fragTexCoord;'];
    const slabThickness = model.renderable.getSlabThickness();
    VSSource = vtkShaderProgram.substitute(
      VSSource,
      '//VTK::TCoord::Dec',
      tcoordVSDec
    ).result;
    const tcoordVSImpl = ['fragTexCoord = (WCTCMatrix * vertexWC).xyz;'];
    VSSource = vtkShaderProgram.substitute(
      VSSource,
      '//VTK::TCoord::Impl',
      tcoordVSImpl
    ).result;

    const tNumComp = model.openGLTexture.getComponents();
    const iComps = actor.getProperty().getIndependentComponents();

    let tcoordFSDec = [
      'in vec3 fragTexCoord;',
      'uniform highp sampler3D texture1;',
      'uniform mat4 WCTCMatrix;',
      // color shift and scale
      'uniform float cshift0;',
      'uniform float cscale0;',
      // pwf shift and scale
      'uniform float pwfshift0;',
      'uniform float pwfscale0;',
      // color and pwf textures
      'uniform sampler2D colorTexture1;',
      'uniform sampler2D pwfTexture1;',
      // opacity
      'uniform float opacity;',
      // background color
      'uniform vec4 backgroundColor;',
    ];
    if (iComps) {
      for (let comp = 1; comp < tNumComp; comp++) {
        tcoordFSDec = tcoordFSDec.concat([
          // color shift and scale
          `uniform float cshift${comp};`,
          `uniform float cscale${comp};`,
          // weighting shift and scale
          `uniform float pwfshift${comp};`,
          `uniform float pwfscale${comp};`,
        ]);
      }
      // the heights defined below are the locations
      // for the up to four components of the tfuns
      // the tfuns have a height of 2XnumComps pixels so the
      // values are computed to hit the middle of the two rows
      // for that component
      switch (tNumComp) {
        case 1:
          tcoordFSDec = tcoordFSDec.concat([
            'uniform float mix0;',
            '#define height0 0.5',
          ]);
          break;
        case 2:
          tcoordFSDec = tcoordFSDec.concat([
            'uniform float mix0;',
            'uniform float mix1;',
            '#define height0 0.25',
            '#define height1 0.75',
          ]);
          break;
        case 3:
          tcoordFSDec = tcoordFSDec.concat([
            'uniform float mix0;',
            'uniform float mix1;',
            'uniform float mix2;',
            '#define height0 0.17',
            '#define height1 0.5',
            '#define height2 0.83',
          ]);
          break;
        case 4:
          tcoordFSDec = tcoordFSDec.concat([
            'uniform float mix0;',
            'uniform float mix1;',
            'uniform float mix2;',
            'uniform float mix3;',
            '#define height0 0.125',
            '#define height1 0.375',
            '#define height2 0.625',
            '#define height3 0.875',
          ]);
          break;
        default:
          vtkErrorMacro('Unsupported number of independent coordinates.');
      }
    }
    if (slabThickness > 0.0) {
      tcoordFSDec = tcoordFSDec.concat([
        'uniform vec3 spacing;',
        'uniform float slabThickness;',
        'uniform int slabType;',
        'uniform int slabTrapezoid;',
      ]);
      tcoordFSDec = tcoordFSDec.concat([
        'vec4 compositeValue(vec4 currVal, vec4 valToComp, int trapezoid)',
        '{',
        '  vec4 retVal = vec4(1.0);',
        '  if (slabType == 0) // min',
        '  {',
        '    retVal = min(currVal, valToComp);',
        '  }',
        '  else if (slabType == 1) // max',
        '  {',
        '    retVal = max(currVal, valToComp);',
        '  }',
        '  else if (slabType == 3) // sum',
        '  {',
        '    retVal = currVal + (trapezoid > 0 ? 0.5 * valToComp : valToComp); ',
        '  }',
        '  else // mean',
        '  {',
        '    retVal = currVal + (trapezoid > 0 ? 0.5 * valToComp : valToComp); ',
        '  }',
        '  return retVal;',
        '}',
      ]);
    }
    FSSource = vtkShaderProgram.substitute(
      FSSource,
      '//VTK::TCoord::Dec',
      tcoordFSDec
    ).result;

    let tcoordFSImpl = [
      'if (any(greaterThan(fragTexCoord, vec3(1.0))) || any(lessThan(fragTexCoord, vec3(0.0))))',
      '{',
      '  // set the background color and exit',
      '  gl_FragData[0] = backgroundColor;',
      '  return;',
      '}',
      'vec4 tvalue = texture(texture1, fragTexCoord);',
    ];
    if (slabThickness > 0.0) {
      tcoordFSImpl = tcoordFSImpl.concat([
        '// Get the first and last samples',
        'int numSlices = 1;',
        'vec3 normalxspacing = normalWCVSOutput * spacing * 0.5;',
        'float distTraveled = length(normalxspacing);',
        'int trapezoid = 0;',
        'while (distTraveled < slabThickness * 0.5)',
        '{',
        '  distTraveled += length(normalxspacing);',
        '  float fnumSlices = float(numSlices);',
        '  if (distTraveled > slabThickness * 0.5)',
        '  {',
        '    // Before stepping outside the slab, sample at the boundaries',
        '    normalxspacing = normalWCVSOutput * slabThickness * 0.5 / fnumSlices;',
        '    trapezoid = slabTrapezoid;',
        '  }',
        '  vec3 fragTCoordNeg = (WCTCMatrix * vec4(vertexWCVSOutput.xyz - fnumSlices * normalxspacing, 1.0)).xyz;',
        '  if (!any(greaterThan(fragTCoordNeg, vec3(1.0))) && !any(lessThan(fragTCoordNeg, vec3(0.0))))',
        '  {',
        '    vec4 newVal = texture(texture1, fragTCoordNeg);',
        '    tvalue = compositeValue(tvalue, newVal, trapezoid);',
        '    numSlices += 1;',
        '  }',
        '  vec3 fragTCoordPos = (WCTCMatrix * vec4(vertexWCVSOutput.xyz + fnumSlices * normalxspacing, 1.0)).xyz;',
        '  if (!any(greaterThan(fragTCoordNeg, vec3(1.0))) && !any(lessThan(fragTCoordNeg, vec3(0.0))))',
        '  {',
        '    vec4 newVal = texture(texture1, fragTCoordPos);',
        '    tvalue = compositeValue(tvalue, newVal, trapezoid);',
        '    numSlices += 1;',
        '  }',
        '}',
        '// Finally, if slab type is *mean*, divide the sum by the numSlices',
        'if (slabType == 2)',
        '{',
        '  tvalue = tvalue / float(numSlices);',
        '}',
      ]);
    }
    if (iComps) {
      const rgba = ['r', 'g', 'b', 'a'];
      for (let comp = 0; comp < tNumComp; ++comp) {
        tcoordFSImpl = tcoordFSImpl.concat([
          `vec3 tcolor${comp} = mix${comp} * texture2D(colorTexture1, vec2(tvalue.${rgba[comp]} * cscale${comp} + cshift${comp}, height${comp})).rgb;`,
          `float compWeight${comp} = mix${comp} * texture2D(pwfTexture1, vec2(tvalue.${rgba[comp]} * pwfscale${comp} + pwfshift${comp}, height${comp})).r;`,
        ]);
      }
      switch (tNumComp) {
        case 1:
          tcoordFSImpl = tcoordFSImpl.concat([
            'gl_FragData[0] = vec4(tcolor0.rgb, compWeight0 * opacity);',
          ]);
          break;
        case 2:
          tcoordFSImpl = tcoordFSImpl.concat([
            'float weightSum = compWeight0 + compWeight1;',
            'gl_FragData[0] = vec4(vec3((tcolor0.rgb * (compWeight0 / weightSum)) + (tcolor1.rgb * (compWeight1 / weightSum))), opacity);',
          ]);
          break;
        case 3:
          tcoordFSImpl = tcoordFSImpl.concat([
            'float weightSum = compWeight0 + compWeight1 + compWeight2;',
            'gl_FragData[0] = vec4(vec3((tcolor0.rgb * (compWeight0 / weightSum)) + (tcolor1.rgb * (compWeight1 / weightSum)) + (tcolor2.rgb * (compWeight2 / weightSum))), opacity);',
          ]);
          break;
        case 4:
          tcoordFSImpl = tcoordFSImpl.concat([
            'float weightSum = compWeight0 + compWeight1 + compWeight2 + compWeight3;',
            'gl_FragData[0] = vec4(vec3((tcolor0.rgb * (compWeight0 / weightSum)) + (tcolor1.rgb * (compWeight1 / weightSum)) + (tcolor2.rgb * (compWeight2 / weightSum)) + (tcolor3.rgb * (compWeight3 / weightSum))), opacity);',
          ]);
          break;
        default:
          vtkErrorMacro('Unsupported number of independent coordinates.');
      }
    } else {
      // dependent components
      switch (tNumComp) {
        case 1:
          tcoordFSImpl = tcoordFSImpl.concat([
            '// Dependent components',
            'float intensity = tvalue.r;',
            'vec3 tcolor = texture2D(colorTexture1, vec2(intensity * cscale0 + cshift0, 0.5)).rgb;',
            'float scalarOpacity = texture2D(pwfTexture1, vec2(intensity * pwfscale0 + pwfshift0, 0.5)).r;',
            'gl_FragData[0] = vec4(tcolor, scalarOpacity * opacity);',
          ]);
          break;
        case 2:
          tcoordFSImpl = tcoordFSImpl.concat([
            'float intensity = tvalue.r*cscale0 + cshift0;',
            'gl_FragData[0] = vec4(texture2D(colorTexture1, vec2(intensity, 0.5)).rgb, pwfscale0*tvalue.g + pwfshift0);',
          ]);
          break;
        case 3:
          tcoordFSImpl = tcoordFSImpl.concat([
            'vec4 tcolor = cscale0*tvalue + cshift0;',
            'gl_FragData[0] = vec4(texture2D(colorTexture1, vec2(tcolor.r,0.5)).r,',
            '  texture2D(colorTexture1, vec2(tcolor.g,0.5)).r,',
            '  texture2D(colorTexture1, vec2(tcolor.b,0.5)).r, opacity);',
          ]);
          break;
        default:
          tcoordFSImpl = tcoordFSImpl.concat([
            'vec4 tcolor = cscale0*tvalue + cshift0;',
            'gl_FragData[0] = vec4(texture2D(colorTexture1, vec2(tcolor.r,0.5)).r,',
            '  texture2D(colorTexture1, vec2(tcolor.g,0.5)).r,',
            '  texture2D(colorTexture1, vec2(tcolor.b,0.5)).r, tcolor.a);',
          ]);
      }
    }
    FSSource = vtkShaderProgram.substitute(
      FSSource,
      '//VTK::TCoord::Impl',
      tcoordFSImpl
    ).result;

    shaders.Vertex = VSSource;
    shaders.Fragment = FSSource;
    shaders.Geometry = GSSource;
  };

  publicAPI.replaceShaderPositionVC = (shaders, ren, actor) => {
    let VSSource = shaders.Vertex;
    const GSSource = shaders.Geometry;
    let FSSource = shaders.Fragment;

    const slabThickness = model.renderable.getSlabThickness();
    let posVCVSDec = ['attribute vec4 vertexWC;'];
    // Add a unique hash to the shader to ensure that the shader program is unique to this mapper.
    posVCVSDec = posVCVSDec.concat([
      `//${publicAPI.getMTime()}${model.resliceGeomUpdateString}`,
    ]);
    if (slabThickness > 0.0) {
      posVCVSDec = posVCVSDec.concat([
        'attribute vec3 normalWC;',
        'varying vec3 normalWCVSOutput;',
        'varying vec4 vertexWCVSOutput;',
      ]);
    }
    VSSource = vtkShaderProgram.substitute(
      VSSource,
      '//VTK::PositionVC::Dec',
      posVCVSDec
    ).result;
    let posVCVSImpl = ['gl_Position = MCPCMatrix * vertexWC;'];
    if (slabThickness > 0.0) {
      posVCVSImpl = posVCVSImpl.concat([
        'normalWCVSOutput = normalWC;',
        'vertexWCVSOutput = vertexWC;',
      ]);
    }
    VSSource = vtkShaderProgram.substitute(
      VSSource,
      '//VTK::PositionVC::Impl',
      posVCVSImpl
    ).result;
    VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Camera::Dec', [
      'uniform mat4 MCPCMatrix;',
      'uniform mat4 MCVCMatrix;',
    ]).result;
    let posVCFSDec = [];
    if (slabThickness > 0.0) {
      posVCFSDec = posVCFSDec.concat([
        'varying vec3 normalWCVSOutput;',
        'varying vec4 vertexWCVSOutput;',
      ]);
    }
    FSSource = vtkShaderProgram.substitute(
      FSSource,
      '//VTK::PositionVC::Dec',
      posVCFSDec
    ).result;
    shaders.Vertex = VSSource;
    shaders.Geometry = GSSource;
    shaders.Fragment = FSSource;
  };

  function isVectorAxisAligned(n) {
    vtkMath.normalize(n);
    const tmpN = [0, 0, 0];
    for (let i = 0; i < 3; ++i) {
      vec3.zero(tmpN);
      tmpN[i] = 1.0;
      const dotP = vtkMath.dot(n, tmpN);
      if (dotP < -0.999 || dotP > 0.999) {
        return [true, i];
      }
    }
    return [false, 2];
  }

  publicAPI.updateResliceGeometry = () => {
    let resGeomString = '';
    const image = model.currentInput;
    const imageBounds = image?.getBounds();
    // Orthogonal slicing by default
    let orthoSlicing = true;
    let orthoAxis = 2;
    if (model.renderable.getSlicePolyData()) {
      resGeomString = resGeomString.concat(
        `PolyData${model.renderable.getSlicePolyData().getMTime()}`
      );
    } else if (model.renderable.getSlicePlane()) {
      resGeomString = resGeomString.concat(
        `Plane${model.renderable.getSlicePlane().getMTime()}`
      );
      if (image) {
        resGeomString = resGeomString.concat(`Image${image.getMTime()}`);
      }
      // Check to see if we can bypass oblique slicing related bounds computation
      [orthoSlicing, orthoAxis] = isVectorAxisAligned(
        model.renderable.getSlicePlane().getNormal()
      );
    } else {
      // Create a default slice plane here
      const plane = vtkPlane.newInstance();
      plane.setNormal(0, 0, 1);
      let bds = [0, 1, 0, 1, 0, 1];
      if (image) {
        bds = imageBounds;
      }
      plane.setOrigin(bds[0], bds[2], 0.5 * (bds[5] + bds[4]));
      model.renderable.setSlicePlane(plane);
      resGeomString = resGeomString.concat(
        `Plane${model.renderable.getSlicePlane()?.getMTime()}`
      );
      if (image) {
        resGeomString = resGeomString.concat(`Image${image.getMTime()}`);
      }
    }

    if (!model.resliceGeom || model.resliceGeomUpdateString !== resGeomString) {
      if (model.renderable.getSlicePolyData()) {
        model.resliceGeom = model.renderable.getSlicePolyData();
      } else if (model.renderable.getSlicePlane()) {
        const bounds = image ? imageBounds : [0, 1, 0, 1, 0, 1];
        if (!orthoSlicing) {
          const cube = vtkCubeSource.newInstance();
          cube.setCenter(
            0.5 * (bounds[0] + bounds[1]),
            0.5 * (bounds[2] + bounds[3]),
            0.5 * (bounds[4] + bounds[5])
          );
          cube.setXLength(bounds[1] - bounds[0]);
          cube.setYLength(bounds[3] - bounds[2]);
          cube.setZLength(bounds[5] - bounds[4]);
          const cutter = vtkCutter.newInstance();
          cutter.setInputConnection(cube.getOutputPort());
          cutter.setCutFunction(model.renderable.getSlicePlane());
          const pds = vtkClosedPolyLineToSurfaceFilter.newInstance();
          pds.setInputConnection(cutter.getOutputPort());
          pds.update();
          model.resliceGeom = pds.getOutputData();
          // The above method does not generate point normals
          // Set it manually here.
          const n = model.renderable.getSlicePlane().getNormal();
          const npts = model.resliceGeom.getNumberOfPoints();
          vtkMath.normalize(n);
          const normalsData = new Float32Array(npts * 3);
          for (let i = 0; i < npts; ++i) {
            normalsData[3 * i] = n[0];
            normalsData[3 * i + 1] = n[1];
            normalsData[3 * i + 2] = n[2];
          }
          const normals = vtkDataArray.newInstance({
            numberOfComponents: 3,
            values: normalsData,
            name: 'Normals',
          });
          model.resliceGeom.getPointData().setNormals(normals);
        } else {
          const ptsArray = new Float32Array(12);
          const o = model.renderable.getSlicePlane().getOrigin();
          const otherAxes = [(orthoAxis + 1) % 3, (orthoAxis + 2) % 3].sort();
          let ptIdx = 0;
          for (let i = 0; i < 2; ++i) {
            for (let j = 0; j < 2; ++j) {
              ptsArray[ptIdx + orthoAxis] = o[orthoAxis];
              ptsArray[ptIdx + otherAxes[0]] = bounds[2 * otherAxes[0] + j];
              ptsArray[ptIdx + otherAxes[1]] = bounds[2 * otherAxes[1] + i];
              ptIdx += 3;
            }
          }

          const cellArray = new Uint16Array(8);
          cellArray[0] = 3;
          cellArray[1] = 0;
          cellArray[2] = 1;
          cellArray[3] = 3;
          cellArray[4] = 3;
          cellArray[5] = 0;
          cellArray[6] = 3;
          cellArray[7] = 2;

          const n = model.renderable.getSlicePlane().getNormal();
          vtkMath.normalize(n);
          const normalsData = new Float32Array(12);
          for (let i = 0; i < 4; ++i) {
            normalsData[3 * i] = n[0];
            normalsData[3 * i + 1] = n[1];
            normalsData[3 * i + 2] = n[2];
          }

          if (!model.resliceGeom) {
            model.resliceGeom = vtkPolyData.newInstance();
          }
          model.resliceGeom.getPoints().setData(ptsArray, 3);
          model.resliceGeom.getPolys().setData(cellArray, 1);
          const normals = vtkDataArray.newInstance({
            numberOfComponents: 3,
            values: normalsData,
            name: 'Normals',
          });
          model.resliceGeom.getPointData().setNormals(normals);
          model.resliceGeom.modified();
        }
      } else {
        vtkErrorMacro(
          'Something went wrong.',
          'A default slice plane should have been created in the beginning of',
          'updateResliceGeometry.'
        );
      }
      model.resliceGeomUpdateString = resGeomString;
    }
  };

  publicAPI.setOpenGLTexture = (oglTex) => {
    if (oglTex) {
      model.openGLTexture = oglTex;
      model._externalOpenGLTexture = true;
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  VBOBuildTime: {},
  VBOBuildString: null,
  haveSeenDepthRequest: false,
  lastHaveSeenDepthRequest: false,
  lastIndependentComponents: false,
  lastTextureComponents: 0,
  lastSlabThickness: 0,
  lastSlabTrapezoidIntegration: 0,
  lastSlabType: -1,
  openGLTexture: null,
  openGLTextureString: null,
  colorTextureString: null,
  pwfTextureString: null,
  resliceGeom: null,
  resliceGeomUpdateString: null,
  tris: null,
  colorTexture: null,
  pwfTexture: null,
  _externalOpenGLTexture: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);
  vtkReplacementShaderMapper.implementReplaceShaderCoincidentOffset(
    publicAPI,
    model,
    initialValues
  );
  vtkReplacementShaderMapper.implementBuildShadersWithReplacements(
    publicAPI,
    model,
    initialValues
  );

  model.tris = vtkHelper.newInstance();
  model.openGLTexture = vtkOpenGLTexture.newInstance();
  model.colorTexture = vtkOpenGLTexture.newInstance();
  model.pwfTexture = vtkOpenGLTexture.newInstance();
  model.VBOBuildTime = {};
  macro.obj(model.VBOBuildTime);

  // model.modelToView = mat4.identity(new Float64Array(16));
  model.tmpMat4 = mat4.identity(new Float64Array(16));

  macro.get(publicAPI, model, ['openGLTexture']);

  // Object methods
  vtkOpenGLImageResliceMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkOpenGLImageResliceMapper'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };

// Register ourself to OpenGL backend if imported
registerOverride('vtkImageResliceMapper', newInstance);
