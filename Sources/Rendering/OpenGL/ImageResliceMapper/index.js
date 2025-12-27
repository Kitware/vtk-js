import * as macro from 'vtk.js/Sources/macros';

import { mat4, mat3, vec3 } from 'gl-matrix';

import vtkClosedPolyLineToSurfaceFilter from 'vtk.js/Sources/Filters/General/ClosedPolyLineToSurfaceFilter';
import vtkCutter from 'vtk.js/Sources/Filters/Core/Cutter';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkHelper from 'vtk.js/Sources/Rendering/OpenGL/Helper';
import vtkImageDataOutlineFilter from 'vtk.js/Sources/Filters/General/ImageDataOutlineFilter';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkOpenGLTexture from 'vtk.js/Sources/Rendering/OpenGL/Texture';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkReplacementShaderMapper from 'vtk.js/Sources/Rendering/OpenGL/ReplacementShaderMapper';
import vtkShaderProgram from 'vtk.js/Sources/Rendering/OpenGL/ShaderProgram';
import vtkTransform from 'vtk.js/Sources/Common/Transform/Transform';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

import {
  getTransferFunctionsHash,
  getImageDataHash,
} from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow/resourceSharingHelper';

import vtkImageResliceMapperVS from 'vtk.js/Sources/Rendering/OpenGL/glsl/vtkImageResliceMapperVS.glsl';
import vtkImageResliceMapperFS from 'vtk.js/Sources/Rendering/OpenGL/glsl/vtkImageResliceMapperFS.glsl';

import { Filter } from 'vtk.js/Sources/Rendering/OpenGL/Texture/Constants';
import { InterpolationType } from 'vtk.js/Sources/Rendering/Core/ImageProperty/Constants';
import { Representation } from 'vtk.js/Sources/Rendering/Core/Property/Constants';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import { registerOverride } from 'vtk.js/Sources/Rendering/OpenGL/ViewNodeFactory';
import { Resolve } from 'vtk.js/Sources/Rendering/Core/Mapper/CoincidentTopologyHelper';

const { vtkErrorMacro } = macro;

const splitStringOnEnter = (str) =>
  str
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

function findLabelOutlineProperty(actor, currentValidInputs) {
  for (let i = 0; i < currentValidInputs.length; i++) {
    const ppty = actor.getProperty(currentValidInputs[i].inputIndex);
    if (ppty?.getUseLabelOutline()) {
      return ppty;
    }
  }
  return null;
}

// ----------------------------------------------------------------------------
// helper methods
// ----------------------------------------------------------------------------

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

  // Associate a reference counter to each graphics resource
  const graphicsResourceReferenceCount = new Map();

  function decreaseGraphicsResourceCount(openGLRenderWindow, coreObject) {
    if (!coreObject) {
      return;
    }
    const oldCount = graphicsResourceReferenceCount.get(coreObject) ?? 0;
    const newCount = oldCount - 1;
    if (newCount <= 0) {
      openGLRenderWindow.unregisterGraphicsResourceUser(coreObject, publicAPI);
      graphicsResourceReferenceCount.delete(coreObject);
    } else {
      graphicsResourceReferenceCount.set(coreObject, newCount);
    }
  }

  function increaseGraphicsResourceCount(openGLRenderWindow, coreObject) {
    if (!coreObject) {
      return;
    }
    const oldCount = graphicsResourceReferenceCount.get(coreObject) ?? 0;
    const newCount = oldCount + 1;
    graphicsResourceReferenceCount.set(coreObject, newCount);
    if (oldCount <= 0) {
      openGLRenderWindow.registerGraphicsResourceUser(coreObject, publicAPI);
    }
  }

  function replaceGraphicsResource(
    openGLRenderWindow,
    oldResourceCoreObject,
    newResourceCoreObject
  ) {
    if (oldResourceCoreObject === newResourceCoreObject) {
      return;
    }
    decreaseGraphicsResourceCount(openGLRenderWindow, oldResourceCoreObject);
    increaseGraphicsResourceCount(openGLRenderWindow, newResourceCoreObject);
  }

  function unregisterGraphicsResources(renderWindow) {
    // Convert to an array using the spread operator as Firefox doesn't support Iterator.forEach()
    [...graphicsResourceReferenceCount.keys()].forEach((coreObject) =>
      renderWindow.unregisterGraphicsResourceUser(coreObject, publicAPI)
    );
  }

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
        ren.getActiveCamera(),
        model.openGLCamera
      );
      const oldOglRenderWindow = model._openGLRenderWindow;
      model._openGLRenderWindow = model._openGLRenderer.getLastAncestorOfType(
        'vtkOpenGLRenderWindow'
      );
      if (
        oldOglRenderWindow &&
        !oldOglRenderWindow.isDeleted() &&
        oldOglRenderWindow !== model._openGLRenderWindow
      ) {
        // Unregister the mapper when the render window changes
        unregisterGraphicsResources(oldOglRenderWindow);
      }
      model.context = model._openGLRenderWindow.getContext();
      model.tris.setOpenGLRenderWindow(model._openGLRenderWindow);
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
    if (
      // backwards compat with code that (errorneously) set this to boolean
      // eslint-disable-next-line eqeqeq
      model.renderable.getResolveCoincidentTopology() == Resolve.PolygonOffset
    ) {
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
    const numberOfInputs = model.renderable.getNumberOfInputPorts();
    model.currentValidInputs = [];
    for (let inputIndex = 0; inputIndex < numberOfInputs; ++inputIndex) {
      const imageData = model.renderable.getInputData(inputIndex);
      if (imageData && !imageData.isDeleted()) {
        model.currentValidInputs.push({ imageData, inputIndex });
      }
    }

    const numberOfValidInputs = model.currentValidInputs.length;
    if (numberOfValidInputs <= 0) {
      vtkErrorMacro('No input!');
      return;
    }

    // Cache label outline property for this render pass
    model.labelOutlineProperty = findLabelOutlineProperty(
      actor,
      model.currentValidInputs
    );

    // Number of components
    const firstImageData = model.currentValidInputs[0].imageData;
    const firstScalars = firstImageData.getPointData().getScalars();
    model.multiTexturePerVolumeEnabled = numberOfValidInputs > 1;
    model.numberOfComponents = model.multiTexturePerVolumeEnabled
      ? numberOfValidInputs
      : firstScalars.getNumberOfComponents();

    publicAPI.updateResliceGeometry();

    publicAPI.renderPieceStart(ren, actor);
    publicAPI.renderPieceDraw(ren, actor);
    publicAPI.renderPieceFinish(ren, actor);
    publicAPI.invokeEvent({ type: 'EndEvent' });
  };

  publicAPI.renderPieceStart = (ren, actor) => {
    // make sure the BOs are up to date
    publicAPI.updateBufferObjects(ren, actor);

    // Update filters for scalar textures
    const actorProperties = actor.getProperties();
    model.currentValidInputs.forEach(({ inputIndex }, component) => {
      const actorProperty = actorProperties[inputIndex];
      const scalarTexture = model.scalarTextures[component];
      if (!actorProperty || !scalarTexture) return;
      const interpolationType = actorProperty.getInterpolationType();
      if (interpolationType === InterpolationType.NEAREST) {
        scalarTexture.setMinificationFilter(Filter.NEAREST);
        scalarTexture.setMagnificationFilter(Filter.NEAREST);
      } else {
        scalarTexture.setMinificationFilter(Filter.LINEAR);
        scalarTexture.setMagnificationFilter(Filter.LINEAR);
      }
    });

    // Update color and opacity texture filters
    const firstValidInput = model.currentValidInputs[0];
    const firstProperty = actorProperties[firstValidInput.inputIndex];
    const iType = firstProperty?.getInterpolationType();
    if (iType === InterpolationType.NEAREST) {
      model.colorTexture.setMinificationFilter(Filter.NEAREST);
      model.colorTexture.setMagnificationFilter(Filter.NEAREST);
      model.pwfTexture.setMinificationFilter(Filter.NEAREST);
      model.pwfTexture.setMagnificationFilter(Filter.NEAREST);
    } else {
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

    const useLabelOutline = model.labelOutlineProperty !== null;

    // render the texture
    const allTextures = [
      ...model.scalarTextures,
      model.colorTexture,
      model.pwfTexture,
    ];
    if (useLabelOutline) {
      allTextures.push(model.labelOutlineThicknessTexture);
      allTextures.push(model.labelOutlineOpacityTexture);
    }
    allTextures.forEach((texture) => texture.activate());

    // update shaders if required
    publicAPI.updateShaders(model.tris, ren, actor);

    // Finally draw
    gl.drawArrays(gl.TRIANGLES, 0, model.tris.getCABO().getElementCount());
    model.tris.getVAO().release();

    allTextures.forEach((texture) => texture.deactivate());
  };

  publicAPI.renderPieceFinish = (ren, actor) => {};

  publicAPI.updateBufferObjects = (ren, actor) => {
    // Rebuild buffer objects if needed
    if (publicAPI.getNeedToRebuildBufferObjects(ren, actor)) {
      publicAPI.buildBufferObjects(ren, actor);
    }
  };

  publicAPI.getNeedToRebuildBufferObjects = (ren, actor) => {
    const firstActorProperty = actor.getProperty(
      model.currentValidInputs[0].inputIndex
    );
    const useLabelOutline = model.labelOutlineProperty !== null;
    return (
      model.VBOBuildTime.getMTime() < publicAPI.getMTime() ||
      model.VBOBuildTime.getMTime() < actor.getMTime() ||
      model.VBOBuildTime.getMTime() < model.renderable.getMTime() ||
      model.VBOBuildTime.getMTime() < firstActorProperty?.getMTime() ||
      model.currentValidInputs.some(
        ({ imageData }) => model.VBOBuildTime.getMTime() < imageData.getMTime()
      ) ||
      model.VBOBuildTime.getMTime() < model.resliceGeom.getMTime() ||
      model.scalarTextures.length !== model.currentValidInputs.length ||
      !model.scalarTextures.every((texture) => !!texture?.getHandle()) ||
      !model.colorTexture?.getHandle() ||
      !model.pwfTexture?.getHandle() ||
      (useLabelOutline &&
        (!model.labelOutlineThicknessTexture?.getHandle() ||
          !model.labelOutlineOpacityTexture?.getHandle()))
    );
  };

  publicAPI.buildBufferObjects = (ren, actor) => {
    const actorProperties = actor.getProperties();

    model.currentValidInputs.forEach(({ imageData, inputIndex }, component) => {
      // rebuild the scalarTexture if the data has changed
      const scalars = imageData.getPointData().getScalars();
      const tex =
        model._openGLRenderWindow.getGraphicsResourceForObject(scalars);
      const scalarsHash = getImageDataHash(imageData, scalars);
      const reBuildTex =
        !tex?.oglObject?.getHandle() || tex?.hash !== scalarsHash;

      const actorProperty = actorProperties[inputIndex];
      const updatedExtents = actorProperty?.getUpdatedExtents() ?? [];
      const hasUpdatedExtents = !!updatedExtents.length;

      if (reBuildTex && !hasUpdatedExtents) {
        const newScalarTexture = vtkOpenGLTexture.newInstance();
        newScalarTexture.setOpenGLRenderWindow(model._openGLRenderWindow);
        // Build the textures
        const dims = imageData.getDimensions();
        // Use norm16 for scalar texture if the extension is available
        newScalarTexture.setOglNorm16Ext(
          model.context.getExtension('EXT_texture_norm16')
        );
        newScalarTexture.resetFormatAndType();
        newScalarTexture.create3DFilterableFromDataArray({
          width: dims[0],
          height: dims[1],
          depth: dims[2],
          dataArray: scalars,
        });
        model._openGLRenderWindow.setGraphicsResourceForObject(
          scalars,
          newScalarTexture,
          scalarsHash
        );
        model.scalarTextures[component] = newScalarTexture;
      } else {
        model.scalarTextures[component] = tex.oglObject;
      }

      if (hasUpdatedExtents) {
        // If hasUpdatedExtents, then the texture is partially updated.
        // clear the array to acknowledge the update.
        actorProperty.setUpdatedExtents([]);

        const dims = imageData.getDimensions();
        model.scalarTextures[component].create3DFilterableFromDataArray({
          width: dims[0],
          height: dims[1],
          depth: dims[2],
          dataArray: scalars,
          updatedExtents,
        });
      }

      replaceGraphicsResource(
        model._openGLRenderWindow,
        model._scalarTexturesCore[component],
        scalars
      );
      model._scalarTexturesCore[component] = scalars;
    });

    const firstValidInput = model.currentValidInputs[0];
    const firstActorProperty = actorProperties[firstValidInput.inputIndex];
    if (!firstActorProperty) {
      vtkErrorMacro('Missing property for first input');
      return;
    }
    const iComps = firstActorProperty.getIndependentComponents();
    const numIComps = iComps ? model.numberOfComponents : 1;
    const textureHeight = iComps ? 2 * numIComps : 1;

    // Collect color transfer functions - in multi-texture mode, get from each input's property
    const colorTransferFunctions = [];
    for (let component = 0; component < numIComps; ++component) {
      if (model.multiTexturePerVolumeEnabled) {
        const validInput = model.currentValidInputs[component];
        const prop = validInput ? actorProperties[validInput.inputIndex] : null;
        colorTransferFunctions.push(prop?.getRGBTransferFunction() || null);
      } else {
        colorTransferFunctions.push(
          firstActorProperty.getRGBTransferFunction(component)
        );
      }
    }
    const colorFuncHash = getTransferFunctionsHash(
      colorTransferFunctions,
      iComps,
      numIComps
    );
    const firstColorTransferFunc = firstActorProperty.getRGBTransferFunction();
    const cTex = model._openGLRenderWindow.getGraphicsResourceForObject(
      firstColorTransferFunc
    );
    const reBuildC =
      !cTex?.oglObject?.getHandle() || cTex?.hash !== colorFuncHash;
    if (reBuildC) {
      let cWidth = model.renderable.getColorTextureWidth();
      if (cWidth <= 0) {
        cWidth = model.context.getParameter(model.context.MAX_TEXTURE_SIZE);
      }
      const cSize = cWidth * textureHeight * 3;
      const cTable = new Uint8ClampedArray(cSize);
      const newColorTexture = vtkOpenGLTexture.newInstance();
      newColorTexture.setOpenGLRenderWindow(model._openGLRenderWindow);
      if (firstColorTransferFunc) {
        const tmpTable = new Float32Array(cWidth * 3);

        for (let c = 0; c < numIComps; c++) {
          // Use pre-collected color transfer functions (handles both single and multi-texture modes)
          const cfun = colorTransferFunctions[c];
          if (cfun) {
            const cRange = cfun.getRange();
            cfun.getTable(cRange[0], cRange[1], cWidth, tmpTable, 1);
            if (iComps) {
              for (let i = 0; i < cWidth * 3; i++) {
                cTable[c * cWidth * 6 + i] = 255.0 * tmpTable[i];
                cTable[c * cWidth * 6 + i + cWidth * 3] = 255.0 * tmpTable[i];
              }
            } else {
              for (let i = 0; i < cWidth * 3; i++) {
                cTable[c * cWidth * 3 + i] = 255.0 * tmpTable[i];
              }
            }
          }
        }
        newColorTexture.resetFormatAndType();
        newColorTexture.create2DFromRaw({
          width: cWidth,
          height: textureHeight,
          numComps: 3,
          dataType: VtkDataTypes.UNSIGNED_CHAR,
          data: cTable,
        });
      } else {
        for (let column = 0; column < cWidth * 3; ++column) {
          const opacity = (255.0 * column) / ((cWidth - 1) * 3);
          for (let row = 0; row < textureHeight; ++row) {
            // R, G, B
            cTable[row * cWidth * 3 + column + 0] = opacity;
            cTable[row * cWidth * 3 + column + 1] = opacity;
            cTable[row * cWidth * 3 + column + 2] = opacity;
          }
        }
        newColorTexture.resetFormatAndType();
        newColorTexture.create2DFromRaw({
          width: cWidth,
          height: 1,
          numComps: 3,
          dataType: VtkDataTypes.UNSIGNED_CHAR,
          data: cTable,
        });
      }

      if (firstColorTransferFunc) {
        model._openGLRenderWindow.setGraphicsResourceForObject(
          firstColorTransferFunc,
          newColorTexture,
          colorFuncHash
        );
      }
      model.colorTexture = newColorTexture;
    } else {
      model.colorTexture = cTex.oglObject;
    }
    replaceGraphicsResource(
      model._openGLRenderWindow,
      model._colorTextureCore,
      firstColorTransferFunc
    );
    model._colorTextureCore = firstColorTransferFunc;

    // Build piecewise function buffer.  This buffer is used either
    // for component weighting or opacity, depending on whether we're
    // rendering components independently or not.
    // In multi-texture mode, get from each input's property
    const opacityFunctions = [];
    for (let component = 0; component < numIComps; ++component) {
      if (model.multiTexturePerVolumeEnabled) {
        const validInput = model.currentValidInputs[component];
        const prop = validInput ? actorProperties[validInput.inputIndex] : null;
        opacityFunctions.push(prop?.getPiecewiseFunction() || null);
      } else {
        opacityFunctions.push(
          firstActorProperty.getPiecewiseFunction(component)
        );
      }
    }
    const opacityFuncHash = getTransferFunctionsHash(
      opacityFunctions,
      iComps,
      numIComps
    );
    const firstPwFunc = firstActorProperty.getPiecewiseFunction();
    const pwfTex =
      model._openGLRenderWindow.getGraphicsResourceForObject(firstPwFunc);
    const reBuildPwf =
      !pwfTex?.oglObject?.getHandle() || pwfTex?.hash !== opacityFuncHash;
    if (reBuildPwf) {
      let pwfWidth = model.renderable.getOpacityTextureWidth();
      if (pwfWidth <= 0) {
        pwfWidth = model.context.getParameter(model.context.MAX_TEXTURE_SIZE);
      }
      const pwfSize = pwfWidth * textureHeight;
      const pwfTable = new Uint8ClampedArray(pwfSize);
      const newOpacityTexture = vtkOpenGLTexture.newInstance();
      newOpacityTexture.setOpenGLRenderWindow(model._openGLRenderWindow);
      if (firstPwFunc) {
        const pwfFloatTable = new Float32Array(pwfSize);
        const tmpTable = new Float32Array(pwfWidth);

        for (let c = 0; c < numIComps; ++c) {
          // Use pre-collected opacity functions (handles both single and multi-texture modes)
          const pwfun = opacityFunctions[c];
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
                pwfFloatTable[i] = tmpTable[i];
              }
            }
          }
        }
        newOpacityTexture.resetFormatAndType();
        newOpacityTexture.create2DFromRaw({
          width: pwfWidth,
          height: textureHeight,
          numComps: 1,
          dataType: VtkDataTypes.FLOAT,
          data: pwfFloatTable,
        });
      } else {
        // default is opaque
        pwfTable.fill(255.0);
        newOpacityTexture.resetFormatAndType();
        newOpacityTexture.create2DFromRaw({
          width: pwfWidth,
          height: textureHeight,
          numComps: 1,
          dataType: VtkDataTypes.UNSIGNED_CHAR,
          data: pwfTable,
        });
      }
      if (firstPwFunc) {
        model._openGLRenderWindow.setGraphicsResourceForObject(
          firstPwFunc,
          newOpacityTexture,
          opacityFuncHash
        );
      }
      model.pwfTexture = newOpacityTexture;
    } else {
      model.pwfTexture = pwfTex.oglObject;
    }
    replaceGraphicsResource(
      model._openGLRenderWindow,
      model._pwfTextureCore,
      firstPwFunc
    );
    model._pwfTextureCore = firstPwFunc;

    // Build label outline textures if needed
    if (model.labelOutlineProperty) {
      publicAPI.updateLabelOutlineThicknessTexture(model.labelOutlineProperty);
      publicAPI.updateLabelOutlineOpacityTexture(model.labelOutlineProperty);
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
    const firstImageData = model.currentValidInputs[0].imageData;

    if (
      cellBO.getCABO().getElementCount() &&
      (model.VBOBuildTime.getMTime() >
        cellBO.getAttributeUpdateTime().getMTime() ||
        cellBO.getShaderSourceTime().getMTime() >
          cellBO.getAttributeUpdateTime().getMTime())
    ) {
      // Set the 3D texture
      model.scalarTextures.forEach((scalarTexture, component) => {
        program.setUniformi(
          `volumeTexture[${component}]`,
          scalarTexture.getTextureUnit()
        );
      });

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
        program.setUniform3fv('spacing', firstImageData.getSpacing());
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

      // Set per-input world->texture matrices
      for (let i = 0; i < model.currentValidInputs.length; i++) {
        const uniformName = `WCTCMatrix${i}`;
        if (program.isUniformUsed(uniformName)) {
          const imageData = model.currentValidInputs[i].imageData;
          const dim = imageData.getDimensions();
          mat4.copy(model.tmpMat4, imageData.getIndexToWorld());
          mat4.translate(model.tmpMat4, model.tmpMat4, [-0.5, -0.5, -0.5]);
          mat4.scale(model.tmpMat4, model.tmpMat4, dim);
          mat4.invert(model.tmpMat4, model.tmpMat4);
          if (inverseShiftScaleMatrix) {
            mat4.multiply(
              model.tmpMat4,
              model.tmpMat4,
              inverseShiftScaleMatrix
            );
          }
          program.setUniformMatrix(uniformName, model.tmpMat4);
        }
      }

      if (program.isUniformUsed('vboScaling')) {
        program.setUniform3fv(
          'vboScaling',
          cellBO.getCABO().getCoordScale() ?? [1, 1, 1]
        );
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

    const firstPpty = actor.getProperty(model.currentValidInputs[0].inputIndex);

    const opacity = firstPpty.getOpacity();
    program.setUniformf('opacity', opacity);

    // Component mix
    // Independent components: Mixed according to component weights
    // Dependent components: Mixed using the following logic:
    //    - 2 comps => LA
    //    - 3 comps => RGB + opacity from pwf
    //    - 4 comps => RGBA
    const numComp = model.numberOfComponents;
    const iComps = firstPpty.getIndependentComponents();
    if (iComps) {
      for (let i = 0; i < numComp; ++i) {
        program.setUniformf(`mix${i}`, firstPpty.getComponentWeight(i));
      }
    }

    // three levels of shift scale combined into one
    // for performance in the fragment shader
    const useMultiTexture = model.multiTexturePerVolumeEnabled;
    const actorProperties = actor.getProperties();
    for (let component = 0; component < numComp; component++) {
      const textureIndex = useMultiTexture ? component : 0;
      const volInfoIndex = useMultiTexture ? 0 : component;
      const scalarTexture = model.scalarTextures[textureIndex];
      const volInfo = scalarTexture.getVolumeInfo();
      const volScale = volInfo.scale[volInfoIndex];
      const volOffset = volInfo.offset[volInfoIndex];
      const target = iComps ? component : 0;

      const ppty = useMultiTexture
        ? actorProperties[model.currentValidInputs[component].inputIndex]
        : firstPpty;

      // color shift/scale
      let cw = ppty.getColorWindow();
      let cl = ppty.getColorLevel();
      const cfun = ppty.getRGBTransferFunction(useMultiTexture ? 0 : target);
      if (cfun && ppty.getUseLookupTableScalarRange()) {
        const cRange = cfun.getRange();
        cw = cRange[1] - cRange[0];
        cl = 0.5 * (cRange[1] + cRange[0]);
      }
      const colorScale = volScale / cw;
      const colorShift = (volOffset - cl) / cw + 0.5;
      program.setUniformf(`cshift${component}`, colorShift);
      program.setUniformf(`cscale${component}`, colorScale);

      // pwf shift/scale
      let pwfScale = 1.0;
      let pwfShift = 0.0;
      const pwfun = ppty.getPiecewiseFunction(useMultiTexture ? 0 : target);
      if (pwfun) {
        const pwfRange = pwfun.getRange();
        const length = pwfRange[1] - pwfRange[0];
        const mid = 0.5 * (pwfRange[0] + pwfRange[1]);
        pwfScale = volScale / length;
        pwfShift = (volOffset - mid) / length + 0.5;
      }
      program.setUniformf(`pwfshift${component}`, pwfShift);
      program.setUniformf(`pwfscale${component}`, pwfScale);
    }
    const texColorUnit = model.colorTexture.getTextureUnit();
    program.setUniformi('colorTexture1', texColorUnit);

    const texOpacityUnit = model.pwfTexture.getTextureUnit();
    program.setUniformi('pwfTexture1', texOpacityUnit);

    // Background color
    program.setUniform4fv(
      'backgroundColor',
      model.renderable.getBackgroundColor()
    );

    // Label outline uniforms
    if (model.labelOutlineProperty) {
      const outlineThicknessUnit =
        model.labelOutlineThicknessTexture.getTextureUnit();
      program.setUniformi('labelOutlineThicknessTexture', outlineThicknessUnit);

      const outlineOpacityUnit =
        model.labelOutlineOpacityTexture.getTextureUnit();
      program.setUniformi('labelOutlineOpacityTexture', outlineOpacityUnit);

      let textureWidth = model.renderable.getLabelOutlineTextureWidth();
      if (textureWidth <= 0) {
        textureWidth = model.context.getParameter(
          model.context.MAX_TEXTURE_SIZE
        );
      }
      program.setUniformf('labelOutlineTextureWidth', textureWidth);

      // Calculate tangent vectors for the slice plane in each input's texture space
      const slicePlane = model.renderable.getSlicePlane();

      // Create orthogonal tangent vectors on the slice plane (in world space)
      const tangent1 = [0, 0, 0];
      const tangent2 = [0, 0, 0];

      if (slicePlane) {
        const normal = slicePlane.getNormal();
        const absNormal = normal.map(Math.abs);
        const minIdx = absNormal.indexOf(Math.min(...absNormal));
        const up = [0, 0, 0];
        up[minIdx] = 1;
        vtkMath.cross(normal, up, tangent1);
        vtkMath.normalize(tangent1);
        vtkMath.cross(normal, tangent1, tangent2);
        vtkMath.normalize(tangent2);
      } else {
        // Default tangents for axis-aligned slicing
        tangent1[0] = 1;
        tangent2[1] = 1;
      }

      // Set per-input tangent vectors (transformed to each input's texture space)
      for (let i = 0; i < model.currentValidInputs.length; i++) {
        const imageData = model.currentValidInputs[i].imageData;
        const w2io = mat3.create();
        mat3.set(w2io, ...imageData.getDirection());
        mat3.invert(w2io, w2io);

        const t1TC = [0, 0, 0];
        const t2TC = [0, 0, 0];
        vec3.transformMat3(t1TC, tangent1, w2io);
        vec3.transformMat3(t2TC, tangent2, w2io);

        const t1Name = `outlineTangent1_${i}`;
        const t2Name = `outlineTangent2_${i}`;
        if (program.isUniformUsed(t1Name)) {
          program.setUniform3fv(t1Name, t1TC);
        }
        if (program.isUniformUsed(t2Name)) {
          program.setUniform3fv(t2Name, t2TC);
        }
      }

      // Set per-input texel sizes in texture coordinates
      for (let i = 0; i < model.currentValidInputs.length; i++) {
        const uniformName = `texelSize${i}`;
        if (program.isUniformUsed(uniformName)) {
          const imageData = model.currentValidInputs[i].imageData;
          const inputDims = imageData.getDimensions();
          program.setUniform3fv(uniformName, [
            1.0 / inputDims[0],
            1.0 / inputDims[1],
            1.0 / inputDims[2],
          ]);
        }
      }
    }
  };

  publicAPI.getNeedToRebuildShaders = (cellBO, ren, actor) => {
    // has something changed that would require us to recreate the shader?
    // candidates are
    // property modified (representation interpolation and lighting)
    // input modified
    // light complexity changed
    // render pass shader replacement changed
    const firstActorProperty = actor.getProperty(
      model.currentValidInputs[0].inputIndex
    );
    const iComp = firstActorProperty.getIndependentComponents();
    const useLabelOutline = model.labelOutlineProperty !== null;
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

    const numValidInputs = model.currentValidInputs?.length ?? 0;

    if (
      needRebuild ||
      model.lastHaveSeenDepthRequest !== model.haveSeenDepthRequest ||
      model.lastNumberOfComponents !== model.numberOfComponents ||
      model.lastMultiTexturePerVolumeEnabled !==
        model.multiTexturePerVolumeEnabled ||
      cellBO.getProgram()?.getHandle() === 0 ||
      model.lastIndependentComponents !== iComp ||
      model.lastUseLabelOutline !== useLabelOutline ||
      model.lastNumValidInputs !== numValidInputs ||
      model.lastSlabThickness !== slabTh ||
      model.lastSlabType !== slabType ||
      model.lastSlabTrapezoidIntegration !== slabTrap
    ) {
      model.lastHaveSeenDepthRequest = model.haveSeenDepthRequest;
      model.lastNumberOfComponents = model.numberOfComponents;
      model.lastMultiTexturePerVolumeEnabled =
        model.multiTexturePerVolumeEnabled;
      model.lastIndependentComponents = iComp;
      model.lastUseLabelOutline = useLabelOutline;
      model.lastNumValidInputs = numValidInputs;
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

  // Helper to generate shader code for compositing multiple inputs
  // Some inputs may be labelmaps (with outline), others may be background images
  // labelmapInputs: array of input indices that are labelmaps (e.g., [0, 2])
  // totalInputs: total number of inputs (1-4)
  function generateMultiInputCompositeShader(labelmapInputs, totalInputs) {
    const rgba = ['r', 'g', 'b', 'a'];
    const allInputs = Array.from({ length: totalInputs }, (_, i) => i);
    const backgroundInputs = allInputs.filter(
      (i) => !labelmapInputs.includes(i)
    );

    // Generate texture coordinate lines for labelmap inputs
    const texCoordLines = labelmapInputs
      .map(
        (i) =>
          `vec3 labelTexCoord${i} = (WCTCMatrix${i} * vec4(fragWorldPos, 1.0)).xyz;`
      )
      .join('\n                ');

    // Build texture sampling conditional for neighbor checking
    const textureSampling = (() => {
      if (labelmapInputs.length === 0) return '';

      const conditions = labelmapInputs.map((inputIdx, arrayIdx) => {
        if (arrayIdx === 0) {
          return `(labelInputIdx == ${arrayIdx}) ? texture(volumeTexture[${inputIdx}], neighborTexCoord).r`;
        }
        return ` : (labelInputIdx == ${arrayIdx}) ? texture(volumeTexture[${inputIdx}], neighborTexCoord).r`;
      });
      return `float neighborLabel = ${conditions.join('')} : 0.0;`;
    })();

    // Process each input in order, compositing onto convergentColor
    const processInputs = allInputs
      .map((inputIdx) => {
        const isLabelmap = labelmapInputs.includes(inputIdx);
        const labelArrayIdx = labelmapInputs.indexOf(inputIdx);

        if (isLabelmap) {
          return `
        // Process input ${inputIdx} as labelmap
        {
          float labelValue = tvalue.${rgba[inputIdx]};
          int segmentIndex = int(labelValue * 255.0);

          if (segmentIndex > 0) {
            float textureCoordinate = float(segmentIndex - 1) / labelOutlineTextureWidth;
            float thicknessValue = texture2D(labelOutlineThicknessTexture, vec2(textureCoordinate, 0.5)).r;
            float labelOutlineOpacityValue = texture2D(labelOutlineOpacityTexture, vec2(textureCoordinate, 0.5)).r;
            int actualThickness = int(thicknessValue * 255.0);

            vec3 currentLabelTC = labelTexCoord${inputIdx};
            vec3 currentTexelSize = texelSize${inputIdx};
            vec3 currentTangent1 = outlineTangent1_${inputIdx};
            vec3 currentTangent2 = outlineTangent2_${inputIdx};

            bool pixelOnBorder = false;
            int labelInputIdx = ${labelArrayIdx};
            for (int i = -actualThickness; i <= actualThickness; i++) {
              for (int j = -actualThickness; j <= actualThickness; j++) {
                if (i == 0 && j == 0) continue;
                vec3 neighborTexCoord = currentLabelTC + float(i) * currentTangent1 * currentTexelSize + float(j) * currentTangent2 * currentTexelSize;
                if (any(greaterThan(neighborTexCoord, vec3(1.0))) || any(lessThan(neighborTexCoord, vec3(0.0)))) {
                  pixelOnBorder = true;
                  break;
                }
                ${textureSampling}
                if (neighborLabel != labelValue) {
                  pixelOnBorder = true;
                  break;
                }
              }
              if (pixelOnBorder) break;
            }

            if (pixelOnBorder) {
              convergentColor.rgb = mix(convergentColor.rgb, tcolor${inputIdx}.rgb, labelOutlineOpacityValue);
              convergentColor.a = max(convergentColor.a, labelOutlineOpacityValue);
            } else if (compWeight${inputIdx} > 0.0) {
              float fillAlpha = compWeight${inputIdx} * opacity;
              convergentColor.rgb = mix(convergentColor.rgb, tcolor${inputIdx}.rgb, fillAlpha);
              convergentColor.a = max(convergentColor.a, fillAlpha);
            }
          }
        }`;
        }
        return `
        // Process input ${inputIdx} as background image
        {
          float bgAlpha = compWeight${inputIdx} * opacity;
          convergentColor.rgb = mix(convergentColor.rgb, tcolor${inputIdx}.rgb, bgAlpha);
          convergentColor.a = max(convergentColor.a, bgAlpha);
        }`;
      })
      .join('\n        ');

    const labelDesc =
      labelmapInputs.length > 0
        ? `labelmaps at input${
            labelmapInputs.length > 1 ? 's' : ''
          } ${labelmapInputs.join(', ')}`
        : 'no labelmaps';
    const bgDesc =
      backgroundInputs.length > 0
        ? `background at input${
            backgroundInputs.length > 1 ? 's' : ''
          } ${backgroundInputs.join(', ')}`
        : 'no background';

    return splitStringOnEnter(`
      // Multi-texture mode: ${labelDesc}, ${bgDesc}
      vec4 convergentColor = vec4(0.0, 0.0, 0.0, 0.0);

      // Compute labelmap texture coordinates
      ${texCoordLines}

      // Process each input in order
      ${processInputs}

      gl_FragData[0] = convergentColor;
    `);
  }

  publicAPI.replaceShaderTCoord = (shaders, ren, actor) => {
    let VSSource = shaders.Vertex;
    const GSSource = shaders.Geometry;
    let FSSource = shaders.Fragment;

    const useLabelOutline = model.labelOutlineProperty !== null;

    const slabThickness = model.renderable.getSlabThickness();
    VSSource = vtkShaderProgram.substitute(
      VSSource,
      '//VTK::TCoord::Dec',
      []
    ).result;
    VSSource = vtkShaderProgram.substitute(
      VSSource,
      '//VTK::TCoord::Impl',
      []
    ).result;

    const tNumComp = model.numberOfComponents;
    const firstActorPropertyForIComps = actor.getProperty(
      model.currentValidInputs[0].inputIndex
    );
    const iComps = firstActorPropertyForIComps.getIndependentComponents();

    const numInputs = model.scalarTextures.length;
    let tcoordFSDec = [
      `uniform highp sampler3D volumeTexture[${numInputs}];`,
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

    // Add per-input WCTCMatrix uniforms
    for (let i = 0; i < numInputs; i++) {
      tcoordFSDec.push(`uniform mat4 WCTCMatrix${i};`);
    }

    // Add label outline uniforms if enabled
    if (useLabelOutline) {
      tcoordFSDec = tcoordFSDec.concat([
        'uniform sampler2D labelOutlineThicknessTexture;',
        'uniform sampler2D labelOutlineOpacityTexture;',
        'uniform float labelOutlineTextureWidth;',
      ]);
      // Add per-input tangent vectors and texelSize
      for (let i = 0; i < numInputs; i++) {
        tcoordFSDec.push(`uniform vec3 outlineTangent1_${i};`);
        tcoordFSDec.push(`uniform vec3 outlineTangent2_${i};`);
        tcoordFSDec.push(`uniform vec3 texelSize${i};`);
      }
    }

    // Function to sample texture - takes world position, computes per-input texture coords
    tcoordFSDec.push('vec4 rawSampleTexture(vec3 worldPos) {');
    if (!model.multiTexturePerVolumeEnabled) {
      tcoordFSDec.push(
        'vec3 tc0 = (WCTCMatrix0 * vec4(worldPos, 1.0)).xyz;',
        'return texture(volumeTexture[0], tc0);',
        '}'
      );
    } else {
      tcoordFSDec.push('vec4 rawSample;');
      for (let component = 0; component < numInputs; ++component) {
        tcoordFSDec.push(
          `vec3 tc${component} = (WCTCMatrix${component} * vec4(worldPos, 1.0)).xyz;`,
          `rawSample[${component}] = texture(volumeTexture[${component}], tc${component})[0];`
        );
      }
      tcoordFSDec.push('return rawSample;', '}');
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
    if (slabThickness > 0.0) {
      tcoordFSDec = tcoordFSDec.concat([
        'uniform vec3 spacing;',
        'uniform float slabThickness;',
        'uniform int slabType;',
        'uniform int slabTrapezoid;',
        'uniform vec3 vboScaling;',
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
      'vec3 fragWorldPos = vertexWCVSOutput.xyz;',
      'vec3 fragTexCoord = (WCTCMatrix0 * vec4(fragWorldPos, 1.0)).xyz;',
      'if (any(greaterThan(fragTexCoord, vec3(1.0))) || any(lessThan(fragTexCoord, vec3(0.0))))',
      '{',
      '  // set the background color and exit',
      '  gl_FragData[0] = backgroundColor;',
      '  return;',
      '}',
      'vec4 tvalue = rawSampleTexture(fragWorldPos);',
    ];
    if (slabThickness > 0.0) {
      tcoordFSImpl = tcoordFSImpl.concat([
        '// Get the first and last samples',
        'int numSlices = 1;',
        'float scaling = min(min(spacing.x, spacing.y), spacing.z) * 0.5;',
        'vec3 normalxspacing = scaling * normalWCVSOutput;',
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
        '  vec3 worldPosNeg = vertexWCVSOutput.xyz - fnumSlices * normalxspacing * vboScaling;',
        '  vec3 fragTCoordNeg = (WCTCMatrix0 * vec4(worldPosNeg, 1.0)).xyz;',
        '  if (!any(greaterThan(fragTCoordNeg, vec3(1.0))) && !any(lessThan(fragTCoordNeg, vec3(0.0))))',
        '  {',
        '    vec4 newVal = rawSampleTexture(worldPosNeg);',
        '    tvalue = compositeValue(tvalue, newVal, trapezoid);',
        '    numSlices += 1;',
        '  }',
        '  vec3 worldPosPos = vertexWCVSOutput.xyz + fnumSlices * normalxspacing * vboScaling;',
        '  vec3 fragTCoordPos = (WCTCMatrix0 * vec4(worldPosPos, 1.0)).xyz;',
        '  if (!any(greaterThan(fragTCoordPos, vec3(1.0))) && !any(lessThan(fragTCoordPos, vec3(0.0))))',
        '  {',
        '    vec4 newVal = rawSampleTexture(worldPosPos);',
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
          `vec3 tcolor${comp} = texture2D(colorTexture1, vec2(tvalue.${rgba[comp]} * cscale${comp} + cshift${comp}, height${comp})).rgb;`,
          `float compWeight${comp} = mix${comp} * texture2D(pwfTexture1, vec2(tvalue.${rgba[comp]} * pwfscale${comp} + pwfshift${comp}, height${comp})).r;`,
        ]);
      }

      // Determine which inputs are labelmaps
      const labelmapInputs = [];
      if (useLabelOutline) {
        for (let i = 0; i < tNumComp; i++) {
          const inputProperty = actor.getProperty(
            model.currentValidInputs[i].inputIndex
          );
          if (inputProperty?.getUseLabelOutline()) {
            labelmapInputs.push(i);
          }
        }
      }

      // Generate weighted sum shader for non-labelmap cases
      const generateWeightedSumShader = (inputCount) => {
        if (inputCount === 1) {
          return ['gl_FragData[0] = vec4(tcolor0.rgb, compWeight0 * opacity);'];
        }
        const inputs = Array.from({ length: inputCount }, (_, i) => i);
        const weightSum = inputs.map((i) => `compWeight${i}`).join(' + ');
        const colorSum = inputs
          .map((i) => `(tcolor${i}.rgb * (compWeight${i} / weightSum))`)
          .join(' + ');
        return [
          `float weightSum = ${weightSum};`,
          `gl_FragData[0] = vec4(vec3(${colorSum}), opacity);`,
        ];
      };

      if (labelmapInputs.length > 0) {
        tcoordFSImpl = tcoordFSImpl.concat(
          generateMultiInputCompositeShader(labelmapInputs, tNumComp)
        );
      } else {
        tcoordFSImpl = tcoordFSImpl.concat(generateWeightedSumShader(tNumComp));
      }
    } else {
      // dependent components
      switch (tNumComp) {
        case 1:
          if (useLabelOutline) {
            tcoordFSImpl = tcoordFSImpl.concat([
              ...splitStringOnEnter(`
                // Label outline mode for single component
                float centerValue = tvalue.r;
                int segmentIndex = int(centerValue * 255.0);

                // Skip background (segment 0)
                if (segmentIndex == 0) {
                  gl_FragData[0] = vec4(0.0, 0.0, 0.0, 0.0);
                  return;
                }

                // Get outline parameters for this segment
                float textureCoordinate = float(segmentIndex - 1) / labelOutlineTextureWidth;
                float thicknessValue = texture2D(labelOutlineThicknessTexture, vec2(textureCoordinate, 0.5)).r;
                float outlineOpacity = texture2D(labelOutlineOpacityTexture, vec2(textureCoordinate, 0.5)).r;
                int actualThickness = int(thicknessValue * 255.0);

                // Get color for this segment
                vec3 tColor = texture2D(colorTexture1, vec2(centerValue * cscale0 + cshift0, 0.5)).rgb;
                float scalarOpacity = texture2D(pwfTexture1, vec2(centerValue * pwfscale0 + pwfshift0, 0.5)).r;
                float opacityToUse = scalarOpacity * opacity;

                // Check neighbors for border detection
                bool pixelOnBorder = false;
                for (int i = -actualThickness; i <= actualThickness; i++) {
                  for (int j = -actualThickness; j <= actualThickness; j++) {
                    if (i == 0 && j == 0) {
                      continue;
                    }
                    // Sample neighbor using tangent vectors in texture space
                    vec3 neighborTexCoord = fragTexCoord + float(i) * outlineTangent1_0 * texelSize0 + float(j) * outlineTangent2_0 * texelSize0;

                    // Skip if outside texture bounds
                    if (any(greaterThan(neighborTexCoord, vec3(1.0))) || any(lessThan(neighborTexCoord, vec3(0.0)))) {
                      pixelOnBorder = true;
                      break;
                    }

                    float neighborValue = texture(volumeTexture[0], neighborTexCoord).r;
                    if (neighborValue != centerValue) {
                      pixelOnBorder = true;
                      break;
                    }
                  }
                  if (pixelOnBorder) {
                    break;
                  }
                }

                if (pixelOnBorder) {
                  gl_FragData[0] = vec4(tColor, outlineOpacity);
                } else {
                  gl_FragData[0] = vec4(tColor, opacityToUse);
                }
              `),
            ]);
          } else {
            tcoordFSImpl = tcoordFSImpl.concat([
              '// Dependent components',
              'float intensity = tvalue.r;',
              'vec3 tcolor = texture2D(colorTexture1, vec2(intensity * cscale0 + cshift0, 0.5)).rgb;',
              'float scalarOpacity = texture2D(pwfTexture1, vec2(intensity * pwfscale0 + pwfshift0, 0.5)).r;',
              'gl_FragData[0] = vec4(tcolor, scalarOpacity * opacity);',
            ]);
          }
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
    let posVCVSDec = [
      'attribute vec4 vertexWC;',
      'varying vec4 vertexWCVSOutput;',
    ];
    // Add a unique hash to the shader to ensure that the shader program is unique to this mapper.
    posVCVSDec = posVCVSDec.concat([
      `//${publicAPI.getMTime()}${model.resliceGeomUpdateString}`,
    ]);
    if (slabThickness > 0.0) {
      posVCVSDec = posVCVSDec.concat([
        'attribute vec3 normalWC;',
        'varying vec3 normalWCVSOutput;',
      ]);
    }
    VSSource = vtkShaderProgram.substitute(
      VSSource,
      '//VTK::PositionVC::Dec',
      posVCVSDec
    ).result;
    let posVCVSImpl = [
      'gl_Position = MCPCMatrix * vertexWC;',
      'vertexWCVSOutput = vertexWC;',
    ];
    if (slabThickness > 0.0) {
      posVCVSImpl = posVCVSImpl.concat(['normalWCVSOutput = normalWC;']);
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
    let posVCFSDec = ['varying vec4 vertexWCVSOutput;'];
    if (slabThickness > 0.0) {
      posVCFSDec = posVCFSDec.concat(['varying vec3 normalWCVSOutput;']);
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

  /**
   * Returns true if the normal is almost axis aligned.
   * Has a side effect to normalize the vector.
   */
  function isVectorAxisAligned(n) {
    vtkMath.normalize(n);
    const tmpN = [0, 0, 0];
    for (let i = 0; i < 3; ++i) {
      vec3.zero(tmpN);
      tmpN[i] = 1.0;
      const dotP = vtkMath.dot(n, tmpN);
      if (dotP < -0.999999 || dotP > 0.999999) {
        return [true, i];
      }
    }
    return [false, 2];
  }

  publicAPI.updateResliceGeometry = () => {
    let resGeomString = '';
    const firstImageData = model.currentValidInputs[0].imageData;
    const imageBounds = firstImageData?.getBounds();
    // Orthogonal slicing by default
    let orthoSlicing = true;
    let orthoAxis = 2;
    const slicePD = model.renderable.getSlicePolyData();
    const slicePlane = model.renderable.getSlicePlane();
    if (slicePD) {
      resGeomString = resGeomString.concat(`PolyData${slicePD.getMTime()}`);
    } else if (slicePlane) {
      resGeomString = resGeomString.concat(`Plane${slicePlane.getMTime()}`);
      // Compute a world-to-image-orientation matrix.
      const w2io = mat3.create();
      if (firstImageData) {
        resGeomString = resGeomString.concat(
          `Image${firstImageData.getMTime()}`
        );
        // Ignore the translation component since we are
        // using it on vectors rather than positions.
        mat3.set(w2io, ...firstImageData.getDirection());
        mat3.invert(w2io, w2io);
      }
      // Check to see if we can bypass oblique slicing related bounds computation
      // transform the cutting plane normal to image local coords
      const imageLocalNormal = [...slicePlane.getNormal()];
      vec3.transformMat3(imageLocalNormal, imageLocalNormal, w2io);
      [orthoSlicing, orthoAxis] = isVectorAxisAligned(imageLocalNormal);
    } else {
      // Create a default slice plane here
      const plane = vtkPlane.newInstance();
      plane.setNormal(0, 0, 1);
      let bds = [0, 1, 0, 1, 0, 1];
      if (firstImageData) {
        bds = imageBounds;
      }
      plane.setOrigin(bds[0], bds[2], 0.5 * (bds[5] + bds[4]));
      model.renderable.setSlicePlane(plane);
      resGeomString = resGeomString.concat(`Plane${slicePlane?.getMTime()}`);
      if (firstImageData) {
        resGeomString = resGeomString.concat(
          `Image${firstImageData.getMTime()}`
        );
      }
    }

    if (!model.resliceGeom || model.resliceGeomUpdateString !== resGeomString) {
      if (slicePD) {
        if (!model.resliceGeom) {
          model.resliceGeom = vtkPolyData.newInstance();
        }
        model.resliceGeom.getPoints().setData(slicePD.getPoints().getData(), 3);
        model.resliceGeom.getPolys().setData(slicePD.getPolys().getData(), 1);
        model.resliceGeom
          .getPointData()
          .setNormals(slicePD.getPointData().getNormals());
      } else if (slicePlane) {
        if (!orthoSlicing) {
          model.outlineFilter.setInputData(firstImageData);
          model.cutter.setInputConnection(model.outlineFilter.getOutputPort());
          model.cutter.setCutFunction(slicePlane);
          model.lineToSurfaceFilter.setInputConnection(
            model.cutter.getOutputPort()
          );
          model.lineToSurfaceFilter.update();
          if (!model.resliceGeom) {
            model.resliceGeom = vtkPolyData.newInstance();
          }
          const planePD = model.lineToSurfaceFilter.getOutputData();
          model.resliceGeom
            .getPoints()
            .setData(planePD.getPoints().getData(), 3);
          model.resliceGeom.getPolys().setData(planePD.getPolys().getData(), 1);
          model.resliceGeom
            .getPointData()
            .setNormals(planePD.getPointData().getNormals());
          // The above method does not generate point normals
          // Set it manually here.
          const n = slicePlane.getNormal();
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
          // Since the image-local normal is axis-aligned, we
          // can quickly construct the cutting plane using indexToWorld transforms.
          const ptsArray = new Float32Array(12);
          const indexSpacePlaneOrigin = firstImageData.worldToIndex(
            slicePlane.getOrigin(),
            [0, 0, 0]
          );
          const otherAxes = [(orthoAxis + 1) % 3, (orthoAxis + 2) % 3].sort();
          const ext = firstImageData.getSpatialExtent();
          let ptIdx = 0;
          for (let i = 0; i < 2; ++i) {
            for (let j = 0; j < 2; ++j) {
              ptsArray[ptIdx + orthoAxis] = indexSpacePlaneOrigin[orthoAxis];
              ptsArray[ptIdx + otherAxes[0]] = ext[2 * otherAxes[0] + j];
              ptsArray[ptIdx + otherAxes[1]] = ext[2 * otherAxes[1] + i];
              ptIdx += 3;
            }
          }
          model.transform.setMatrix(firstImageData.getIndexToWorld());
          model.transform.transformPoints(ptsArray, ptsArray);

          const cellArray = new Uint16Array(8);
          cellArray[0] = 3;
          cellArray[1] = 0;
          cellArray[2] = 1;
          cellArray[3] = 3;
          cellArray[4] = 3;
          cellArray[5] = 0;
          cellArray[6] = 3;
          cellArray[7] = 2;

          const n = slicePlane.getNormal();
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
        }
      } else {
        vtkErrorMacro(
          'Something went wrong.',
          'A default slice plane should have been created in the beginning of',
          'updateResliceGeometry.'
        );
      }
      model.resliceGeomUpdateString = resGeomString;
      model.resliceGeom?.modified();
    }
  };

  function buildLabelOutlineTexture(dataArray, ArrayType, vtkDataType) {
    const lTex =
      model._openGLRenderWindow.getGraphicsResourceForObject(dataArray);
    const hash = `${dataArray.join('-')}`;
    if (lTex?.oglObject?.getHandle() && lTex?.hash === hash) {
      return lTex.oglObject;
    }

    let width = model.renderable.getLabelOutlineTextureWidth();
    if (width <= 0) {
      width = model.context.getParameter(model.context.MAX_TEXTURE_SIZE);
    }

    const table = new ArrayType(width);
    for (let i = 0; i < width; ++i) {
      table[i] = dataArray[i] ?? dataArray[0];
    }

    const newTexture = vtkOpenGLTexture.newInstance({ resizable: false });
    newTexture.setOpenGLRenderWindow(model._openGLRenderWindow);
    newTexture.resetFormatAndType();
    newTexture.setMinificationFilter(Filter.NEAREST);
    newTexture.setMagnificationFilter(Filter.NEAREST);
    newTexture.create2DFromRaw({
      width,
      height: 1,
      numComps: 1,
      dataType: vtkDataType,
      data: table,
    });

    model._openGLRenderWindow.setGraphicsResourceForObject(
      dataArray,
      newTexture,
      hash
    );
    return newTexture;
  }

  publicAPI.updateLabelOutlineThicknessTexture = (labelOutlinePpty) => {
    const dataArray = labelOutlinePpty.getLabelOutlineThicknessByReference();
    const newTexture = buildLabelOutlineTexture(
      dataArray,
      Uint8Array,
      VtkDataTypes.UNSIGNED_CHAR
    );
    if (newTexture !== model.labelOutlineThicknessTexture) {
      replaceGraphicsResource(
        model._openGLRenderWindow,
        model._labelOutlineThicknessCore,
        dataArray
      );
      model._labelOutlineThicknessCore = dataArray;
      model.labelOutlineThicknessTexture = newTexture;
    }
  };

  publicAPI.updateLabelOutlineOpacityTexture = (labelOutlinePpty) => {
    let dataArray = labelOutlinePpty.getLabelOutlineOpacity();
    if (typeof dataArray === 'number') {
      if (model._cachedLabelOutlineOpacityObj?.[0] !== dataArray) {
        model._cachedLabelOutlineOpacityObj = [dataArray];
      }
      dataArray = model._cachedLabelOutlineOpacityObj;
    }

    const newTexture = buildLabelOutlineTexture(
      dataArray,
      Float32Array,
      VtkDataTypes.FLOAT
    );
    if (newTexture !== model.labelOutlineOpacityTexture) {
      replaceGraphicsResource(
        model._openGLRenderWindow,
        model._labelOutlineOpacityCore,
        dataArray
      );
      model._labelOutlineOpacityCore = dataArray;
      model.labelOutlineOpacityTexture = newTexture;
    }
  };

  publicAPI.setScalarTextures = (scalarTextures) => {
    model.scalarTextures = [...scalarTextures];
    model._externalOpenGLTexture = true;
  };

  publicAPI.delete = macro.chain(() => {
    if (model._openGLRenderWindow) {
      unregisterGraphicsResources(model._openGLRenderWindow);
    }
  }, publicAPI.delete);
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
  lastUseLabelOutline: false,
  lastNumValidInputs: 0,
  lastNumberOfComponents: 0,
  lastMultiTexturePerVolumeEnabled: false,
  lastSlabThickness: 0,
  lastSlabTrapezoidIntegration: 0,
  lastSlabType: -1,
  scalarTextures: [],
  _scalarTexturesCore: [],
  colorTexture: null,
  _colorTextureCore: null,
  pwfTexture: null,
  _pwfTextureCore: null,
  labelOutlineProperty: null,
  labelOutlineThicknessTexture: null,
  _labelOutlineThicknessCore: null,
  labelOutlineOpacityTexture: null,
  _labelOutlineOpacityCore: null,
  _externalOpenGLTexture: false,
  resliceGeom: null,
  resliceGeomUpdateString: null,
  tris: null,
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
  model.scalarTextures = [];
  model.colorTexture = null;
  model.pwfTexture = null;
  model.VBOBuildTime = {};
  macro.obj(model.VBOBuildTime);

  model.tmpMat4 = mat4.identity(new Float64Array(16));

  // Implicit plane to polydata related cache:
  model.outlineFilter = vtkImageDataOutlineFilter.newInstance();
  model.outlineFilter.setGenerateFaces(true);
  model.outlineFilter.setGenerateLines(false);
  model.cubePolyData = vtkPolyData.newInstance();
  model.cutter = vtkCutter.newInstance();
  model.lineToSurfaceFilter = vtkClosedPolyLineToSurfaceFilter.newInstance();
  model.transform = vtkTransform.newInstance();

  macro.get(publicAPI, model, ['scalarTextures']);

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
