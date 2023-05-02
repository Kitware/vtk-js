import macro from 'vtk.js/Sources/macros';
import { mat4, vec3 } from 'gl-matrix';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';
import vtkHelper from 'vtk.js/Sources/Rendering/OpenGL/Helper';
import vtkReplacementShaderMapper from 'vtk.js/Sources/Rendering/OpenGL/ReplacementShaderMapper';
import vtkShaderProgram from 'vtk.js/Sources/Rendering/OpenGL/ShaderProgram';
import vtkOpenGLTexture from 'vtk.js/Sources/Rendering/OpenGL/Texture';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import { Representation } from 'vtk.js/Sources/Rendering/Core/Property/Constants';
import { Filter } from 'vtk.js/Sources/Rendering/OpenGL/Texture/Constants';
import { InterpolationType } from 'vtk.js/Sources/Rendering/Core/ImageProperty/Constants';

import vtkPolyDataVS from 'vtk.js/Sources/Rendering/OpenGL/glsl/vtkPolyDataVS.glsl';
import vtkPolyDataFS from 'vtk.js/Sources/Rendering/OpenGL/glsl/vtkPolyDataFS.glsl';

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

// ----------------------------------------------------------------------------
// vtkOpenGLImageCPRMapper methods
// ----------------------------------------------------------------------------

function vtkOpenGLImageCPRMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLImageCPRMapper');

  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      model.currentRenderPass = null;
      model.openGLImageSlice = publicAPI.getFirstAncestorOfType(
        'vtkOpenGLImageSlice'
      );
      model._openGLRenderer =
        publicAPI.getFirstAncestorOfType('vtkOpenGLRenderer');
      model._openGLRenderWindow = model._openGLRenderer.getParent();
      model.context = model._openGLRenderWindow.getContext();
      model.openGLCamera = model._openGLRenderer.getViewNodeFor(
        model._openGLRenderer.getRenderable().getActiveCamera()
      );

      model.tris.setOpenGLRenderWindow(model._openGLRenderWindow);
      model.volumeTexture.setOpenGLRenderWindow(model._openGLRenderWindow);
      model.colorTexture.setOpenGLRenderWindow(model._openGLRenderWindow);
      model.pwfTexture.setOpenGLRenderWindow(model._openGLRenderWindow);
    }
  };

  publicAPI.opaquePass = (prepass, renderPass) => {
    if (prepass) {
      model.currentRenderPass = renderPass;
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

  publicAPI.getCoincidentParameters = (ren, actor) => {
    if (model.renderable.getResolveCoincidentTopology()) {
      return model.renderable.getCoincidentTopologyPolygonOffsetParameters();
    }
    return null;
  };

  publicAPI.render = () => {
    const prop = model.openGLImageSlice.getRenderable();
    const ren = model._openGLRenderer.getRenderable();

    publicAPI.renderPiece(ren, prop);
  };

  publicAPI.renderPiece = (ren, prop) => {
    publicAPI.invokeEvent({ type: 'StartEvent' });
    model.renderable.update();
    publicAPI.invokeEvent({ type: 'EndEvent' });

    // Check if the ImageCPRMapper has everything it needs to render
    if (!model.renderable.preRenderCheck()) {
      return;
    }

    model.currentImageDataInput = model.renderable.getInputData(0);
    model.currentCenterlineInput = model.renderable.getOrientedCenterline();

    publicAPI.renderPieceStart(ren, prop);
    publicAPI.renderPieceDraw(ren, prop);
    publicAPI.renderPieceFinish(ren, prop);
  };

  publicAPI.renderPieceStart = (ren, actor) => {
    // make sure the BOs are up to date
    publicAPI.updateBufferObjects(ren, actor);
  };

  publicAPI.renderPieceDraw = (ren, actor) => {
    const gl = model.context;

    // activate the texture
    model.volumeTexture.activate();
    model.colorTexture.activate();
    model.pwfTexture.activate();

    // draw polygons
    if (model.tris.getCABO().getElementCount()) {
      // First we do the triangles, update the shader, set uniforms, etc.
      publicAPI.updateShaders(model.tris, ren, actor);
      gl.drawArrays(gl.TRIANGLES, 0, model.tris.getCABO().getElementCount());
      model.tris.getVAO().release();
    }

    model.volumeTexture.deactivate();
    model.colorTexture.deactivate();
    model.pwfTexture.deactivate();
  };

  publicAPI.renderPieceFinish = (ren, actor) => {};

  publicAPI.updateBufferObjects = (ren, actor) => {
    // Rebuild buffers if needed
    if (publicAPI.getNeedToRebuildBufferObjects(ren, actor)) {
      publicAPI.buildBufferObjects(ren, actor);
    }
  };

  publicAPI.getNeedToRebuildBufferObjects = (ren, actor) => {
    // first do a coarse check
    // Note that the actor's mtime includes it's properties mtime
    const vmtime = model.VBOBuildTime.getMTime();
    if (
      vmtime < publicAPI.getMTime() ||
      vmtime < model.renderable.getMTime() ||
      vmtime < actor.getMTime() ||
      vmtime < model.currentImageDataInput.getMTime() ||
      vmtime < model.currentCenterlineInput.getMTime()
    ) {
      return true;
    }
    return false;
  };

  publicAPI.buildBufferObjects = (ren, actor) => {
    const image = model.currentImageDataInput;
    const centerline = model.currentCenterlineInput;
    const actorProperty = actor.getProperty();

    // Set interpolation on the texture based on property setting
    if (actorProperty.getInterpolationType() === InterpolationType.NEAREST) {
      model.volumeTexture.setMinificationFilter(Filter.NEAREST);
      model.volumeTexture.setMagnificationFilter(Filter.NEAREST);
      model.colorTexture.setMinificationFilter(Filter.NEAREST);
      model.colorTexture.setMagnificationFilter(Filter.NEAREST);
      model.pwfTexture.setMinificationFilter(Filter.NEAREST);
      model.pwfTexture.setMagnificationFilter(Filter.NEAREST);
    } else {
      model.volumeTexture.setMinificationFilter(Filter.LINEAR);
      model.volumeTexture.setMagnificationFilter(Filter.LINEAR);
      model.colorTexture.setMinificationFilter(Filter.LINEAR);
      model.colorTexture.setMagnificationFilter(Filter.LINEAR);
      model.pwfTexture.setMinificationFilter(Filter.LINEAR);
      model.pwfTexture.setMagnificationFilter(Filter.LINEAR);
    }

    // Rebuild the volumeTexture if the data has changed
    const imageTime = image.getMTime();
    if (model.volumeTextureTime !== imageTime) {
      // Build the textures
      const dims = image.getDimensions();
      const scalars = image.getPointData().getScalars();
      if (!scalars) {
        return;
      }
      // Use norm16 for scalar texture if the extension is available
      model.volumeTexture.setOglNorm16Ext(
        model.context.getExtension('EXT_texture_norm16')
      );
      model.volumeTexture.releaseGraphicsResources(model._openGLRenderWindow);
      model.volumeTexture.resetFormatAndType();
      model.volumeTexture.create3DFilterableFromRaw(
        dims[0],
        dims[1],
        dims[2],
        scalars.getNumberOfComponents(),
        scalars.getDataType(),
        scalars.getData(),
        model.renderable.getPreferSizeOverAccuracy()
      );
      model.volumeTextureTime = imageTime;
    }

    // Rebuild the color texture if needed
    const scalars = image.getPointData() && image.getPointData().getScalars();
    if (!scalars) {
      return;
    }
    const numComp = scalars.getNumberOfComponents();
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

    // Rebuild the image vertices if needed
    if (
      model.VBOBuildTime.getMTime() < model.renderable.getMTime() ||
      model.VBOBuildTime.getMTime() < centerline.getMTime()
    ) {
      const nPoints = centerline.getNumberOfPoints();
      const nLines = nPoints <= 1 ? 0 : nPoints - 1;
      const distances = centerline.getDistancesToFirstPoint();
      const totalHeight = model.renderable.getHeight();
      const nPts = 4 * nLines;

      // Create the array of point: 4 points per segment
      const ptsArray = new Float32Array(3 * nPts);
      const widthMC = model.renderable.getWidth();

      for (let lineIdx = 0, offset = 0; lineIdx < nLines; ++lineIdx) {
        // Use model coordinates
        // See "setCameraShaderParameters" to see how MCPCMatrix is built

        // Top left
        ptsArray.set([0, totalHeight - distances[lineIdx], 0], offset);
        offset += 3;
        // Top right
        ptsArray.set([widthMC, totalHeight - distances[lineIdx], 0], offset);
        offset += 3;
        // Bottom right
        ptsArray.set(
          [widthMC, totalHeight - distances[lineIdx + 1], 0],
          offset
        );
        offset += 3;
        // Bottom left
        ptsArray.set([0, totalHeight - distances[lineIdx + 1], 0], offset);
        offset += 3;
      }

      const points = vtkDataArray.newInstance({
        numberOfComponents: 3,
        values: ptsArray,
      });
      points.setName('points');

      // Create the array of cells: a quad per segment
      const cellArray = new Uint16Array(5 * nLines);
      for (
        let lineIdx = 0, offset = 0, ptIdx = 0;
        lineIdx < nLines;
        ++lineIdx
      ) {
        cellArray.set([4, ptIdx + 3, ptIdx + 2, ptIdx + 1, ptIdx], offset);
        offset += 5;
        ptIdx += 4;
      }
      const cells = vtkDataArray.newInstance({
        numberOfComponents: 1,
        values: cellArray,
      });

      // Create the array of centerline positions (VBO custom attribute)
      const pointsDataArray = centerline.getPoints();
      const centerlinePositionArray = new Float32Array(3 * nPts);
      const pa = new Array(3);
      const pb = new Array(3);
      for (let lineIdx = 0, offset = 0; lineIdx < nLines; ++lineIdx) {
        pointsDataArray.getPoint(lineIdx, pa);
        pointsDataArray.getPoint(lineIdx + 1, pb);

        // Top left
        centerlinePositionArray.set(pa, offset);
        offset += 3;
        // Top right
        centerlinePositionArray.set(pa, offset);
        offset += 3;
        // Bottom right
        centerlinePositionArray.set(pb, offset);
        offset += 3;
        // Bottom left
        centerlinePositionArray.set(pb, offset);
        offset += 3;
      }
      const centerlinePosition = vtkDataArray.newInstance({
        numberOfComponents: 3,
        values: centerlinePositionArray,
        name: 'centerlinePosition',
      });

      // Create the array of quad index:
      //   0 ____ 1
      //    |    |
      //    |____|
      //   2      3
      const quadIndexArray = new Float32Array(nPts);
      for (let lineIdx = 0, offset = 0; lineIdx < nLines; ++lineIdx) {
        quadIndexArray.set(
          [
            0, // Top left
            1, // Top right
            3, // Bottom right
            2, // Bottom left
          ],
          offset
        );
        offset += 4;
      }
      const quadIndex = vtkDataArray.newInstance({
        numberOfComponents: 1,
        values: quadIndexArray,
        name: 'quadIndex',
      });

      const customAttributes = [centerlinePosition, quadIndex];

      if (!model.renderable.getUseUniformOrientation()) {
        // For each {quad / centerline segment}, two vectors in directionDataArray give the orientation of the centerline
        // Send these two vectors to each vertex and use flat interpolation to get them as is in the fragment shader
        // The interpolation will occur in the fragment shader (slerp)
        const directions = model.renderable.getCenterlineTangentDirections();
        const centerlineTopDirectionArray = new Float32Array(3 * nPts);
        const centerlineBotDirectionArray = new Float32Array(3 * nPts);
        for (let lineIdx = 0, offset = 0; lineIdx < nLines; ++lineIdx) {
          const baseDirectionIdx = 3 * lineIdx;

          // Every vertex of each quad/segment have the same topDir and botDir
          // Top left, Top right, Bottom right, Bottom left
          for (let i = 0; i < 4; ++i) {
            // Top array
            centerlineTopDirectionArray[offset + 0] =
              directions[baseDirectionIdx + 0];
            centerlineTopDirectionArray[offset + 1] =
              directions[baseDirectionIdx + 1];
            centerlineTopDirectionArray[offset + 2] =
              directions[baseDirectionIdx + 2];
            // Bot array
            centerlineBotDirectionArray[offset + 0] =
              directions[baseDirectionIdx + 3];
            centerlineBotDirectionArray[offset + 1] =
              directions[baseDirectionIdx + 4];
            centerlineBotDirectionArray[offset + 2] =
              directions[baseDirectionIdx + 5];
            offset += 3;
          }
        }
        const centerlineTopDirection = vtkDataArray.newInstance({
          numberOfComponents: 3,
          values: centerlineTopDirectionArray,
          name: 'centerlineTopDirection',
        });
        const centerlineBotDirection = vtkDataArray.newInstance({
          numberOfComponents: 3,
          values: centerlineBotDirectionArray,
          name: 'centerlineBotDirection',
        });
        customAttributes.push(centerlineTopDirection, centerlineBotDirection);
      }

      model.tris.getCABO().createVBO(cells, 'polys', Representation.SURFACE, {
        points,
        customAttributes,
      });
      model.VBOBuildTime.modified();
    }
  };

  publicAPI.getNeedToRebuildShaders = (cellBO, ren, actor) => {
    // has something changed that would require us to recreate the shader?
    // candidates are
    // property modified (representation interpolation and lighting)
    // input modified
    // light complexity changed
    // render pass shader replacement changed

    const tNumComp = model.volumeTexture.getComponents();
    const iComp = actor.getProperty().getIndependentComponents();

    if (
      model.lastHaveSeenDepthRequest !== model.haveSeenDepthRequest ||
      cellBO.getProgram() === 0 ||
      model.lastTextureComponents !== tNumComp ||
      model.lastIndependentComponents !== iComp
    ) {
      model.lastHaveSeenDepthRequest = model.haveSeenDepthRequest;
      model.lastTextureComponents = tNumComp;
      model.lastIndependentComponents = iComp;
      return true;
    }

    return false;
  };

  publicAPI.buildShaders = (shaders, ren, actor) => {
    publicAPI.getShaderTemplate(shaders, ren, actor);
    publicAPI.replaceShaderValues(shaders, ren, actor);
  };

  publicAPI.replaceShaderValues = (shaders, ren, actor) => {
    let VSSource = shaders.Vertex;
    let FSSource = shaders.Fragment;

    // Vertex shader main replacements
    VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Camera::Dec', [
      'uniform mat4 MCPCMatrix;',
    ]).result;
    VSSource = vtkShaderProgram.substitute(
      VSSource,
      '//VTK::PositionVC::Impl',
      ['  gl_Position = MCPCMatrix * vertexMC;']
    ).result;

    const vsColorDec = [
      'attribute vec3 centerlinePosition;',
      'attribute float quadIndex;',
      'uniform float width;',
      'out vec2 quadOffsetVSOutput;',
      'out vec3 centerlinePosVSOutput;',
    ];
    const isDirectionUniform = model.renderable.getUseUniformOrientation();
    if (isDirectionUniform) {
      vsColorDec.push(
        'out vec3 centerlineDirVSOutput;',
        'uniform vec3 centerlineDirection;'
      );
    } else {
      vsColorDec.push(
        'out vec3 centerlineTopDirVSOutput;',
        'out vec3 centerlineBotDirVSOutput;',
        'out float centerlineAngleVSOutput;',
        'attribute vec3 centerlineTopDirection;',
        'attribute vec3 centerlineBotDirection;'
      );
    }
    VSSource = vtkShaderProgram.substitute(
      VSSource,
      '//VTK::Color::Dec',
      vsColorDec
    ).result;

    const vsColorImpl = [
      // quadOffsetVSOutput.x: left = -0.5* width; right = 0.5 * width
      // quadOffsetVSOutput.y: bottom = 0.0; top = 1.0;
      'quadOffsetVSOutput = vec2(width * (mod(quadIndex, 2.0) == 0.0 ? -0.5 : 0.5), quadIndex > 1.0 ? 0.0 : 1.0);',
      'centerlinePosVSOutput = centerlinePosition;',
    ];
    if (isDirectionUniform) {
      vsColorImpl.push('centerlineDirVSOutput = centerlineDirection;');
    } else {
      vsColorImpl.push(
        // When u and v are unit vectors: uvAngle = 2 * atan2(|| u - v ||, || u + v ||)
        // When u != -v: || u + v || > 0
        // When x > 0: atan2(y, x) = atan(y/x)
        // Thus: dirAngle = 2 * atan(|| topDir - botDir || / || topDir + botDir ||)
        // This is more stable and should not be to slow compared to acos(dot(u, v))
        'vec3 sumVec = centerlineTopDirection + centerlineBotDirection;',
        'float sumLen2 = dot(sumVec, sumVec);',
        'float diffLen2 = 4.0 - sumLen2;',
        'if (diffLen2 < 0.001) {',
        '  // vectors are too close to each other, use lerp',
        '  centerlineAngleVSOutput = -1.0; // use negative angle as a flag for lerp',
        '  centerlineTopDirVSOutput = centerlineTopDirection;',
        '  centerlineBotDirVSOutput = centerlineBotDirection;',
        '} else if (sumLen2 == 0.0) {',
        "  // vector are opposite to each other, don't make a choice for the user",
        '  // use slerp without direction, it will display the centerline color on each row of pixel',
        '  centerlineAngleVSOutput = 0.0;',
        '  centerlineTopDirVSOutput = vec3(0.0);',
        '  centerlineBotDirVSOutput = vec3(0.0);',
        '} else {',
        '  // use slerp',
        '  centerlineAngleVSOutput = 2.0 * atan(sqrt(diffLen2/sumLen2));',
        '  float sinAngle = sin(centerlineAngleVSOutput);',
        '  centerlineTopDirVSOutput = centerlineTopDirection / sinAngle;',
        '  centerlineBotDirVSOutput = centerlineBotDirection / sinAngle;',
        '}'
      );
    }
    VSSource = vtkShaderProgram.substitute(
      VSSource,
      '//VTK::Color::Impl',
      vsColorImpl
    ).result;

    // Fragment shader main replacements
    const tNumComp = model.volumeTexture.getComponents();
    const iComps = actor.getProperty().getIndependentComponents();

    let tcoordFSDec = [
      // used to compute texture coordinates of the sample
      'uniform mat4 MCTCMatrix; // Model coordinates to texture coordinates',
      'in vec2 quadOffsetVSOutput;',
      'in vec3 centerlinePosVSOutput;',
      // volume texture
      'uniform highp sampler3D volumeTexture;',
      // color and pwf textures
      'uniform sampler2D colorTexture1;',
      'uniform sampler2D pwfTexture1;',
      // opacity
      'uniform float opacity;',
      // background color (out of volume samples)
      'uniform vec4 backgroundColor;',

      // color shift and scale
      `uniform float cshift0;`,
      `uniform float cscale0;`,
      // weighting shift and scale
      `uniform float pwfshift0;`,
      `uniform float pwfscale0;`,
    ];
    if (isDirectionUniform) {
      tcoordFSDec.push('in vec3 centerlineDirVSOutput;');
    } else {
      tcoordFSDec.push(
        'in vec3 centerlineTopDirVSOutput;',
        'in vec3 centerlineBotDirVSOutput;',
        'in float centerlineAngleVSOutput;'
      );
    }
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
    FSSource = vtkShaderProgram.substitute(
      FSSource,
      '//VTK::TCoord::Dec',
      tcoordFSDec
    ).result;

    let tcoordFSImpl = [];
    if (isDirectionUniform) {
      tcoordFSImpl.push(
        'vec3 interpolatedCenterlineDir = centerlineDirVSOutput;'
      );
    } else {
      // Slerp or lerp between centerlineTopDirVSOutput and centerlineBotDirVSOutput
      // We use quadOffsetVSOutput.y: bottom = 0.0; top = 1.0;
      tcoordFSImpl.push(
        'vec3 interpolatedCenterlineDir;',
        'if (centerlineAngleVSOutput < 0.0) {',
        '  // Lerp',
        '  interpolatedCenterlineDir = quadOffsetVSOutput.y * centerlineTopDirVSOutput + (1.0 - quadOffsetVSOutput.y) * centerlineBotDirVSOutput;',
        '} else {',
        '  // Slerp',
        '  float topInterpolationAngle = quadOffsetVSOutput.y * centerlineAngleVSOutput;',
        '  float botInterpolationAngle = centerlineAngleVSOutput - topInterpolationAngle;',
        '  interpolatedCenterlineDir = sin(topInterpolationAngle) * centerlineTopDirVSOutput + sin(botInterpolationAngle) * centerlineBotDirVSOutput;',
        '}',
        '// Slerp should give a normalized vector but when sin(angle) is small, rounding error occurs',
        '// Normalize for both lerp and slerp',
        'interpolatedCenterlineDir = normalize(interpolatedCenterlineDir);'
      );
    }
    tcoordFSImpl.push(
      'vec3 volumePosMC = centerlinePosVSOutput + quadOffsetVSOutput.x * interpolatedCenterlineDir;',
      'vec3 volumePosTC = (MCTCMatrix * vec4(volumePosMC, 1.0)).xyz;',
      'if (any(lessThan(volumePosTC, vec3(0.0))) || any(greaterThan(volumePosTC, vec3(1.0))))',
      '{',
      '  // set the background color and exit',
      '  gl_FragData[0] = backgroundColor;',
      '  return;',
      '}',
      'vec4 tvalue = texture(volumeTexture, volumePosTC);'
    );
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

    // Picking shader replacements
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

    publicAPI.replaceShaderClip(shaders, ren, actor);
    publicAPI.replaceShaderCoincidentOffset(shaders, ren, actor);
  };

  publicAPI.replaceShaderClip = (shaders, ren, actor) => {
    let VSSource = shaders.Vertex;
    let FSSource = shaders.Fragment;

    if (model.renderable.getNumberOfClippingPlanes()) {
      let numClipPlanes = model.renderable.getNumberOfClippingPlanes();
      if (numClipPlanes > 6) {
        macro.vtkErrorMacro('OpenGL has a limit of 6 clipping planes');
        numClipPlanes = 6;
      }
      VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Clip::Dec', [
        'uniform int numClipPlanes;',
        'uniform vec4 clipPlanes[6];',
        'varying float clipDistancesVSOutput[6];',
      ]).result;

      VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Clip::Impl', [
        'for (int planeNum = 0; planeNum < 6; planeNum++)',
        '    {',
        '    if (planeNum >= numClipPlanes)',
        '        {',
        '        break;',
        '        }',
        '    clipDistancesVSOutput[planeNum] = dot(clipPlanes[planeNum], vertexMC);',
        '    }',
      ]).result;
      FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Clip::Dec', [
        'uniform int numClipPlanes;',
        'varying float clipDistancesVSOutput[6];',
      ]).result;

      FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::Clip::Impl', [
        'for (int planeNum = 0; planeNum < 6; planeNum++)',
        '    {',
        '    if (planeNum >= numClipPlanes)',
        '        {',
        '        break;',
        '        }',
        '    if (clipDistancesVSOutput[planeNum] < 0.0) discard;',
        '    }',
      ]).result;
    }
    shaders.Vertex = VSSource;
    shaders.Fragment = FSSource;
  };

  publicAPI.getShaderTemplate = (shaders, ren, actor) => {
    shaders.Vertex = vtkPolyDataVS;
    shaders.Fragment = vtkPolyDataFS;
    shaders.Geometry = '';
  };

  publicAPI.setMapperShaderParameters = (cellBO, ren, actor) => {
    if (
      cellBO.getCABO().getElementCount() &&
      (model.VBOBuildTime.getMTime() >
        cellBO.getAttributeUpdateTime().getMTime() ||
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
      // Custom data of the CABO (centerlinePosition, centerlineTopDirection,
      // centerlineBotDirection, quadIndex and user defined custom data)
      cellBO
        .getCABO()
        .getCustomData()
        .forEach((data) => {
          if (
            data &&
            cellBO.getProgram().isAttributeUsed(data.name) &&
            !cellBO
              .getVAO()
              .addAttributeArray(
                cellBO.getProgram(),
                cellBO.getCABO(),
                data.name,
                data.offset,
                cellBO.getCABO().getStride(),
                model.context.FLOAT,
                data.components,
                model.context.FALSE
              )
          ) {
            vtkErrorMacro(`Error setting ${data.name} in shader VAO.`);
          }
        });
      cellBO.getAttributeUpdateTime().modified();
    }

    const texUnit = model.volumeTexture.getTextureUnit();
    cellBO.getProgram().setUniformi('volumeTexture', texUnit);
    cellBO.getProgram().setUniformf('width', model.renderable.getWidth());
    cellBO
      .getProgram()
      .setUniform4f(
        'backgroundColor',
        ...model.renderable.getBackgroundColor()
      );

    if (cellBO.getProgram().isUniformUsed('centerlineDirection')) {
      const uniformDirection = model.renderable.getUniformDirection();
      cellBO
        .getProgram()
        .setUniform3fArray('centerlineDirection', uniformDirection);
    }

    // Model coordinates to image space
    // getWorldToIndex is badly named and is in fact modelToIndex
    // MCIC -> Model coordinates to index coordinates
    // MCTC -> Model coordinates to texture coordinates
    const image = model.currentImageDataInput;
    const MCICMatrix = image.getWorldToIndex();
    const ICTCMatrix = mat4.fromScaling(
      new Float32Array(16),
      vec3.inverse([], image.getDimensions())
    );
    const MCTCMatrix = mat4.mul(ICTCMatrix, ICTCMatrix, MCICMatrix);
    cellBO.getProgram().setUniformMatrix('MCTCMatrix', MCTCMatrix);

    if (model.haveSeenDepthRequest) {
      cellBO
        .getProgram()
        .setUniformi('depthRequest', model.renderDepth ? 1 : 0);
    }

    if (model.renderable.getNumberOfClippingPlanes()) {
      // add all the clipping planes
      let numClipPlanes = model.renderable.getNumberOfClippingPlanes();
      if (numClipPlanes > 6) {
        macro.vtkErrorMacro('OpenGL has a limit of 6 clipping planes');
        numClipPlanes = 6;
      }

      const shiftScaleEnabled = cellBO.getCABO().getCoordShiftAndScaleEnabled();
      const inverseShiftScaleMatrix = shiftScaleEnabled
        ? cellBO.getCABO().getInverseShiftAndScaleMatrix()
        : null;
      const mat = inverseShiftScaleMatrix
        ? mat4.copy(model.imagematinv, actor.getMatrix())
        : actor.getMatrix();
      if (inverseShiftScaleMatrix) {
        mat4.transpose(mat, mat);
        mat4.multiply(mat, mat, inverseShiftScaleMatrix);
        mat4.transpose(mat, mat);
      }

      // transform crop plane normal with transpose(inverse(worldToIndex))
      mat4.transpose(
        model.imagemat,
        model.currentImageDataInput.getIndexToWorld()
      );
      mat4.multiply(model.imagematinv, mat, model.imagemat);

      const planeEquations = [];
      for (let i = 0; i < numClipPlanes; i++) {
        const planeEquation = [];
        model.renderable.getClippingPlaneInDataCoords(
          model.imagematinv,
          i,
          planeEquation
        );

        for (let j = 0; j < 4; j++) {
          planeEquations.push(planeEquation[j]);
        }
      }
      cellBO.getProgram().setUniformi('numClipPlanes', numClipPlanes);
      cellBO.getProgram().setUniform4fv('clipPlanes', planeEquations);
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
    const MCWCMatrix = model.openGLImageSlice.getKeyMatrices().mcwc;
    const WCPCMatrix = model.openGLCamera.getKeyMatrices(ren).wcpc;
    mat4.multiply(model.imagemat, WCPCMatrix, MCWCMatrix);

    if (cellBO.getCABO().getCoordShiftAndScaleEnabled()) {
      const inverseShiftScaleMat = cellBO
        .getCABO()
        .getInverseShiftAndScaleMatrix();
      mat4.multiply(model.imagemat, model.imagemat, inverseShiftScaleMat);
    }

    cellBO.getProgram().setUniformMatrix('MCPCMatrix', model.imagemat);
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
    const numComp = model.volumeTexture.getComponents();
    const iComps = ppty.getIndependentComponents();
    if (iComps) {
      for (let i = 0; i < numComp; ++i) {
        program.setUniformf(`mix${i}`, ppty.getComponentWeight(i));
      }
    }

    // Color opacity map
    const volInfo = model.volumeTexture.getVolumeInfo();

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
    const texColorUnit = model.colorTexture.getTextureUnit(); // TODO
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
    const texOpacityUnit = model.pwfTexture.getTextureUnit(); // TODO
    program.setUniformi('pwfTexture1', texOpacityUnit);
  };

  publicAPI.updateShaders = (cellBO, ren, actor) => {
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
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  currentRenderPass: null,
  volumeTexture: null,
  volumeTextureTime: 0,
  colorTexture: null,
  colorTextureString: null,
  pwfTexture: null,
  pwfTextureString: null,
  tris: null,
  lastHaveSeenDepthRequest: false,
  haveSeenDepthRequest: false,
  lastTextureComponents: 0,
  lastIndependentComponents: 0,
  imagemat: null,
  imagematinv: null,
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

  // Two inputs: one for the ImageData/Texture and one for the PolyData (centerline)
  macro.algo(publicAPI, model, 2, 0);

  model.tris = vtkHelper.newInstance();
  model.volumeTexture = vtkOpenGLTexture.newInstance();
  model.colorTexture = vtkOpenGLTexture.newInstance();
  model.pwfTexture = vtkOpenGLTexture.newInstance();

  model.imagemat = mat4.identity(new Float64Array(16));
  model.imagematinv = mat4.identity(new Float64Array(16));

  model.VBOBuildTime = {};
  macro.obj(model.VBOBuildTime, { mtime: 0 });

  // Object methods
  vtkOpenGLImageCPRMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOpenGLImageCPRMapper');
export const STATIC = {};

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...STATIC };

// Register ourself to OpenGL backend if imported
registerOverride('vtkImageCPRMapper', newInstance);
