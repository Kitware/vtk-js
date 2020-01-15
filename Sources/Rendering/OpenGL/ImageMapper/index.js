import { mat4 } from 'gl-matrix';
import Constants from 'vtk.js/Sources/Rendering/Core/ImageMapper/Constants';
import macro from 'vtk.js/Sources/macro';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import vtkHelper from 'vtk.js/Sources/Rendering/OpenGL/Helper';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
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
      'uniform mat4 MCPCMatrix;',
    ]).result;
    VSSource = vtkShaderProgram.substitute(
      VSSource,
      '//VTK::PositionVC::Impl',
      ['  gl_Position = MCPCMatrix * vertexMC;']
    ).result;

    VSSource = vtkShaderProgram.substitute(
      VSSource,
      '//VTK::TCoord::Impl',
      'tcoordVCVSOutput = tcoordMC;'
    ).result;

    VSSource = vtkShaderProgram.substitute(
      VSSource,
      '//VTK::TCoord::Dec',
      'attribute vec2 tcoordMC; varying vec2 tcoordVCVSOutput;'
    ).result;

    const tNumComp = model.openGLTexture.getComponents();
    const iComps = actor.getProperty().getIndependentComponents();

    let tcoordDec = [
      'varying vec2 tcoordVCVSOutput;',
      // color shift and scale
      'uniform float cshift0;',
      'uniform float cscale0;',
      // opacity shift and scale
      'uniform float oshift0;',
      'uniform float oscale0;',
      'uniform sampler2D texture1;',
      'uniform sampler2D colorTexture1;',
      'uniform sampler2D opacityTexture1;',
      'uniform float opacity;',
    ];
    if (iComps) {
      for (let comp = 1; comp < tNumComp; comp++) {
        tcoordDec = tcoordDec.concat([
          // color shift and scale
          `uniform float cshift${comp};`,
          `uniform float cscale${comp};`,
          // opacity shift and scale
          `uniform float oshift${comp};`,
          `uniform float oscale${comp};`,
        ]);
      }
      // the heights defined below are the locations
      // for the up to four components of the tfuns
      // the tfuns have a height of 2XnumComps pixels so the
      // values are computed to hit the middle of the two rows
      // for that component
      switch (tNumComp) {
        case 1:
          tcoordDec = tcoordDec.concat([
            'uniform float mix0;',
            '#define height0 0.5',
          ]);
          break;
        case 2:
          tcoordDec = tcoordDec.concat([
            'uniform float mix0;',
            'uniform float mix1;',
            '#define height0 0.25',
            '#define height1 0.75',
          ]);
          break;
        case 3:
          tcoordDec = tcoordDec.concat([
            'uniform float mix0;',
            'uniform float mix1;',
            'uniform float mix2;',
            '#define height0 0.17',
            '#define height1 0.5',
            '#define height2 0.83',
          ]);
          break;
        case 4:
          tcoordDec = tcoordDec.concat([
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
    FSSource = vtkShaderProgram.substitute(
      FSSource,
      '//VTK::TCoord::Dec',
      tcoordDec
    ).result;

    if (iComps) {
      const rgba = ['r', 'g', 'b', 'a'];
      let tcoordImpl = ['vec4 tvalue = texture2D(texture1, tcoordVCVSOutput);'];
      for (let comp = 0; comp < tNumComp; comp++) {
        tcoordImpl = tcoordImpl.concat([
          `vec3 tcolor${comp} = mix${comp} * texture2D(colorTexture1, vec2(tvalue.${
            rgba[comp]
          } * cscale${comp} + cshift${comp}, height${comp})).rgb;`,
          `float scalarOpacity${comp} = mix${comp} * texture2D(opacityTexture1, vec2(tvalue.${
            rgba[comp]
          } * oscale${comp} + oshift${comp}, height${comp})).r;`,
        ]);
      }
      switch (tNumComp) {
        case 1:
          tcoordImpl = tcoordImpl.concat([
            'gl_FragData[0] = vec4(tcolor0, scalarOpacity0 * opacity);',
          ]);
          break;
        case 2:
          tcoordImpl = tcoordImpl.concat([
            'gl_FragData[0] = vec4(tcolor0 + tcolor1, (scalarOpacity0 + scalarOpacity1) * opacity);',
          ]);
          break;
        case 3:
          tcoordImpl = tcoordImpl.concat([
            'gl_FragData[0] = vec4(tcolor0 + tcolor1 + tcolor2, (scalarOpacity0 + scalarOpacity1 + scalarOpacity2) * opacity);',
          ]);
          break;
        case 4:
          tcoordImpl = tcoordImpl.concat([
            'gl_FragData[0] = vec4(tcolor0 + tcolor1 + tcolor2 + tcolor3, (scalarOpacity0 + scalarOpacity1 + scalarOpacity2 + scalarOpacity3) * opacity);',
          ]);
          break;
        default:
          vtkErrorMacro('Unsupported number of independent coordinates.');
      }
      FSSource = vtkShaderProgram.substitute(
        FSSource,
        '//VTK::TCoord::Impl',
        tcoordImpl
      ).result;
    } else {
      // dependent components
      switch (tNumComp) {
        case 1:
          FSSource = vtkShaderProgram.substitute(
            FSSource,
            '//VTK::TCoord::Impl',
            [
              'float intensity = texture2D(texture1, tcoordVCVSOutput).r;',
              'vec3 tcolor = texture2D(colorTexture1, vec2(intensity * cscale0 + cshift0, 0.5)).rgb;',
              'float scalarOpacity = texture2D(opacityTexture1, vec2(intensity * oscale0 + oshift0, 0.5)).r;',
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
              'float intensity = tcolor.r*cscale0 + cshift0;',
              'gl_FragData[0] = vec4(texture2D(colorTexture1, vec2(intensity, 0.5)).rgb, oscale0*tcolor.g + oshift0);',
            ]
          ).result;
          break;
        default:
          FSSource = vtkShaderProgram.substitute(
            FSSource,
            '//VTK::TCoord::Impl',
            [
              'vec4 tcolor = cscale0*texture2D(texture1, tcoordVCVSOutput.st) + cshift0;',
              'gl_FragData[0] = vec4(texture2D(colorTexture1, vec2(tcolor.r,0.5)).r,',
              '  texture2D(colorTexture1, vec2(tcolor.g,0.5)).r,',
              '  texture2D(colorTexture1, vec2(tcolor.b,0.5)).r, tcolor.a);',
            ]
          ).result;
      }
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

    const numComp = model.openGLTexture.getComponents();
    const iComps = actor.getProperty().getIndependentComponents();
    if (iComps) {
      let totalComp = 0.0;
      for (let i = 0; i < numComp; i++) {
        totalComp += actor.getProperty().getComponentWeight(i);
      }
      for (let i = 0; i < numComp; i++) {
        cellBO
          .getProgram()
          .setUniformf(
            `mix${i}`,
            actor.getProperty().getComponentWeight(i) / totalComp
          );
      }
    }

    const oglShiftScale = model.openGLTexture.getShiftAndScale();

    // three levels of shift scale combined into one
    // for performance in the fragment shader
    for (let i = 0; i < numComp; i++) {
      let cw = actor.getProperty().getColorWindow();
      let cl = actor.getProperty().getColorLevel();
      const target = iComps ? i : 0;
      const cfun = actor.getProperty().getRGBTransferFunction(target);
      if (cfun) {
        const cRange = cfun.getRange();
        cw = cRange[1] - cRange[0];
        cl = 0.5 * (cRange[1] + cRange[0]);
      }

      const scale = oglShiftScale.scale / cw;
      const shift = (oglShiftScale.shift - cl) / cw + 0.5;
      cellBO.getProgram().setUniformf(`cshift${i}`, shift);
      cellBO.getProgram().setUniformf(`cscale${i}`, scale);
    }

    // opacity shift/scale
    for (let i = 0; i < numComp; i++) {
      let oscale = 1.0;
      let oshift = 0.0;
      const target = iComps ? i : 0;
      const ofun = actor.getProperty().getScalarOpacity(target);
      if (ofun) {
        const oRange = ofun.getRange();
        const length = oRange[1] - oRange[0];
        const mid = 0.5 * (oRange[0] + oRange[1]);
        oscale = oglShiftScale.scale / length;
        oshift = (oglShiftScale.shift - mid) / length + 0.5;
      }
      cellBO.getProgram().setUniformf(`oshift${i}`, oshift);
      cellBO.getProgram().setUniformf(`oscale${i}`, oscale);
    }

    if (model.haveSeenDepthRequest) {
      cellBO
        .getProgram()
        .setUniformi('depthRequest', model.renderDepth ? 1 : 0);
    }

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
    mat4.multiply(model.imagemat, keyMats.wcpc, model.imagemat);

    if (cellBO.getCABO().getCoordShiftAndScaleEnabled()) {
      const inverseShiftScaleMat = cellBO
        .getCABO()
        .getInverseShiftAndScaleMatrix();
      mat4.multiply(model.imagemat, model.imagemat, inverseShiftScaleMat);
    }

    program.setUniformMatrix('MCPCMatrix', model.imagemat);
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

    const numComp = image
      .getPointData()
      .getScalars()
      .getNumberOfComponents();
    const iComps = actor.getProperty().getIndependentComponents();
    const numIComps = iComps ? numComp : 1;
    const textureHeight = iComps ? 2 * numIComps : 1;

    const cWidth = 1024;
    let cfun = actor.getProperty().getRGBTransferFunction();
    const cSize = cWidth * textureHeight * 3;
    const cTable = new Uint8Array(cSize);
    if (cfun) {
      const cfunToString = `${cfun.getMTime()}`;
      if (model.colorTextureString !== cfunToString) {
        const tmpTable = new Float32Array(cWidth * 3);

        for (let c = 0; c < numIComps; c++) {
          cfun = actor.getProperty().getRGBTransferFunction(c);
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
        model.colorTextureString = cfunToString;
        if (!iComps && numComp === 1) {
          console.log('Issues?');
        }
        console.log(cWidth * 3);
        console.log(textureHeight);
        console.log(cTable.length);
        model.colorTexture.create2DFromRaw(
          cWidth,
          textureHeight,
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
    let ofun = actor.getProperty().getScalarOpacity();
    const oSize = oWidth * textureHeight;
    const oTable = new Uint8Array(oSize);
    if (ofun) {
      const ofunToString = `${ofun.getMTime()}`;
      if (model.opacityTextureString !== ofunToString) {
        const ofTable = new Float32Array(oSize);
        const tmpTable = new Float32Array(oWidth);

        for (let c = 0; c < numIComps; ++c) {
          ofun = actor.getProperty().getScalarOpacity(c);
          const oRange = ofun.getRange();
          ofun.getTable(oRange[0], oRange[1], oWidth, tmpTable, 1);
          // adjust for sample distance etc
          if (iComps) {
            for (let i = 0; i < oWidth; i++) {
              ofTable[c * oWidth * 2 + i] = 255.0 * tmpTable[i];
              ofTable[c * oWidth * 2 + i + oWidth] = 255.0 * tmpTable[i];
            }
          } else {
            for (let i = 0; i < oWidth; i++) {
              ofTable[c * oWidth * 2 + i] = 255.0 * tmpTable[i];
            }
          }
        }

        model.opacityTextureString = ofunToString;
        model.opacityTexture.create2DFromRaw(
          oWidth,
          textureHeight,
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
      if (iType === InterpolationType.NEAREST) {
        if (numComp === 4) {
          model.openGLTexture.setGenerateMipmap(true);
          model.openGLTexture.setMinificationFilter(Filter.NEAREST);
        } else {
          model.openGLTexture.setMinificationFilter(Filter.NEAREST);
        }
        model.openGLTexture.setMagnificationFilter(Filter.NEAREST);
      } else {
        if (numComp === 4) {
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
        console.log('Slicing Mode I');
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
        console.log('Slicing Mode J');
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
        console.log('Slicing Mode K');
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

      console.log(dims);
      console.log(numComp);
      console.log(scalars.length);
      console.log(dims[0] * dims[1] * numComp);
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
