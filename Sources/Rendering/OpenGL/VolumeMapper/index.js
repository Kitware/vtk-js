import * as macro from 'vtk.js/Sources/macros';
import DeepEqual from 'fast-deep-equal';
import { vec3, mat3, mat4 } from 'gl-matrix';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import vtkHelper from 'vtk.js/Sources/Rendering/OpenGL/Helper';
import vtkOpenGLFramebuffer from 'vtk.js/Sources/Rendering/OpenGL/Framebuffer';
import vtkOpenGLTexture from 'vtk.js/Sources/Rendering/OpenGL/Texture';
import vtkReplacementShaderMapper from 'vtk.js/Sources/Rendering/OpenGL/ReplacementShaderMapper';
import vtkShaderProgram from 'vtk.js/Sources/Rendering/OpenGL/ShaderProgram';
import vtkVertexArrayObject from 'vtk.js/Sources/Rendering/OpenGL/VertexArrayObject';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';
import { Representation } from 'vtk.js/Sources/Rendering/Core/Property/Constants';
import {
  Wrap,
  Filter,
} from 'vtk.js/Sources/Rendering/OpenGL/Texture/Constants';
import {
  InterpolationType,
  OpacityMode,
  ColorMixPreset,
} from 'vtk.js/Sources/Rendering/Core/VolumeProperty/Constants';
import { BlendMode } from 'vtk.js/Sources/Rendering/Core/VolumeMapper/Constants';

import {
  getTransferFunctionHash,
  getImageDataHash,
} from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow/resourceSharingHelper';

import vtkVolumeVS from 'vtk.js/Sources/Rendering/OpenGL/glsl/vtkVolumeVS.glsl';
import vtkVolumeFS from 'vtk.js/Sources/Rendering/OpenGL/glsl/vtkVolumeFS.glsl';

import { registerOverride } from 'vtk.js/Sources/Rendering/OpenGL/ViewNodeFactory';

const { vtkWarningMacro, vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// helper methods
// ----------------------------------------------------------------------------

// Some matrices to avoid reallocations when we need them
const preAllocatedMatrices = {
  idxToView: mat4.identity(new Float64Array(16)),
  idxNormalMatrix: mat3.identity(new Float64Array(9)),
  modelToView: mat4.identity(new Float64Array(16)),
  projectionToView: mat4.identity(new Float64Array(16)),
  projectionToWorld: mat4.identity(new Float64Array(16)),
};

// ----------------------------------------------------------------------------
// vtkOpenGLVolumeMapper methods
// ----------------------------------------------------------------------------

function vtkOpenGLVolumeMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLVolumeMapper');

  function useIndependentComponents(actorProperty, numComp) {
    const iComps = actorProperty.getIndependentComponents();
    const colorMixPreset = actorProperty.getColorMixPreset();
    return (iComps && numComp >= 2) || !!colorMixPreset;
  }

  function isLabelmapOutlineRequired(actorProperty) {
    return (
      actorProperty.getUseLabelOutline() ||
      model.renderable.getBlendMode() ===
        BlendMode.LABELMAP_EDGE_PROJECTION_BLEND
    );
  }

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
    graphicsResourceReferenceCount
      .keys()
      .forEach((coreObject) =>
        renderWindow.unregisterGraphicsResourceUser(coreObject, publicAPI)
      );
  }

  publicAPI.buildPass = () => {
    model.zBufferTexture = null;
  };

  // ohh someone is doing a zbuffer pass, use that for
  // intermixed volume rendering
  publicAPI.zBufferPass = (prepass, renderPass) => {
    if (prepass) {
      const zbt = renderPass.getZBufferTexture();
      if (zbt !== model.zBufferTexture) {
        model.zBufferTexture = zbt;
      }
    }
  };

  publicAPI.opaqueZBufferPass = (prepass, renderPass) =>
    publicAPI.zBufferPass(prepass, renderPass);

  // Renders myself
  publicAPI.volumePass = (prepass, renderPass) => {
    if (prepass) {
      const oldOglRenderWindow = model._openGLRenderWindow;
      model._openGLRenderWindow = publicAPI.getLastAncestorOfType(
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
      model.jitterTexture.setOpenGLRenderWindow(model._openGLRenderWindow);
      model.framebuffer.setOpenGLRenderWindow(model._openGLRenderWindow);

      model.openGLVolume = publicAPI.getFirstAncestorOfType('vtkOpenGLVolume');
      const actor = model.openGLVolume.getRenderable();
      model._openGLRenderer =
        publicAPI.getFirstAncestorOfType('vtkOpenGLRenderer');
      const ren = model._openGLRenderer.getRenderable();
      model.openGLCamera = model._openGLRenderer.getViewNodeFor(
        ren.getActiveCamera()
      );
      publicAPI.renderPiece(ren, actor);
    }
  };

  publicAPI.getShaderTemplate = (shaders, ren, actor) => {
    shaders.Vertex = vtkVolumeVS;
    shaders.Fragment = vtkVolumeFS;
    shaders.Geometry = '';
  };

  publicAPI.replaceShaderValues = (shaders, ren, actor) => {
    let FSSource = shaders.Fragment;

    FSSource = vtkShaderProgram.substitute(
      FSSource,
      '//VTK::EnabledColorFunctions',
      model.previousState.usedColorForValueFunctionIds.map(
        (functionId) => `#define EnableColorForValueFunctionId${functionId}`
      )
    ).result;

    const enabledLightings = [];
    if (model.previousState.surfaceLightingEnabled) {
      enabledLightings.push('Surface');
    }
    if (model.previousState.volumeLightingEnabled) {
      enabledLightings.push('Volume');
    }
    FSSource = vtkShaderProgram.substitute(
      FSSource,
      '//VTK::EnabledLightings',
      enabledLightings.map(
        (lightingType) => `#define Enable${lightingType}Lighting`
      )
    ).result;

    if (model.previousState.forceNearestInterpolationEnabled) {
      FSSource = vtkShaderProgram.substitute(
        FSSource,
        '//VTK::EnableForceNearestInterpolation',
        '#define EnableForceNearestInterpolation'
      ).result;
    }

    // if we have a ztexture then declare it and use it
    if (model.zBufferTexture !== null) {
      FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::ZBuffer::Dec', [
        'uniform sampler2D zBufferTexture;',
        'uniform float vpZWidth;',
        'uniform float vpZHeight;',
      ]).result;
      FSSource = vtkShaderProgram.substitute(FSSource, '//VTK::ZBuffer::Impl', [
        'vec4 depthVec = texture2D(zBufferTexture, vec2(gl_FragCoord.x / vpZWidth, gl_FragCoord.y/vpZHeight));',
        'float zdepth = (depthVec.r*256.0 + depthVec.g)/257.0;',
        'zdepth = zdepth * 2.0 - 1.0;',
        'if (cameraParallel == 0) {',
        'zdepth = -2.0 * camFar * camNear / (zdepth*(camFar-camNear)-(camFar+camNear)) - camNear;}',
        'else {',
        'zdepth = (zdepth + 1.0) * 0.5 * (camFar - camNear);}\n',
        'zdepth = -zdepth/rayDirVC.z;',
        'dists.y = min(zdepth,dists.y);',
      ]).result;
    }

    // Set the BlendMode approach
    FSSource = vtkShaderProgram.substitute(
      FSSource,
      '//VTK::BlendMode',
      `${model.renderable.getBlendMode()}`
    ).result;

    const numberOfVolumes = model.currentValidInputs.length;
    FSSource = vtkShaderProgram.substitute(
      FSSource,
      '//VTK::NumberOfVolumes',
      `${numberOfVolumes}`
    ).result;

    // Also replace the sampling functions, because arrays of sampler can only be indexed using constants
    const fetchVolumeCases = [];
    const sampleVolumeCases = [];
    const sampleColorCases = [];
    const sampleOpacityCases = [];
    for (let volumeIndex = 0; volumeIndex < numberOfVolumes; ++volumeIndex) {
      fetchVolumeCases.push(`
    case ${volumeIndex}:
      return texelFetch(volumeTexture[${volumeIndex}], pos, 0);`);
      sampleVolumeCases.push(`
    case ${volumeIndex}:
      return texture(volumeTexture[${volumeIndex}], pos);`);
      sampleColorCases.push(`
    case ${volumeIndex}:
      return texture2D(colorTexture[${volumeIndex}], pos);`);
      sampleOpacityCases.push(`
    case ${volumeIndex}:
      return texture2D(opacityTexture[${volumeIndex}], pos);`);
    }
    FSSource = vtkShaderProgram.substitute(
      FSSource,
      '//VTK::fetchVolumeTexture',
      fetchVolumeCases
    ).result;
    FSSource = vtkShaderProgram.substitute(
      FSSource,
      '//VTK::sampleVolumeTexture',
      sampleVolumeCases
    ).result;
    FSSource = vtkShaderProgram.substitute(
      FSSource,
      '//VTK::sampleColorTexture',
      sampleColorCases
    ).result;
    FSSource = vtkShaderProgram.substitute(
      FSSource,
      '//VTK::sampleOpacityTexture',
      sampleOpacityCases
    ).result;

    FSSource = vtkShaderProgram.substitute(
      FSSource,
      '//VTK::NumberOfLights',
      `${model.numberOfLights}`
    ).result;

    FSSource = vtkShaderProgram.substitute(
      FSSource,
      '//VTK::MaxLaoKernelSize',
      `${model.maxLaoKernelSize}`
    ).result;

    shaders.Fragment = FSSource;

    const numberOfClippingPlanes = model.renderable.getClippingPlanes().length;
    if (numberOfClippingPlanes > 0) {
      FSSource = vtkShaderProgram.substitute(
        FSSource,
        '//VTK::ClipPlane::Dec',
        [
          `uniform vec3 vClipPlaneNormals[6];`,
          `uniform float vClipPlaneDistances[6];`,
          `uniform vec3 vClipPlaneOrigins[6];`,
          `uniform int clip_numPlanes;`,
          '//VTK::ClipPlane::Dec',
          '#define vtkClippingPlanesOn',
        ],
        false
      ).result;

      FSSource = vtkShaderProgram.substitute(
        FSSource,
        '//VTK::ClipPlane::Impl',
        [
          `for(int i = 0; i < ${numberOfClippingPlanes}; i++) {`,
          '  float rayDirRatio = dot(rayDir, vClipPlaneNormals[i]);',
          '  float equationResult = dot(vertexVCVSOutput, vClipPlaneNormals[i]) + vClipPlaneDistances[i];',
          '  if (rayDirRatio == 0.0)',
          '  {',
          '    if (equationResult < 0.0) dists.x = dists.y;',
          '    continue;',
          '  }',
          '  float result = -1.0 * equationResult / rayDirRatio;',
          '  if (rayDirRatio < 0.0) dists.y = min(dists.y, result);',
          '  else dists.x = max(dists.x, result);',
          '}',
          '//VTK::ClipPlane::Impl',
        ],
        false
      ).result;
    }

    shaders.Fragment = FSSource;
  };

  publicAPI.getNeedToRebuildShaders = (cellBO, ren, actor) => {
    // These are all the variables that fully determine the behavior of replaceShaderValues
    // and the exact content of the shader
    // See replaceShaderValues method
    const hasZBufferTexture = !!model.zBufferTexture;
    const numberOfValidInputs = model.currentValidInputs.length;
    const numberOfLights = model.numberOfLights;
    const maxLaoKernelSize = model.maxLaoKernelSize;
    const numberOfClippingPlanes = model.renderable.getClippingPlanes().length;
    // These are from the buildShader function in vtkReplacementShaderMapper
    const mapperShaderReplacements =
      model.renderable.getViewSpecificProperties().OpenGL?.ShaderReplacements;
    const renderPassShaderReplcaements =
      model.currentRenderPass?.getShaderReplacement();
    const blendMode = model.renderable.getBlendMode();

    // This enables optimizing out some function which avoids huge shader compilation time
    // The result of this computation is used in getColorForValue in the fragment shader
    const volumeProperties = actor.getProperties();
    model.colorForValueFunctionIds = model.currentValidInputs.map(
      ({ imageData, inputIndex }) => {
        const volumeProperty = volumeProperties[inputIndex];
        // If labeloutline and not the edge labelmap, since in the edge labelmap blend
        // we need the underlying data to sample through
        if (
          blendMode !== BlendMode.LABELMAP_EDGE_PROJECTION_BLEND &&
          isLabelmapOutlineRequired(volumeProperty)
        ) {
          return 5;
        }
        const scalars = imageData.getPointData()?.getScalars();
        const numberOfComponents = scalars.getNumberOfComponents();
        const useIndependentComps = useIndependentComponents(
          volumeProperty,
          numberOfComponents
        );
        if (useIndependentComps) {
          switch (volumeProperty.getColorMixPreset()) {
            case ColorMixPreset.ADDITIVE:
              return 1;
            case ColorMixPreset.COLORIZE:
              return 2;
            case ColorMixPreset.CUSTOM:
              return 3;
            default: // ColorMixPreset.DEFAULT
              return 4;
          }
        }
        return 0;
      }
    );

    // Get all the functions that are used, to check if the shader needs to be recompiled
    const usedFunctionsSet = new Set(model.colorForValueFunctionIds);
    // Custom mix could use a fallback on default mix
    if (usedFunctionsSet.has(3)) {
      usedFunctionsSet.add(4);
    }
    usedFunctionsSet.values();
    const usedColorForValueFunctionIds = [...usedFunctionsSet.values()].sort();

    // Get which types of lighting are enabled
    const surfaceLightingEnabled = model.currentValidInputs.some(
      ({ inputIndex }) =>
        volumeProperties[inputIndex].getVolumetricScatteringBlending() < 1.0
    );
    const volumeLightingEnabled = model.currentValidInputs.some(
      ({ inputIndex }) =>
        volumeProperties[inputIndex].getVolumetricScatteringBlending() > 0.0
    );

    // Is any volume using ForceNearestInterpolation
    const forceNearestInterpolationEnabled = model.currentValidInputs.some(
      ({ imageData, inputIndex }) => {
        const volumeProperty = volumeProperties[inputIndex];
        const scalars = imageData.getPointData()?.getScalars();
        const numberOfComponents = scalars?.getNumberOfComponents() || 0;
        for (let compIdx = 0; compIdx < numberOfComponents; ++compIdx) {
          if (volumeProperty.getForceNearestInterpolation(compIdx)) {
            return true;
          }
        }
        return false;
      }
    );

    const currentState = {
      blendMode,
      numberOfLights,
      numberOfValidInputs,
      hasZBufferTexture,
      maxLaoKernelSize,
      numberOfClippingPlanes,
      mapperShaderReplacements,
      renderPassShaderReplcaements,
      usedColorForValueFunctionIds,
      surfaceLightingEnabled,
      volumeLightingEnabled,
      forceNearestInterpolationEnabled,
    };

    // We need to rebuild the shader if one of these variables has changed,
    // since they are used in the shader template replacement step.
    // We also need to rebuild if the shader source time is outdated.
    if (
      cellBO.getProgram()?.getHandle() === 0 ||
      !model.previousState ||
      !DeepEqual(model.previousState, currentState)
    ) {
      model.previousState = currentState;
      return true;
    }
    return false;
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
    publicAPI.getClippingPlaneShaderParameters(cellBO, ren, actor);
  };

  publicAPI.setMapperShaderParameters = (cellBO, ren, actor) => {
    // Now to update the VAO too, if necessary.
    const program = cellBO.getProgram();

    if (
      cellBO.getCABO().getElementCount() &&
      (model.VBOBuildTime.getMTime() >
        cellBO.getAttributeUpdateTime().getMTime() ||
        cellBO.getShaderSourceTime().getMTime() >
          cellBO.getAttributeUpdateTime().getMTime())
    ) {
      if (program.isAttributeUsed('vertexDC')) {
        if (
          !cellBO
            .getVAO()
            .addAttributeArray(
              program,
              cellBO.getCABO(),
              'vertexDC',
              cellBO.getCABO().getVertexOffset(),
              cellBO.getCABO().getStride(),
              model.context.FLOAT,
              3,
              model.context.FALSE
            )
        ) {
          vtkErrorMacro('Error setting vertexDC in shader VAO.');
        }
      }
      cellBO.getAttributeUpdateTime().modified();
    }

    const sampleDistance = publicAPI.getCurrentSampleDistance(ren);
    program.setUniformf('sampleDistance', sampleDistance);

    const volumeShadowSampleDistance =
      sampleDistance * model.renderable.getVolumeShadowSamplingDistFactor();
    program.setUniformf(
      'volumeShadowSampleDistance',
      volumeShadowSampleDistance
    );

    const volumeProperties = actor.getProperties();
    model.currentValidInputs.forEach(
      ({ imageData, inputIndex }, shaderIndex) => {
        const volumeProperty = volumeProperties[inputIndex];
        const scalarTexture = model.scalarTextures[shaderIndex];
        const uniformPrefix = `volumes[${shaderIndex}]`;

        program.setUniformi(
          `volumeTexture[${shaderIndex}]`,
          scalarTexture.getTextureUnit()
        );

        const volInfo = scalarTexture.getVolumeInfo();
        const ipScalarRange = volumeProperty.getIpScalarRange();

        // In some situations, we might not have computed the scale and offset
        // for the data range, or it might not be needed.
        if (volInfo?.dataComputedScale?.length) {
          const minVals = [];
          const maxVals = [];
          for (let i = 0; i < 4; i++) {
            // convert iprange from 0-1 into data range values
            minVals[i] =
              ipScalarRange[0] * volInfo.dataComputedScale[i] +
              volInfo.dataComputedOffset[i];
            maxVals[i] =
              ipScalarRange[1] * volInfo.dataComputedScale[i] +
              volInfo.dataComputedOffset[i];
            // convert data ranges into texture values
            minVals[i] = (minVals[i] - volInfo.offset[i]) / volInfo.scale[i];
            maxVals[i] = (maxVals[i] - volInfo.offset[i]) / volInfo.scale[i];
          }
          program.setUniform4f(
            `${uniformPrefix}.ipScalarRangeMin`,
            minVals[0],
            minVals[1],
            minVals[2],
            minVals[3]
          );
          program.setUniform4f(
            `${uniformPrefix}.ipScalarRangeMax`,
            maxVals[0],
            maxVals[1],
            maxVals[2],
            maxVals[3]
          );
        }
      }
    );

    // if we have a zbuffer texture then set it
    if (model.zBufferTexture !== null) {
      program.setUniformi(
        'zBufferTexture',
        model.zBufferTexture.getTextureUnit()
      );
      const size = model._useSmallViewport
        ? [model._smallViewportWidth, model._smallViewportHeight]
        : model._openGLRenderWindow.getFramebufferSize();
      program.setUniformf('vpZWidth', size[0]);
      program.setUniformf('vpZHeight', size[1]);
    }
  };

  publicAPI.setCameraShaderParameters = (cellBO, ren, actor) => {
    // These matrices are not cached for their content, but only to avoid reallocations
    const {
      idxToView,
      idxNormalMatrix: idxToViewNormalMatrix,
      modelToView,
      projectionToView,
      projectionToWorld,
    } = preAllocatedMatrices;

    // [WMVP]C == {world, model, view, projection} coordinates
    // E.g., WCPC == world to projection coordinate transformation
    const keyMats = model.openGLCamera.getKeyMatrices(ren);
    const actMats = model.openGLVolume.getKeyMatrices();

    mat4.multiply(modelToView, keyMats.wcvc, actMats.mcwc);

    const program = cellBO.getProgram();

    const camera = model.openGLCamera.getRenderable();
    const useParallelProjection = camera.getParallelProjection();
    const clippingRange = camera.getClippingRange();
    program.setUniformf('camThick', clippingRange[1] - clippingRange[0]);
    program.setUniformf('camNear', clippingRange[0]);
    program.setUniformf('camFar', clippingRange[1]);
    program.setUniformi('cameraParallel', useParallelProjection);

    // Compute the viewport bounds of the volume
    // We will only render those fragments
    // First, merge all bounds to get a fusion of all bounds in model coordinates
    const boundsMC = model.currentValidInputs.reduce(
      (bounds, { imageData }) =>
        vtkBoundingBox.addBounds(bounds, imageData.getBounds()),
      [...vtkBoundingBox.INIT_BOUNDS]
    );
    const cornersMC = vtkBoundingBox.getCorners(boundsMC, []);
    const cornersDC = cornersMC.map((corner) => {
      // Convert to view coordinates
      vec3.transformMat4(corner, corner, modelToView);

      if (!useParallelProjection) {
        // Now find the projection of this point onto a
        // nearZ distance plane. Since pos is in view coordinates,
        // scale it until pos.z == nearZ
        const newScale = -clippingRange[0] / (corner[2] * vec3.length(corner));
        vec3.scale(corner, corner, newScale);
      }

      // Now convert to display coordinates
      vec3.transformMat4(corner, corner, keyMats.vcpc);

      return corner;
    });
    const boundsDC = vtkBoundingBox.addPoints(
      [...vtkBoundingBox.INIT_BOUNDS],
      cornersDC
    );
    program.setUniformf('dcxmin', boundsDC[0]);
    program.setUniformf('dcxmax', boundsDC[1]);
    program.setUniformf('dcymin', boundsDC[2]);
    program.setUniformf('dcymax', boundsDC[3]);

    const maximumRayLength = vtkBoundingBox.getDiagonalLength(boundsMC);
    const maximumNumberOfSamples = Math.ceil(
      maximumRayLength / publicAPI.getCurrentSampleDistance(ren)
    );
    program.setUniformi('maximumNumberOfSamples', maximumNumberOfSamples);
    if (maximumNumberOfSamples > model.renderable.getMaximumSamplesPerRay()) {
      vtkWarningMacro(
        `The number of steps required ${maximumNumberOfSamples} is larger than the ` +
          `specified maximum number of steps ${model.renderable.getMaximumSamplesPerRay()}.\n` +
          'Please either change the volumeMapper sampleDistance or its maximum number of samples.'
      );
    }

    const size = publicAPI.getRenderTargetSize();
    program.setUniformf('vpWidth', size[0]);
    program.setUniformf('vpHeight', size[1]);
    const offset = publicAPI.getRenderTargetOffset();
    program.setUniformf('vpOffsetX', offset[0] / size[0]);
    program.setUniformf('vpOffsetY', offset[1] / size[1]);

    mat4.invert(projectionToView, keyMats.vcpc);
    program.setUniformMatrix('PCVCMatrix', projectionToView);

    program.setUniformi('twoSidedLighting', ren.getTwoSidedLighting());

    const kernelSample = new Array(2 * model.maxLaoKernelSize);
    for (let i = 0; i < model.maxLaoKernelSize; i++) {
      kernelSample[i * 2] = Math.random();
      kernelSample[i * 2 + 1] = Math.random();
    }
    program.setUniform2fv('kernelSample', kernelSample);

    // Handle lighting values
    if (model.numberOfLights > 0) {
      let lightIndex = 0;
      ren.getLights().forEach((light) => {
        if (light.getSwitch() > 0) {
          const lightPrefix = `lights[${lightIndex}]`;

          // Merge color and intensity
          const color = light.getColor();
          const intensity = light.getIntensity();
          const scaledColor = vec3.scale([], color, intensity);
          program.setUniform3fv(`${lightPrefix}.color`, scaledColor);

          // Position in view coordinates
          const position = light.getTransformedPosition();
          vec3.transformMat4(position, position, modelToView);
          program.setUniform3fv(`${lightPrefix}.positionVC`, position);

          // Convert lightDirection in view coordinates and normalize it
          const direction = [...light.getDirection()];
          vec3.transformMat3(direction, direction, keyMats.normalMatrix);
          vec3.normalize(direction, direction);
          program.setUniform3fv(`${lightPrefix}.directionVC`, direction);

          // Camera direction of projection is (0, 0, -1.0) in view coordinates
          const halfAngle = [
            -0.5 * direction[0],
            -0.5 * direction[1],
            -0.5 * (direction[2] - 1.0),
          ];
          program.setUniform3fv(`${lightPrefix}.halfAngleVC`, halfAngle);

          // Attenuation
          const attenuation = light.getAttenuationValues();
          program.setUniform3fv(`${lightPrefix}.attenuation`, attenuation);

          // Exponent
          const exponent = light.getExponent();
          program.setUniformf(`${lightPrefix}.exponent`, exponent);

          // Cone angle
          const coneAngle = light.getConeAngle();
          program.setUniformf(`${lightPrefix}.coneAngle`, coneAngle);

          // Positional flag
          const isPositional = light.getPositional();
          program.setUniformi(`${lightPrefix}.isPositional`, isPositional);

          lightIndex++;
        }
      });
    }

    // Set uniforms per volume
    const volumeProperties = actor.getProperties();
    model.currentValidInputs.forEach(
      ({ imageData, inputIndex }, shaderIndex) => {
        const volumeProperty = volumeProperties[inputIndex];
        const uniformPrefix = `volumes[${shaderIndex}]`;

        const spatialExtent = imageData.getSpatialExtent();
        const spacing = imageData.getSpacing();
        const dimensions = imageData.getDimensions();
        const idxToModel = imageData.getIndexToWorld();
        const worldToIndex = imageData.getWorldToIndex();
        const imageDirection = imageData.getDirectionByReference();

        // idxToView is equivalent to applying idxToModel then modelToView
        mat4.multiply(idxToView, modelToView, idxToModel);

        // Set size uniform
        const sizeVC = vec3.multiply(new Float64Array(3), dimensions, spacing);
        program.setUniform3fv(`${uniformPrefix}.size`, sizeVC);

        const diagonalLength = vec3.length(sizeVC);
        program.setUniformf(`${uniformPrefix}.diagonalLength`, diagonalLength);

        // Set vctoijk uniform
        const inverseSize = vec3.inverse(new Float64Array(3), sizeVC);
        program.setUniform3fv(`${uniformPrefix}.inverseSize`, inverseSize);

        // Set spacing uniform
        program.setUniform3fv(`${uniformPrefix}.spacing`, spacing);
        const inverseSpacing = vec3.inverse([], spacing);
        program.setUniform3fv(
          `${uniformPrefix}.inverseSpacing`,
          inverseSpacing
        );

        // Set dimensions uniform
        program.setUniform3iv(`${uniformPrefix}.dimensions`, dimensions);

        // Set inverse dimensions uniform
        program.setUniform3fv(
          `${uniformPrefix}.inverseDimensions`,
          vec3.inverse([], dimensions)
        );

        // Set originVC uniform
        const spacialExtentMinIC = vec3.fromValues(
          spatialExtent[0],
          spatialExtent[2],
          spatialExtent[4]
        );
        const originVC = vec3.transformMat4(
          new Float64Array(3),
          spacialExtentMinIC,
          idxToView
        );
        program.setUniform3fv(`${uniformPrefix}.originVC`, originVC);

        // Set world to index
        program.setUniformMatrix(`${uniformPrefix}.worldToIndex`, worldToIndex);

        // map normals through normal matrix
        // then use a point on the plane to compute the distance
        mat3.multiply(
          idxToViewNormalMatrix,
          keyMats.normalMatrix,
          actMats.normalMatrix
        );
        mat3.multiply(
          idxToViewNormalMatrix,
          idxToViewNormalMatrix,
          imageDirection
        );
        program.setUniformMatrix3x3(
          `${uniformPrefix}.ISVCNormalMatrix`,
          idxToViewNormalMatrix
        );
        program.setUniformMatrix3x3(
          `${uniformPrefix}.VCISNormalMatrix`,
          mat3.transpose([], idxToViewNormalMatrix)
        );

        if (isLabelmapOutlineRequired(volumeProperty)) {
          const distance = camera.getDistance();

          // set the clipping range to be model.distance and model.distance + 0.1
          // since we use the in the keyMats.wcpc (world to projection) matrix
          // the projection matrix calculation relies on the clipping range to be
          // set correctly. This is done inside the interactorStyleMPRSlice which
          // limits use cases where the interactor style is not used.

          camera.setClippingRange(distance, distance + 0.1);
          const labelOutlineKeyMats = model.openGLCamera.getKeyMatrices(ren);

          // Get the projection coordinate to world coordinate transformation matrix.
          mat4.invert(projectionToWorld, labelOutlineKeyMats.wcpc);

          // reset the clipping range since the keyMats are cached
          camera.setClippingRange(clippingRange[0], clippingRange[1]);

          // to re compute the matrices for the current camera and cache them
          model.openGLCamera.getKeyMatrices(ren);

          program.setUniformMatrix(
            `${uniformPrefix}.PCWCMatrix`,
            projectionToWorld
          );
        }

        if (volumeProperty.getVolumetricScatteringBlending() > 0.0) {
          program.setUniformf(
            `${uniformPrefix}.globalIlluminationReach`,
            volumeProperty.getGlobalIlluminationReach()
          );
          program.setUniformf(
            `${uniformPrefix}.volumetricScatteringBlending`,
            volumeProperty.getVolumetricScatteringBlending()
          );
          program.setUniformf(
            `${uniformPrefix}.anisotropy`,
            volumeProperty.getAnisotropy()
          );
          program.setUniformf(
            `${uniformPrefix}.anisotropySquared`,
            volumeProperty.getAnisotropy() ** 2.0
          );
        }

        if (
          volumeProperty.getLocalAmbientOcclusion() &&
          volumeProperty.getAmbient() > 0.0
        ) {
          const kernelSize = volumeProperty.getLAOKernelSize();
          program.setUniformi(`${uniformPrefix}.kernelSize`, kernelSize);

          const kernelRadius = volumeProperty.getLAOKernelRadius();
          program.setUniformi(`${uniformPrefix}.kernelRadius`, kernelRadius);
        } else {
          program.setUniformi(`${uniformPrefix}.kernelSize`, 0);
        }
      }
    );
  };

  publicAPI.setPropertyShaderParameters = (cellBO, ren, actor) => {
    const program = cellBO.getProgram();

    program.setUniformi('jtexture', model.jitterTexture.getTextureUnit());

    const volumeProperties = actor.getProperties();

    // There is only one label outline thickness texture
    program.setUniformi(
      `labelOutlineThicknessTexture`,
      model.labelOutlineThicknessTexture.getTextureUnit()
    );

    model.currentValidInputs.forEach(
      ({ imageData, inputIndex }, shaderIndex) => {
        const volumeProperty = volumeProperties[inputIndex];
        const uniformPrefix = `volumes[${shaderIndex}]`;

        const scalarTexture = model.scalarTextures[shaderIndex];
        const opacityTexture = model.opacityTextures[shaderIndex];
        const colorTexture = model.colorTextures[shaderIndex];

        program.setUniformi(
          `colorTexture[${shaderIndex}]`,
          colorTexture.getTextureUnit()
        );
        program.setUniformi(
          `opacityTexture[${shaderIndex}]`,
          opacityTexture.getTextureUnit()
        );

        const volInfo = scalarTexture.getVolumeInfo();

        // set the component mix when independent
        const scalars = imageData.getPointData()?.getScalars();
        const numberOfComponents = scalars.getNumberOfComponents();
        const useIndependentComps = useIndependentComponents(
          volumeProperty,
          numberOfComponents
        );
        program.setUniformi(
          `${uniformPrefix}.useIndependentComponents`,
          useIndependentComps
        );
        program.setUniformi(
          `${uniformPrefix}.numberOfComponents`,
          numberOfComponents
        );
        if (useIndependentComps) {
          const independentComponentMix = new Float32Array(4);
          for (let i = 0; i < numberOfComponents; i++) {
            independentComponentMix[i] = volumeProperty.getComponentWeight(i);
          }
          program.setUniform4fv(
            `${uniformPrefix}.independentComponentMix`,
            independentComponentMix
          );
          const transferFunctionsSampleHeight = new Float32Array(4);
          const pixelHeight = 1 / numberOfComponents;
          for (let i = 0; i < numberOfComponents; ++i) {
            transferFunctionsSampleHeight[i] = (i + 0.5) * pixelHeight;
          }
          program.setUniform4fv(
            `${uniformPrefix}.transferFunctionsSampleHeight`,
            transferFunctionsSampleHeight
          );
        }

        const proportionalComponents = [0, 0, 0, 0];
        const forceNearestComponents = [0, 0, 0, 0];
        for (let nc = 0; nc < numberOfComponents; nc++) {
          proportionalComponents[nc] =
            volumeProperty.getOpacityMode(nc) === OpacityMode.PROPORTIONAL
              ? 1
              : 0;
          forceNearestComponents[nc] =
            volumeProperty.getForceNearestInterpolation(nc) ? 1 : 0;
        }
        program.setUniform4i(
          `${uniformPrefix}.isComponentProportional`,
          proportionalComponents
        );
        program.setUniform4i(
          `${uniformPrefix}.isComponentNearestInterpolationForced`,
          forceNearestComponents
        );

        const colorForValueFunctionId =
          model.colorForValueFunctionIds[shaderIndex];
        program.setUniformi(
          `${uniformPrefix}.colorForValueFunctionId`,
          colorForValueFunctionId
        );

        const computeNormalFromOpacity =
          volumeProperty.getComputeNormalFromOpacity();
        program.setUniformi(
          `${uniformPrefix}.computeNormalFromOpacity`,
          computeNormalFromOpacity
        );

        // three levels of shift scale combined into one
        // for performance in the fragment shader
        const colorTextureScale = new Float32Array(4);
        const colorTextureShift = new Float32Array(4);
        const opacityTextureScale = new Float32Array(4);
        const opacityTextureShift = new Float32Array(4);
        for (let i = 0; i < numberOfComponents; i++) {
          const target = useIndependentComps ? i : 0;
          const sscale = volInfo.scale[i];

          // Color
          const colorFunction = volumeProperty.getRGBTransferFunction(target);
          const colorRange = colorFunction.getRange();
          colorTextureScale[i] = sscale / (colorRange[1] - colorRange[0]);
          colorTextureShift[i] =
            (volInfo.offset[i] - colorRange[0]) /
            (colorRange[1] - colorRange[0]);

          // Opacity
          const opacityFunction = volumeProperty.getScalarOpacity(target);
          const opacityRange = opacityFunction.getRange();
          opacityTextureScale[i] = sscale / (opacityRange[1] - opacityRange[0]);
          opacityTextureShift[i] =
            (volInfo.offset[i] - opacityRange[0]) /
            (opacityRange[1] - opacityRange[0]);
        }
        program.setUniform4fv(
          `${uniformPrefix}.colorTextureScale`,
          colorTextureScale
        );
        program.setUniform4fv(
          `${uniformPrefix}.colorTextureShift`,
          colorTextureShift
        );
        program.setUniform4fv(
          `${uniformPrefix}.opacityTextureScale`,
          opacityTextureScale
        );
        program.setUniform4fv(
          `${uniformPrefix}.opacityTextureShift`,
          opacityTextureShift
        );

        const numberOfIndependantComponents = useIndependentComps
          ? numberOfComponents
          : 1;
        let isGradientOpacityEnabled = false;
        for (let i = 0; i < numberOfIndependantComponents; ++i) {
          if (volumeProperty.getUseGradientOpacity(i)) {
            isGradientOpacityEnabled = true;
            break;
          }
        }
        program.setUniformi(
          `${uniformPrefix}.isGradientOpacityEnabled`,
          isGradientOpacityEnabled
        );

        if (isGradientOpacityEnabled) {
          const gradientOpacityScale = new Array(4);
          const gradientOpacityShift = new Array(4);
          const gradientOpacityMin = new Array(4);
          const gradientOpacityMax = new Array(4);
          if (useIndependentComps) {
            for (let nc = 0; nc < numberOfComponents; ++nc) {
              const sscale = volInfo.scale[nc];
              const useGO = volumeProperty.getUseGradientOpacity(nc);
              if (useGO) {
                const goOpacityRange = [
                  volumeProperty.getGradientOpacityMinimumOpacity(nc),
                  volumeProperty.getGradientOpacityMaximumOpacity(nc),
                ];
                const goValueRange = [
                  volumeProperty.getGradientOpacityMinimumValue(nc),
                  volumeProperty.getGradientOpacityMaximumValue(nc),
                ];
                gradientOpacityMin[nc] = goOpacityRange[0];
                gradientOpacityMax[nc] = goOpacityRange[1];
                gradientOpacityScale[nc] =
                  (sscale * (goOpacityRange[1] - goOpacityRange[0])) /
                  (goValueRange[1] - goValueRange[0]);
                gradientOpacityShift[nc] =
                  (-goValueRange[0] * (goOpacityRange[1] - goOpacityRange[0])) /
                    (goValueRange[1] - goValueRange[0]) +
                  goOpacityRange[0];
              } else {
                gradientOpacityMin[nc] = 1;
                gradientOpacityMax[nc] = 1;
                gradientOpacityScale[nc] = 0;
                gradientOpacityShift[nc] = 1;
              }
            }
          } else {
            const sscale = volInfo.scale[numberOfComponents - 1];
            const goOpacityRange = [
              volumeProperty.getGradientOpacityMinimumOpacity(0),
              volumeProperty.getGradientOpacityMaximumOpacity(0),
            ];
            const goValueRange = [
              volumeProperty.getGradientOpacityMinimumValue(0),
              volumeProperty.getGradientOpacityMaximumValue(0),
            ];
            gradientOpacityMin[0] = goOpacityRange[0];
            gradientOpacityMax[0] = goOpacityRange[1];
            gradientOpacityScale[0] =
              (sscale * (goOpacityRange[1] - goOpacityRange[0])) /
              (goValueRange[1] - goValueRange[0]);
            gradientOpacityShift[0] =
              (-goValueRange[0] * (goOpacityRange[1] - goOpacityRange[0])) /
                (goValueRange[1] - goValueRange[0]) +
              goOpacityRange[0];
          }
          program.setUniform4f(
            `${uniformPrefix}.gradientOpacityScale`,
            gradientOpacityScale
          );
          program.setUniform4f(
            `${uniformPrefix}.gradientOpacityShift`,
            gradientOpacityShift
          );
          program.setUniform4f(
            `${uniformPrefix}.gradientOpacityMin`,
            gradientOpacityMin
          );
          program.setUniform4f(
            `${uniformPrefix}.gradientOpacityMax`,
            gradientOpacityMax
          );
        }

        const outlineOpacity = volumeProperty.getLabelOutlineOpacity();
        program.setUniformf(`${uniformPrefix}.outlineOpacity`, outlineOpacity);

        if (model.numberOfLights > 0) {
          program.setUniformf(
            `${uniformPrefix}.ambient`,
            volumeProperty.getAmbient()
          );
          program.setUniformf(
            `${uniformPrefix}.diffuse`,
            volumeProperty.getDiffuse()
          );
          program.setUniformf(
            `${uniformPrefix}.specular`,
            volumeProperty.getSpecular()
          );
          const specularPower = volumeProperty.getSpecularPower();
          program.setUniformf(
            `${uniformPrefix}.specularPower`,
            specularPower === 0 ? 1.0 : specularPower
          );
        }
      }
    );
  };

  publicAPI.getClippingPlaneShaderParameters = (cellBO, ren, actor) => {
    if (model.renderable.getClippingPlanes().length > 0) {
      const keyMats = model.openGLCamera.getKeyMatrices(ren);

      const clipPlaneNormals = [];
      const clipPlaneDistances = [];
      const clipPlaneOrigins = [];

      const clipPlanes = model.renderable.getClippingPlanes();
      const clipPlaneSize = clipPlanes.length;
      for (let i = 0; i < clipPlaneSize; ++i) {
        const clipPlaneNormal = clipPlanes[i].getNormal();
        const clipPlanePos = clipPlanes[i].getOrigin();

        vec3.transformMat3(
          clipPlaneNormal,
          clipPlaneNormal,
          keyMats.normalMatrix
        );

        vec3.transformMat4(clipPlanePos, clipPlanePos, keyMats.wcvc);

        const clipPlaneDist = -1.0 * vec3.dot(clipPlanePos, clipPlaneNormal);

        clipPlaneNormals.push(clipPlaneNormal[0]);
        clipPlaneNormals.push(clipPlaneNormal[1]);
        clipPlaneNormals.push(clipPlaneNormal[2]);
        clipPlaneDistances.push(clipPlaneDist);
        clipPlaneOrigins.push(clipPlanePos[0]);
        clipPlaneOrigins.push(clipPlanePos[1]);
        clipPlaneOrigins.push(clipPlanePos[2]);
      }
      const program = cellBO.getProgram();
      program.setUniform3fv(`vClipPlaneNormals`, clipPlaneNormals);
      program.setUniformfv(`vClipPlaneDistances`, clipPlaneDistances);
      program.setUniform3fv(`vClipPlaneOrigins`, clipPlaneOrigins);
      program.setUniformi(`clip_numPlanes`, clipPlaneSize);
    }
  };

  // unsubscribe from our listeners
  publicAPI.delete = macro.chain(
    () => {
      if (model._animationRateSubscription) {
        model._animationRateSubscription.unsubscribe();
        model._animationRateSubscription = null;
      }
    },
    () => {
      if (model._openGLRenderWindow) {
        unregisterGraphicsResources(model._openGLRenderWindow);
      }
    },
    publicAPI.delete
  );

  publicAPI.getRenderTargetSize = () => {
    if (model._useSmallViewport) {
      return [model._smallViewportWidth, model._smallViewportHeight];
    }

    const { usize, vsize } = model._openGLRenderer.getTiledSizeAndOrigin();

    return [usize, vsize];
  };

  publicAPI.getRenderTargetOffset = () => {
    const { lowerLeftU, lowerLeftV } =
      model._openGLRenderer.getTiledSizeAndOrigin();

    return [lowerLeftU, lowerLeftV];
  };

  publicAPI.getCurrentSampleDistance = (ren) => {
    const rwi = ren.getVTKWindow().getInteractor();
    const baseSampleDistance = model.renderable.getSampleDistance();
    if (rwi.isAnimating()) {
      const factor = model.renderable.getInteractionSampleDistanceFactor();
      return baseSampleDistance * factor;
    }
    return baseSampleDistance;
  };

  publicAPI.renderPieceStart = (ren, actor) => {
    const rwi = ren.getVTKWindow().getInteractor();

    if (!model._lastScale) {
      model._lastScale = model.renderable.getInitialInteractionScale();
    }
    model._useSmallViewport = false;
    if (rwi.isAnimating() && model._lastScale > 1.5) {
      model._useSmallViewport = true;
    }

    if (!model._animationRateSubscription) {
      // when the animation frame rate changes recompute the scale factor
      model._animationRateSubscription = rwi.onAnimationFrameRateUpdate(() => {
        if (model.renderable.getAutoAdjustSampleDistances()) {
          const frate = rwi.getRecentAnimationFrameRate();
          const adjustment = rwi.getDesiredUpdateRate() / frate;

          // only change if we are off by 15%
          if (adjustment > 1.15 || adjustment < 0.85) {
            model._lastScale *= adjustment;
          }
          // clamp scale to some reasonable values.
          // Below 1.5 we will just be using full resolution as that is close enough
          // Above 400 seems like a lot so we limit to that 1/20th per axis
          if (model._lastScale > 400) {
            model._lastScale = 400;
          }
          if (model._lastScale < 1.5) {
            model._lastScale = 1.5;
          }
        } else {
          model._lastScale =
            model.renderable.getImageSampleDistance() *
            model.renderable.getImageSampleDistance();
        }
      });
    }

    // use/create/resize framebuffer if needed
    if (model._useSmallViewport) {
      const size = model._openGLRenderWindow.getFramebufferSize();
      const scaleFactor = 1 / Math.sqrt(model._lastScale);
      model._smallViewportWidth = Math.ceil(scaleFactor * size[0]);
      model._smallViewportHeight = Math.ceil(scaleFactor * size[1]);

      // adjust viewportSize to always be at most the dest fo size
      if (model._smallViewportHeight > size[1]) {
        model._smallViewportHeight = size[1];
      }
      if (model._smallViewportWidth > size[0]) {
        model._smallViewportWidth = size[0];
      }
      model.framebuffer.saveCurrentBindingsAndBuffers();

      if (model.framebuffer.getGLFramebuffer() === null) {
        model.framebuffer.create(size[0], size[1]);
        model.framebuffer.populateFramebuffer();
      } else {
        const fbSize = model.framebuffer.getSize();
        if (!fbSize || fbSize[0] !== size[0] || fbSize[1] !== size[1]) {
          model.framebuffer.create(size[0], size[1]);
          model.framebuffer.populateFramebuffer();
        }
      }
      model.framebuffer.bind();
      const gl = model.context;
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.colorMask(true, true, true, true);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.viewport(0, 0, model._smallViewportWidth, model._smallViewportHeight);
      model.fvp = [
        model._smallViewportWidth / size[0],
        model._smallViewportHeight / size[1],
      ];
    }
    model.context.disable(model.context.DEPTH_TEST);

    // make sure the BOs are up to date
    publicAPI.updateBufferObjects(ren, actor);

    // set interpolation on the texture based on property setting
    const volumeProperties = actor.getProperties();
    model.currentValidInputs.forEach(({ inputIndex }) => {
      const volumeProperty = volumeProperties[inputIndex];
      const interpolationType = volumeProperty.getInterpolationType();
      const scalarTexture = model.scalarTextures[inputIndex];
      if (interpolationType === InterpolationType.NEAREST) {
        scalarTexture.setMinificationFilter(Filter.NEAREST);
        scalarTexture.setMagnificationFilter(Filter.NEAREST);
      } else {
        scalarTexture.setMinificationFilter(Filter.LINEAR);
        scalarTexture.setMagnificationFilter(Filter.LINEAR);
      }
    });

    // if we have a zbuffer texture then activate it
    if (model.zBufferTexture !== null) {
      model.zBufferTexture.activate();
    }
  };

  publicAPI.renderPieceDraw = (ren, actor) => {
    const gl = model.context;

    // render the texture
    const allTextures = [
      ...model.scalarTextures,
      ...model.colorTextures,
      ...model.opacityTextures,
      model.labelOutlineThicknessTexture,
      model.jitterTexture,
    ];
    allTextures.forEach((texture) => texture.activate());

    publicAPI.updateShaders(model.tris, ren, actor);

    // First we do the triangles, update the shader, set uniforms, etc.
    gl.drawArrays(gl.TRIANGLES, 0, model.tris.getCABO().getElementCount());
    model.tris.getVAO().release();

    allTextures.forEach((texture) => texture.deactivate());
  };

  publicAPI.renderPieceFinish = (ren, actor) => {
    // if we have a zbuffer texture then deactivate it
    if (model.zBufferTexture !== null) {
      model.zBufferTexture.deactivate();
    }

    if (model._useSmallViewport) {
      // now copy the framebuffer with the volume into the
      // regular buffer
      model.framebuffer.restorePreviousBindingsAndBuffers();

      if (model.copyShader === null) {
        model.copyShader = model._openGLRenderWindow
          .getShaderCache()
          .readyShaderProgramArray(
            [
              '//VTK::System::Dec',
              'attribute vec4 vertexDC;',
              'uniform vec2 tfactor;',
              'varying vec2 tcoord;',
              'void main() { tcoord = vec2(vertexDC.x*0.5 + 0.5, vertexDC.y*0.5 + 0.5) * tfactor; gl_Position = vertexDC; }',
            ].join('\n'),
            [
              '//VTK::System::Dec',
              '//VTK::Output::Dec',
              'uniform sampler2D texture1;',
              'varying vec2 tcoord;',
              'void main() { gl_FragData[0] = texture2D(texture1,tcoord); }',
            ].join('\n'),
            ''
          );
        const program = model.copyShader;

        model.copyVAO = vtkVertexArrayObject.newInstance();
        model.copyVAO.setOpenGLRenderWindow(model._openGLRenderWindow);

        model.tris.getCABO().bind();
        if (
          !model.copyVAO.addAttributeArray(
            program,
            model.tris.getCABO(),
            'vertexDC',
            model.tris.getCABO().getVertexOffset(),
            model.tris.getCABO().getStride(),
            model.context.FLOAT,
            3,
            model.context.FALSE
          )
        ) {
          vtkErrorMacro('Error setting vertexDC in copy shader VAO.');
        }
      } else {
        model._openGLRenderWindow
          .getShaderCache()
          .readyShaderProgram(model.copyShader);
      }

      const size = model._openGLRenderWindow.getFramebufferSize();
      model.context.viewport(0, 0, size[0], size[1]);

      // activate texture
      const tex = model.framebuffer.getColorTexture();
      tex.activate();
      model.copyShader.setUniformi('texture', tex.getTextureUnit());
      model.copyShader.setUniform2f('tfactor', model.fvp[0], model.fvp[1]);

      const gl = model.context;
      gl.blendFuncSeparate(
        gl.ONE,
        gl.ONE_MINUS_SRC_ALPHA,
        gl.ONE,
        gl.ONE_MINUS_SRC_ALPHA
      );

      // render quad
      model.context.drawArrays(
        model.context.TRIANGLES,
        0,
        model.tris.getCABO().getElementCount()
      );
      tex.deactivate();

      gl.blendFuncSeparate(
        gl.SRC_ALPHA,
        gl.ONE_MINUS_SRC_ALPHA,
        gl.ONE,
        gl.ONE_MINUS_SRC_ALPHA
      );
    }
  };

  publicAPI.renderPiece = (ren, actor) => {
    publicAPI.invokeEvent({ type: 'StartEvent' });

    // Get the valid image data inputs
    model.renderable.update();
    const numberOfInputs = model.renderable.getNumberOfInputPorts();
    model.currentValidInputs = [];
    for (let inputIndex = 0; inputIndex < numberOfInputs; ++inputIndex) {
      const imageData = model.renderable.getInputData(inputIndex);
      if (imageData && !imageData.isDeleted()) {
        model.currentValidInputs.push({ imageData, inputIndex });
      }
    }

    // Get the number of lights
    let newNumberOfLights = 0;
    ren.getLights().forEach((light) => {
      if (light.getSwitch() > 0) {
        newNumberOfLights++;
      }
    });
    if (newNumberOfLights !== model.numberOfLights) {
      model.numberOfLights = newNumberOfLights;
      publicAPI.modified();
    }

    // Get the max kernel size from volume properties that use LAO and
    // that are linked to a valid input imageData
    model.maxLaoKernelSize = 0;
    const volumeProperties = actor.getProperties();
    model.currentValidInputs.forEach(({ inputIndex }) => {
      const volumeProperty = volumeProperties[inputIndex];
      const kernelSize = volumeProperty.getLAOKernelSize();
      if (
        kernelSize > model.maxLaoKernelSize &&
        volumeProperty.getLocalAmbientOcclusion() &&
        volumeProperty.getAmbient() > 0.0
      ) {
        model.maxLaoKernelSize = kernelSize;
      }
    });

    publicAPI.invokeEvent({ type: 'EndEvent' });

    if (model.currentValidInputs.length === 0) {
      return;
    }

    publicAPI.renderPieceStart(ren, actor);
    publicAPI.renderPieceDraw(ren, actor);
    publicAPI.renderPieceFinish(ren, actor);
  };

  publicAPI.updateBufferObjects = (ren, actor) => {
    // Rebuild buffers if needed
    if (publicAPI.getNeedToRebuildBufferObjects(ren, actor)) {
      publicAPI.buildBufferObjects(ren, actor);
    }
  };

  publicAPI.getNeedToRebuildBufferObjects = (ren, actor) => {
    if (
      model.VBOBuildTime.getMTime() < publicAPI.getMTime() ||
      model.VBOBuildTime.getMTime() < actor.getMTime() ||
      model.VBOBuildTime.getMTime() < model.renderable.getMTime() ||
      model.currentValidInputs.some(
        ({ imageData }) => model.VBOBuildTime.getMTime() < imageData.getMTime()
      ) ||
      !model.scalarTexture?.getHandle() ||
      !model.colorTexture?.getHandle() ||
      !model.labelOutlineThicknessTexture?.getHandle()
    ) {
      return true;
    }
    return false;
  };

  publicAPI.buildBufferObjects = (ren, actor) => {
    const volumeProperties = actor.getProperties();
    model.currentValidInputs.forEach(
      ({ imageData, inputIndex }, shaderIndex) => {
        const volumeProperty = volumeProperties[inputIndex];
        const scalars = imageData.getPointData()?.getScalars();
        if (!volumeProperty || !scalars) {
          return;
        }

        if (!model.jitterTexture.getHandle()) {
          const jitterArray = new Float32Array(32 * 32);
          for (let i = 0; i < 32 * 32; ++i) {
            jitterArray[i] = Math.random();
          }
          model.jitterTexture.setMinificationFilter(Filter.NEAREST);
          model.jitterTexture.setMagnificationFilter(Filter.NEAREST);
          model.jitterTexture.create2DFromRaw(
            32,
            32,
            1,
            VtkDataTypes.FLOAT,
            jitterArray
          );
        }

        const numberOfComponents = scalars.getNumberOfComponents();
        const useIndependentComps = useIndependentComponents(
          volumeProperty,
          numberOfComponents
        );
        const numIComps = useIndependentComps ? numberOfComponents : 1;

        const scalarOpacityFunc = volumeProperty.getScalarOpacity();
        const opTex =
          model._openGLRenderWindow.getGraphicsResourceForObject(
            scalarOpacityFunc
          );
        const opacityFuncHash = getTransferFunctionHash(
          scalarOpacityFunc,
          useIndependentComps,
          numIComps
        );
        const reBuildOp = !opTex?.oglObject || opTex.hash !== opacityFuncHash;
        if (reBuildOp) {
          const newOpacityTexture = vtkOpenGLTexture.newInstance();
          newOpacityTexture.setOpenGLRenderWindow(model._openGLRenderWindow);
          // rebuild opacity tfun?
          const oWidth = 1024;
          const oSize = oWidth * 2 * numIComps;
          const ofTable = new Float32Array(oSize);
          const tmpTable = new Float32Array(oWidth);

          for (let c = 0; c < numIComps; ++c) {
            const ofun = volumeProperty.getScalarOpacity(c);
            const opacityFactor =
              publicAPI.getCurrentSampleDistance(ren) /
              volumeProperty.getScalarOpacityUnitDistance(c);

            const oRange = ofun.getRange();
            ofun.getTable(oRange[0], oRange[1], oWidth, tmpTable, 1);
            // adjust for sample distance etc
            for (let i = 0; i < oWidth; ++i) {
              ofTable[c * oWidth * 2 + i] =
                1.0 - (1.0 - tmpTable[i]) ** opacityFactor;
              ofTable[c * oWidth * 2 + i + oWidth] =
                ofTable[c * oWidth * 2 + i];
            }
          }

          newOpacityTexture.resetFormatAndType();
          newOpacityTexture.setMinificationFilter(Filter.LINEAR);
          newOpacityTexture.setMagnificationFilter(Filter.LINEAR);

          // use float texture where possible because we really need the resolution
          // for this table. Errors in low values of opacity accumulate to
          // visible artifacts. High values of opacity quickly terminate without
          // artifacts.
          if (
            model._openGLRenderWindow.getWebgl2() ||
            (model.context.getExtension('OES_texture_float') &&
              model.context.getExtension('OES_texture_float_linear'))
          ) {
            newOpacityTexture.create2DFromRaw(
              oWidth,
              2 * numIComps,
              1,
              VtkDataTypes.FLOAT,
              ofTable
            );
          } else {
            const oTable = new Uint8ClampedArray(oSize);
            for (let i = 0; i < oSize; ++i) {
              oTable[i] = 255.0 * ofTable[i];
            }
            newOpacityTexture.create2DFromRaw(
              oWidth,
              2 * numIComps,
              1,
              VtkDataTypes.UNSIGNED_CHAR,
              oTable
            );
          }
          if (scalarOpacityFunc) {
            model._openGLRenderWindow.setGraphicsResourceForObject(
              scalarOpacityFunc,
              newOpacityTexture,
              opacityFuncHash
            );
          }
          model.opacityTextures[shaderIndex] = newOpacityTexture;
        } else {
          model.opacityTextures[shaderIndex] = opTex.oglObject;
        }
        replaceGraphicsResource(
          model._openGLRenderWindow,
          model._opacityTexturesCore[shaderIndex],
          scalarOpacityFunc
        );
        model._opacityTexturesCore[shaderIndex] = scalarOpacityFunc;

        // rebuild color tfun?
        const colorTransferFunc = volumeProperty.getRGBTransferFunction();
        const colorFuncHash = getTransferFunctionHash(
          colorTransferFunc,
          useIndependentComps,
          numIComps
        );
        const cTex =
          model._openGLRenderWindow.getGraphicsResourceForObject(
            colorTransferFunc
          );
        const reBuildC =
          !cTex?.oglObject?.getHandle() || cTex?.hash !== colorFuncHash;
        if (reBuildC) {
          const newColorTexture = vtkOpenGLTexture.newInstance();
          newColorTexture.setOpenGLRenderWindow(model._openGLRenderWindow);
          const cWidth = 1024;
          const cSize = cWidth * 2 * numIComps * 3;
          const cTable = new Uint8ClampedArray(cSize);
          const tmpTable = new Float32Array(cWidth * 3);

          for (let c = 0; c < numIComps; ++c) {
            const cfun = volumeProperty.getRGBTransferFunction(c);
            const cRange = cfun.getRange();
            cfun.getTable(cRange[0], cRange[1], cWidth, tmpTable, 1);
            for (let i = 0; i < cWidth * 3; ++i) {
              cTable[c * cWidth * 6 + i] = 255.0 * tmpTable[i];
              cTable[c * cWidth * 6 + i + cWidth * 3] = 255.0 * tmpTable[i];
            }
          }

          newColorTexture.resetFormatAndType();
          newColorTexture.setMinificationFilter(Filter.LINEAR);
          newColorTexture.setMagnificationFilter(Filter.LINEAR);

          newColorTexture.create2DFromRaw(
            cWidth,
            2 * numIComps,
            3,
            VtkDataTypes.UNSIGNED_CHAR,
            cTable
          );
          if (colorTransferFunc) {
            model._openGLRenderWindow.setGraphicsResourceForObject(
              colorTransferFunc,
              newColorTexture,
              colorFuncHash
            );
          }
          model.colorTextures[shaderIndex] = newColorTexture;
        } else {
          model.colorTextures[shaderIndex] = cTex.oglObject;
        }
        replaceGraphicsResource(
          model._openGLRenderWindow,
          model._colorTexturesCore[shaderIndex],
          colorTransferFunc
        );
        model._colorTexturesCore[shaderIndex] = colorTransferFunc;

        // rebuild the scalarTexture if the data has changed
        const tex =
          model._openGLRenderWindow.getGraphicsResourceForObject(scalars);
        const scalarsHash = getImageDataHash(imageData, scalars);
        const reBuildTex =
          !tex?.oglObject?.getHandle() || tex?.hash !== scalarsHash;
        if (reBuildTex) {
          const newScalarTexture = vtkOpenGLTexture.newInstance();
          newScalarTexture.setOpenGLRenderWindow(model._openGLRenderWindow);
          // Build the textures
          const dims = imageData.getDimensions();
          // Use norm16 for scalar texture if the extension is available
          newScalarTexture.setOglNorm16Ext(
            model.context.getExtension('EXT_texture_norm16')
          );
          newScalarTexture.resetFormatAndType();
          newScalarTexture.create3DFilterableFromDataArray(
            dims[0],
            dims[1],
            dims[2],
            scalars,
            volumeProperty.getPreferSizeOverAccuracy()
          );
          model._openGLRenderWindow.setGraphicsResourceForObject(
            imageData,
            newScalarTexture,
            scalarsHash
          );
          model.scalarTextures[shaderIndex] = newScalarTexture;
        } else {
          model.scalarTextures[shaderIndex] = tex.oglObject;
        }
        replaceGraphicsResource(
          model._openGLRenderWindow,
          model._scalarTexturesCore[shaderIndex],
          imageData
        );
        model._scalarTexturesCore[shaderIndex] = imageData;
      }
    );

    // rebuild label outline thickness texture?
    const firstVolumeProperty =
      volumeProperties[model.currentValidInputs[0].inputIndex];
    const labelOutlineThicknessArray =
      firstVolumeProperty.getLabelOutlineThickness();
    const lTex = model._openGLRenderWindow.getGraphicsResourceForObject(
      labelOutlineThicknessArray
    );
    const labelOutlineThicknessHash = labelOutlineThicknessArray.join('-');
    const reBuildL =
      !lTex?.oglObject?.getHandle() || lTex?.hash !== labelOutlineThicknessHash;
    if (reBuildL) {
      const newLabelOutlineThicknessTexture = vtkOpenGLTexture.newInstance();
      newLabelOutlineThicknessTexture.setOpenGLRenderWindow(
        model._openGLRenderWindow
      );
      const lWidth = 1024;
      const lHeight = 1;
      const lSize = lWidth * lHeight;
      const lTable = new Uint8Array(lSize);

      // Assuming labelOutlineThicknessArray contains the thickness for each segment
      for (let i = 0; i < lWidth; ++i) {
        // Retrieve the thickness value for the current segment index.
        // If the value is undefined, use the first element's value as a default, otherwise use the value (even if 0)
        const thickness =
          typeof labelOutlineThicknessArray[i] !== 'undefined'
            ? labelOutlineThicknessArray[i]
            : labelOutlineThicknessArray[0];

        lTable[i] = thickness;
      }

      newLabelOutlineThicknessTexture.resetFormatAndType();
      newLabelOutlineThicknessTexture.setMinificationFilter(Filter.NEAREST);
      newLabelOutlineThicknessTexture.setMagnificationFilter(Filter.NEAREST);

      // Create a 2D texture (acting as 1D) from the raw data
      newLabelOutlineThicknessTexture.create2DFromRaw(
        lWidth,
        lHeight,
        1,
        VtkDataTypes.UNSIGNED_CHAR,
        lTable
      );

      if (labelOutlineThicknessArray) {
        model._openGLRenderWindow.setGraphicsResourceForObject(
          labelOutlineThicknessArray,
          newLabelOutlineThicknessTexture,
          labelOutlineThicknessHash
        );
      }
      model.labelOutlineThicknessTexture = newLabelOutlineThicknessTexture;
    } else {
      model.labelOutlineThicknessTexture = lTex.oglObject;
    }
    replaceGraphicsResource(
      model._openGLRenderWindow,
      model._labelOutlineThicknessTextureCore,
      labelOutlineThicknessArray
    );
    model._labelOutlineThicknessTextureCore = labelOutlineThicknessArray;

    if (!model.tris.getCABO().getElementCount()) {
      // build the CABO
      const ptsArray = new Float32Array(12);
      for (let i = 0; i < 4; i++) {
        ptsArray[i * 3] = (i % 2) * 2 - 1.0;
        ptsArray[i * 3 + 1] = i > 1 ? 1.0 : -1.0;
        ptsArray[i * 3 + 2] = -1.0;
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

      const points = vtkDataArray.newInstance({
        numberOfComponents: 3,
        values: ptsArray,
      });
      points.setName('points');
      const cells = vtkDataArray.newInstance({
        numberOfComponents: 1,
        values: cellArray,
      });
      model.tris.getCABO().createVBO(cells, 'polys', Representation.SURFACE, {
        points,
        cellOffset: 0,
      });
    }

    model.VBOBuildTime.modified();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  context: null,
  VBOBuildTime: null,
  scalarTextures: [],
  _scalarTexturesCore: [],
  opacityTextures: [],
  _opacityTexturesCore: [],
  colorTextures: [],
  _colorTexturesCore: [],
  labelOutlineThicknessTextures: [],
  _labelOutlineThicknessTextureCore: null,
  jitterTexture: null,
  tris: null,
  framebuffer: null,
  copyShader: null,
  copyVAO: null,
  lastXYF: 1.0,
  targetXYF: 1.0,
  zBufferTexture: null,
  lastZBufferTexture: null,
  fullViewportTime: 1.0,
  idxToView: null,
  idxNormalMatrix: null,
  modelToView: null,
  projectionToView: null,
  avgWindowArea: 0.0,
  avgFrameTime: 0.0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  vtkReplacementShaderMapper.implementBuildShadersWithReplacements(
    publicAPI,
    model,
    initialValues
  );

  model.VBOBuildTime = {};
  macro.obj(model.VBOBuildTime, { mtime: 0 });

  model.tris = vtkHelper.newInstance();
  model.jitterTexture = vtkOpenGLTexture.newInstance();
  model.jitterTexture.setWrapS(Wrap.REPEAT);
  model.jitterTexture.setWrapT(Wrap.REPEAT);
  model.framebuffer = vtkOpenGLFramebuffer.newInstance();

  // Build VTK API
  macro.setGet(publicAPI, model, ['context']);

  // Object methods
  vtkOpenGLVolumeMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOpenGLVolumeMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };

// Register ourself to OpenGL backend if imported
registerOverride('vtkVolumeMapper', newInstance);
