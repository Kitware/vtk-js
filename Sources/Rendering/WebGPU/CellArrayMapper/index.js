import { mat3, mat4 } from 'gl-matrix';

import * as macro from 'vtk.js/Sources/macros';
import vtkDataSet from 'vtk.js/Sources/Common/DataModel/DataSet';
import CoincidentTopologyHelper from 'vtk.js/Sources/Rendering/Core/Mapper/CoincidentTopologyHelper';

import vtkProp from 'vtk.js/Sources/Rendering/Core/Prop';
import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';
import vtkProperty2D from 'vtk.js/Sources/Rendering/Core/Property2D';
import vtkWebGPUBufferManager from 'vtk.js/Sources/Rendering/WebGPU/BufferManager';
import vtkWebGPUUniformBuffer from 'vtk.js/Sources/Rendering/WebGPU/UniformBuffer';
import vtkWebGPUSimpleMapper from 'vtk.js/Sources/Rendering/WebGPU/SimpleMapper';
import vtkWebGPUStorageBuffer from 'vtk.js/Sources/Rendering/WebGPU/StorageBuffer';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkWebGPUTypes from 'vtk.js/Sources/Rendering/WebGPU/Types';
import { getSkinningData } from 'vtk.js/Sources/Common/Core/AnimationMixer';
import { UV_TRANSFORM_KEYS } from 'vtk.js/Sources/Rendering/WebGPU/CellArrayMapper/Constants';
import { getMaterialFeatureFlags } from 'vtk.js/Sources/Rendering/WebGPU/CellArrayMapper/Helpers';
import {
  vtkWebGPUPolyDataVS,
  vtkWebGPUPolyDataFS,
} from 'vtk.js/Sources/Rendering/WebGPU/CellArrayMapper/Shaders';
import { updateTextures as updateTexturesHelper } from 'vtk.js/Sources/Rendering/WebGPU/CellArrayMapper/Textures';
import {
  getUsage as getUsageHelper,
  getHashFromUsage as getHashFromUsageHelper,
  getTopologyFromUsage as getTopologyFromUsageHelper,
  buildVertexInput as buildVertexInputHelper,
} from 'vtk.js/Sources/Rendering/WebGPU/CellArrayMapper/VertexInput';
import {
  addClipPlaneEntries,
  getClippingPlaneEquationsInCoords,
  MAX_CLIPPING_PLANES,
} from 'vtk.js/Sources/Rendering/WebGPU/Helpers/ClippingPlanes';
import replaceShaderPositionHelper from 'vtk.js/Sources/Rendering/WebGPU/CellArrayMapper/Replacements/Position';
import replaceShaderCoincidentOffsetHelper from 'vtk.js/Sources/Rendering/WebGPU/CellArrayMapper/Replacements/CoincidentOffset';
import replaceShaderNormalHelper from 'vtk.js/Sources/Rendering/WebGPU/CellArrayMapper/Replacements/Normal';
import replaceShaderLightHelper from 'vtk.js/Sources/Rendering/WebGPU/CellArrayMapper/Replacements/Lighting';
import replaceShaderColorHelper from 'vtk.js/Sources/Rendering/WebGPU/CellArrayMapper/Replacements/Color';
import replaceShaderTCoordHelper from 'vtk.js/Sources/Rendering/WebGPU/CellArrayMapper/Replacements/TCoord';
import replaceShaderSelectHelper from 'vtk.js/Sources/Rendering/WebGPU/CellArrayMapper/Replacements/Select';
import replaceShaderAlphaHelper from 'vtk.js/Sources/Rendering/WebGPU/CellArrayMapper/Replacements/Alpha';

const { Resolve } = CoincidentTopologyHelper;
const { FieldAssociations } = vtkDataSet;
const { PrimitiveTypes } = vtkWebGPUBufferManager;
const { Representation } = vtkProperty;
const { ColorMode } = vtkMapper;

const { CoordinateSystem } = vtkProp;
const { DisplayLocation } = vtkProperty2D;

const tmp2Mat4 = new Float64Array(16);

// ----------------------------------------------------------------------------
// vtkWebGPUCellArrayMapper methods
// ----------------------------------------------------------------------------

function vtkWebGPUCellArrayMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUCellArrayMapper');

  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      if (model.is2D) {
        model.WebGPUActor =
          publicAPI.getFirstAncestorOfType('vtkWebGPUActor2D');
        model.forceZValue = true;
      } else {
        model.WebGPUActor = publicAPI.getFirstAncestorOfType('vtkWebGPUActor');
        model.forceZValue = false;
      }
      model.coordinateSystem =
        model.WebGPUActor.getRenderable().getCoordinateSystem();
      model.useRendererMatrix =
        model.coordinateSystem !== CoordinateSystem.DISPLAY;
      model.WebGPURenderer =
        model.WebGPUActor.getFirstAncestorOfType('vtkWebGPURenderer');
      model.WebGPURenderWindow = model.WebGPURenderer.getParent();
      model.device = model.WebGPURenderWindow.getDevice();
    }
  };

  publicAPI.isEdgePrimitive = () =>
    model.primitiveType === PrimitiveTypes.TriangleEdges ||
    model.primitiveType === PrimitiveTypes.TriangleStripEdges;

  publicAPI.shouldSkipPass = () =>
    publicAPI.isEdgePrimitive() && (model.depthOnlyPass || model.selectionPass);

  // Renders myself
  publicAPI.renderForPass = (renderEncoder, depthOnly = false) => {
    model.depthOnlyPass = depthOnly;
    model.selectionPass = renderEncoder?.getPipelineHash?.() === 'sel';
    if (publicAPI.shouldSkipPass()) {
      model.depthOnlyPass = false;
      model.selectionPass = false;
      return;
    }
    publicAPI.prepareToDraw(renderEncoder);
    model.renderEncoder.registerDrawCallback(model.pipeline, publicAPI.draw);
    model.depthOnlyPass = false;
    model.selectionPass = false;
  };

  publicAPI.translucentPass = (prepass) => {
    if (prepass) {
      publicAPI.renderForPass(model.WebGPURenderer.getRenderEncoder());
    }
  };

  publicAPI.opaquePass = (prepass) => {
    if (prepass) {
      publicAPI.renderForPass(model.WebGPURenderer.getRenderEncoder());
    }
  };

  publicAPI.zBufferPass = (prepass) => {
    if (prepass) {
      publicAPI.renderForPass(model.WebGPURenderer.getRenderEncoder(), true);
    }
  };

  publicAPI.opaqueZBufferPass = (prepass) => publicAPI.zBufferPass(prepass);

  publicAPI.updateUBO = () => {
    const actor = model.WebGPUActor.getRenderable();
    const ppty = actor.getProperty();
    const clippingPlanesMTime = model.renderable.getClippingPlanesMTime();
    const backfaceProperty = actor.getBackfaceProperty?.() ?? ppty;
    const selector = model.WebGPURenderer?.getSelector?.();
    const utime = model.UBO.getSendTime();
    if (
      !selector &&
      publicAPI.getMTime() <= utime &&
      actor.getMTime() <= utime &&
      ppty.getMTime() <= utime &&
      backfaceProperty.getMTime() <= utime &&
      model.renderable.getMTime() <= utime &&
      clippingPlanesMTime <= utime
    ) {
      return;
    }

    // Matrix Updates
    const keyMats = model.WebGPUActor.getKeyMatrices(model.WebGPURenderer);
    model.UBO.setArray('BCWCMatrix', keyMats.bcwc);
    model.UBO.setArray('BCSCMatrix', keyMats.bcsc);
    model.UBO.setArray('MCWCNormals', keyMats.normalMatrix);

    // Detect negative-determinant model matrix (odd reflections / negative scale)
    const mcwc = actor.getMatrix();
    const upper3x3 = mat3.fromMat4(mat3.create(), mcwc);
    model.UBO.setValue(
      'FlipFrontFacing',
      mat3.determinant(upper3x3) < 0 ? 1.0 : 0.0
    );

    model.UBO.setValue(
      'DebugChannel',
      model.renderable?.getDebugChannel?.() ?? 0
    );

    // 2D or 3D
    if (model.is2D) {
      const displayLoc =
        ppty.getDisplayLocation?.() ?? DisplayLocation.BACKGROUND;
      model.UBO.setValue(
        'ZValue',
        displayLoc === DisplayLocation.FOREGROUND ? 1.0 : 0.0
      );
      const aColor = ppty.getColorByReference();
      model.UBO.setValue('AmbientIntensity', 1.0);
      model.UBO.setArray('AmbientColor', [...aColor, 1.0]);
      model.UBO.setArray('DiffuseColor', [...aColor, 1.0]);
      model.UBO.setValue('DiffuseIntensity', 0.0);
      model.UBO.setArray('SpecularColor', [1.0, 1.0, 1.0, 1.0]);
      model.UBO.setValue('SpecularIntensity', 0.0);
      model.UBO.setValue('Roughness', 1.0);
      model.UBO.setValue('BaseIOR', 1.45);
      model.UBO.setValue('Metallic', 0.0);
      model.UBO.setValue('Emission', 1.0);
      model.UBO.setValue('NormalStrength', 1.0);
      model.UBO.setValue('AmbientIntensityBF', 1.0);
      model.UBO.setArray('AmbientColorBF', [...aColor, 1.0]);
      model.UBO.setValue('DiffuseIntensityBF', 0.0);
      model.UBO.setArray('DiffuseColorBF', [...aColor, 1.0]);
      model.UBO.setArray('SpecularColorBF', [1.0, 1.0, 1.0, 1.0]);
      model.UBO.setValue('SpecularIntensityBF', 0.0);
      model.UBO.setValue('RoughnessBF', 1.0);
      model.UBO.setValue('BaseIORBF', 1.45);
      model.UBO.setValue('MetallicBF', 0.0);
      model.UBO.setValue('EmissionBF', 1.0);
      model.UBO.setValue('NormalStrengthBF', 1.0);
      model.UBO.setValue('OpacityBF', ppty.getOpacity());
      // Default specular extension values (identity)
      model.UBO.setValue('SpecularFactor', 1.0);
      model.UBO.setArray('SpecularColorFactor', [1.0, 1.0, 1.0, 1.0]);
    } else {
      // Base Colors
      model.UBO.setValue('AmbientIntensity', ppty.getAmbient());
      model.UBO.setArray('AmbientColor', [
        ...ppty.getAmbientColorByReference(),
        1.0,
      ]);
      model.UBO.setValue('DiffuseIntensity', ppty.getDiffuse());
      model.UBO.setArray('DiffuseColor', [
        ...ppty.getDiffuseColorByReference(),
        1.0,
      ]);
      // Roughness
      model.UBO.setValue('Roughness', ppty.getRoughness());
      model.UBO.setValue('BaseIOR', ppty.getBaseIOR());
      // Metallic
      model.UBO.setValue('Metallic', ppty.getMetallic());
      // Normal
      model.UBO.setValue('NormalStrength', ppty.getNormalStrength());
      // Emission
      model.UBO.setValue('Emission', ppty.getEmission());
      // Specular
      model.UBO.setValue('SpecularIntensity', ppty.getSpecular());
      model.UBO.setArray('SpecularColor', [
        ...ppty.getSpecularColorByReference(),
        1.0,
      ]);

      // Anisotropy
      model.UBO.setValue('Anisotropy', ppty.getAnisotropy?.() ?? 0);
      model.UBO.setValue(
        'AnisotropyRotation',
        ppty.getAnisotropyRotation?.() ?? 0
      );

      // Clearcoat
      model.UBO.setValue('CoatStrength', ppty.getCoatStrength?.() ?? 0);
      model.UBO.setValue('CoatRoughness', ppty.getCoatRoughness?.() ?? 0);
      model.UBO.setArray('CoatColor', [
        ...(ppty.getCoatColorByReference?.() ?? [1, 1, 1]),
        1.0,
      ]);
      model.UBO.setValue('CoatF0', ppty.getCoatF0?.() ?? 0.04);
      model.UBO.setValue(
        'CoatNormalStrength',
        ppty.getCoatNormalStrength?.() ?? 1
      );

      // Displacement
      model.UBO.setValue(
        'DisplacementFactor',
        ppty.getDisplacementFactor?.() ?? 1
      );

      // Emissive strength
      model.UBO.setValue('EmissiveStrength', ppty.getEmissiveStrength?.() ?? 1);

      // Occlusion strength
      model.UBO.setValue(
        'OcclusionStrength',
        ppty.getOcclusionStrength?.() ?? 1
      );

      // Transmission
      model.UBO.setValue('Transmission', ppty.getTransmissionFactor?.() ?? 0);

      // Alpha cutoff
      model.UBO.setValue('AlphaCutoff', ppty.getAlphaCutoff?.() ?? 0);

      // Volume
      model.UBO.setValue('ThicknessFactor', ppty.getThicknessFactor?.() ?? 0);
      const attDist = ppty.getAttenuationDistance?.() ?? Infinity;
      model.UBO.setValue(
        'AttenuationDistance',
        Number.isFinite(attDist) ? attDist : 1e10
      );
      model.UBO.setArray('AttenuationColor', [
        ...(ppty.getAttenuationColorByReference?.() ?? [1, 1, 1]),
        1.0,
      ]);

      // Iridescence
      model.UBO.setValue(
        'IridescenceFactor',
        ppty.getIridescenceFactor?.() ?? 0
      );
      model.UBO.setValue('IridescenceIOR', ppty.getIridescenceIOR?.() ?? 1.3);
      model.UBO.setValue(
        'IridescenceThicknessMin',
        ppty.getIridescenceThicknessMinimum?.() ?? 100
      );
      model.UBO.setValue(
        'IridescenceThicknessMax',
        ppty.getIridescenceThicknessMaximum?.() ?? 400
      );

      // Sheen
      const sheenColor = ppty.getSheenColorFactor?.() ?? [0, 0, 0];
      model.UBO.setArray('SheenColor', [...sheenColor, 1.0]);
      model.UBO.setValue(
        'SheenRoughness',
        ppty.getSheenRoughnessFactor?.() ?? 0
      );
      // Diffuse Transmission
      model.UBO.setValue(
        'DiffuseTransmissionFactor',
        ppty.getDiffuseTransmissionFactor?.() ?? 0
      );
      const dtColor = ppty.getDiffuseTransmissionColorFactor?.() ?? [1, 1, 1];
      model.UBO.setArray('DiffuseTransmissionColor', [...dtColor, 1.0]);
      // Dispersion
      model.UBO.setValue('Dispersion', ppty.getDispersion?.() ?? 0);
      // KHR_materials_specular
      model.UBO.setValue('SpecularFactor', ppty.getSpecularFactor?.() ?? 1.0);
      const specColorFactor = ppty.getSpecularColorFactor?.() ?? [1, 1, 1];
      model.UBO.setArray('SpecularColorFactor', [...specColorFactor, 1.0]);

      // UV transform uniforms (for KHR_texture_transform animation support)
      const uvTransforms = ppty.getTextureTransforms?.() || {};
      for (let i = 0; i < model.uvTransformKeys.length; i++) {
        const key = model.uvTransformKeys[i];
        const t = uvTransforms[key];
        if (t && (t.rotation != null || t.scale || t.offset)) {
          const r = t.rotation || 0;
          const cosR = Math.cos(r);
          const sinR = Math.sin(r);
          const sx = t.scale?.[0] ?? 1;
          const sy = t.scale?.[1] ?? 1;
          const ox = t.offset?.[0] ?? 0;
          const oy = t.offset?.[1] ?? 0;
          model.UBO.setArray(`UVT_${key}_RS`, [
            cosR * sx,
            sinR * sx,
            -(sinR * sy),
            cosR * sy,
          ]);
          model.UBO.setArray(`UVT_${key}_Off`, [ox, oy, 0, 0]);
        } else {
          // Identity transform
          model.UBO.setArray(`UVT_${key}_RS`, [1, 0, 0, 1]);
          model.UBO.setArray(`UVT_${key}_Off`, [0, 0, 0, 0]);
        }
      }

      model.UBO.setValue('AmbientIntensityBF', backfaceProperty.getAmbient());
      model.UBO.setArray('AmbientColorBF', [
        ...backfaceProperty.getAmbientColorByReference(),
        1.0,
      ]);
      model.UBO.setValue('DiffuseIntensityBF', backfaceProperty.getDiffuse());
      model.UBO.setArray('DiffuseColorBF', [
        ...backfaceProperty.getDiffuseColorByReference(),
        1.0,
      ]);
      model.UBO.setValue('RoughnessBF', backfaceProperty.getRoughness());
      model.UBO.setValue('BaseIORBF', backfaceProperty.getBaseIOR());
      model.UBO.setValue('MetallicBF', backfaceProperty.getMetallic());
      model.UBO.setValue('EmissionBF', backfaceProperty.getEmission());
      model.UBO.setValue(
        'NormalStrengthBF',
        backfaceProperty.getNormalStrength()
      );
      model.UBO.setValue('SpecularIntensityBF', backfaceProperty.getSpecular());
      model.UBO.setArray('SpecularColorBF', [
        ...backfaceProperty.getSpecularColorByReference(),
        1.0,
      ]);
      model.UBO.setValue('OpacityBF', backfaceProperty.getOpacity());
    }

    // Edge and Misc
    const edgeColor = ppty.getEdgeColorByReference?.();
    if (edgeColor) model.UBO.setArray('EdgeColor', [...edgeColor, 1.0]);
    model.UBO.setValue('LineWidth', ppty.getLineWidth());
    const edgeLikeRepresentation =
      model.primitiveType === PrimitiveTypes.TriangleEdges ||
      model.primitiveType === PrimitiveTypes.TriangleStripEdges ||
      ppty.getRepresentation() === Representation.WIREFRAME;
    model.UBO.setValue(
      'Opacity',
      edgeLikeRepresentation ? ppty.getEdgeOpacity() : ppty.getOpacity()
    );
    model.UBO.setValue('PropID', model.WebGPUActor.getPropID());
    const cp = publicAPI.getCoincidentParameters();
    model.UBO.setValue('CoincidentFactor', cp.factor);
    model.UBO.setValue('CoincidentOffset', cp.offset);
    model.UBO.setValue('CellScalarOffset', model.cellOffset);
    model.UBO.setValue('NumClipPlanes', 0);

    if (!model.is2D && model.useRendererMatrix) {
      const center = model.WebGPURenderer.getStabilizedCenterByReference();
      mat4.fromTranslation(tmp2Mat4, [-center[0], -center[1], -center[2]]);
      const numClipPlanes = getClippingPlaneEquationsInCoords(
        model.renderable,
        tmp2Mat4,
        model.clipPlanes
      );
      model.UBO.setValue('NumClipPlanes', numClipPlanes);

      if (numClipPlanes > 0) {
        for (let i = 0; i < numClipPlanes; i++) {
          model.UBO.setArray(`ClipPlane${i}`, model.clipPlanes[i]);
        }
      }
    }

    // Only send if needed
    model.UBO.sendIfNeeded(model.WebGPURenderWindow.getDevice());
  };

  publicAPI.haveWideLines = () => {
    const actor = model.WebGPUActor.getRenderable();
    const representation = actor.getProperty().getRepresentation();
    if (actor.getProperty().getLineWidth() <= 1.0) {
      return false;
    }
    if (model.primitiveType === PrimitiveTypes.Verts) {
      return false;
    }
    if (
      model.primitiveType === PrimitiveTypes.Triangles ||
      model.primitiveType === PrimitiveTypes.TriangleStrips
    ) {
      return representation === Representation.WIREFRAME;
    }
    return true;
  };

  publicAPI.getCullMode = () => {
    const actor = model.WebGPUActor.getRenderable();
    const property = actor.getProperty();

    let frontCull = property.getFrontfaceCulling();
    let backCull = property.getBackfaceCulling();

    // Detect negative determinant from the model matrix (negative scale).
    // When the determinant is negative, triangle winding is flipped,
    // so we must swap the cull mode per the glTF spec.
    if (frontCull || backCull) {
      const mcwc = actor.getMatrix();
      const upper3x3 = mat3.fromMat4(mat3.create(), mcwc);
      if (mat3.determinant(upper3x3) < 0) {
        const tmp = frontCull;
        frontCull = backCull;
        backCull = tmp;
      }
    }

    if (frontCull) {
      return 'front';
    }
    if (backCull) {
      return 'back';
    }
    return 'none';
  };

  publicAPI.getPipelineSettings = () => ({
    primitive: {
      cullMode: publicAPI.getCullMode(),
    },
  });

  publicAPI.getCoincidentParameters = () => {
    let cp = {
      factor: 0.0,
      offset: 0.0,
    };

    const actor = model.WebGPUActor?.getRenderable();
    const prop = actor?.getProperty?.();
    if (!prop) {
      return cp;
    }

    if (
      // backwards compat with code that (errorneously) set this to boolean
      // eslint-disable-next-line eqeqeq
      model.renderable.getResolveCoincidentTopology() ==
        Resolve.PolygonOffset ||
      (prop.getEdgeVisibility() &&
        prop.getRepresentation() === Representation.SURFACE)
    ) {
      const primType = model.primitiveType;
      if (
        primType === PrimitiveTypes.Verts ||
        prop.getRepresentation() === Representation.POINTS
      ) {
        cp = model.renderable.getCoincidentTopologyPointOffsetParameter();
      } else if (
        primType === PrimitiveTypes.Lines ||
        prop.getRepresentation() === Representation.WIREFRAME
      ) {
        cp = model.renderable.getCoincidentTopologyLineOffsetParameters();
      } else if (
        primType === PrimitiveTypes.Triangles ||
        primType === PrimitiveTypes.TriangleStrips
      ) {
        cp = model.renderable.getCoincidentTopologyPolygonOffsetParameters();
      }

      if (
        primType === PrimitiveTypes.TriangleEdges ||
        primType === PrimitiveTypes.TriangleStripEdges
      ) {
        cp = model.renderable.getCoincidentTopologyPolygonOffsetParameters();
        cp.factor /= 2.0;
        cp.offset /= 2.0;
      }
    }

    // Hardware point picking always offsets due to the saved depth buffer.
    const selector = model.WebGPURenderer?.getSelector?.();
    if (
      selector &&
      selector.getFieldAssociation() ===
        FieldAssociations.FIELD_ASSOCIATION_POINTS
    ) {
      cp.offset -= 2.0;
    }

    return cp;
  };

  // Skinning SSBO ---
  publicAPI.updateSkinSSBO = () => {
    const actor = model.WebGPUActor.getRenderable();
    const skinningData = getSkinningData(actor);

    if (!skinningData) {
      model._hasSkinning = false;
      if (model._skinSSBO) {
        model._skinSSBO = null;
        model.SSBO = null;
      }
      return;
    }

    const { jointMatrices, jointCount } = skinningData;
    model._hasSkinning = true;

    // Create or resize the SSBO if joint count changed
    if (!model._skinSSBO || model._skinJointCount !== jointCount) {
      model._skinSSBO = vtkWebGPUStorageBuffer.newInstance({
        label: 'skinJointSSBO',
      });
      model._skinSSBO.addEntry('JointMatrix', 'mat4x4<f32>');
      model._skinSSBO.setNumberOfInstances(jointCount);
      model._skinJointCount = jointCount;
      model.SSBO = model._skinSSBO;
    }

    // Write all joint matrices
    model._skinSSBO.setAllInstancesFromArray('JointMatrix', jointMatrices);

    // Send to GPU
    const device = model.WebGPURenderWindow.getDevice();
    model._skinSSBO.send(device);
  };

  publicAPI.updateCellScalarSSBO = () => {
    if (publicAPI.isEdgePrimitive()) {
      model._cellColorSSBO = null;
      return;
    }

    if (!model._usesCellScalars) {
      model._cellColorSSBO = null;
      return;
    }

    let c = model.renderable.getColorMapColors();
    if (!c) {
      const { scalars } = model.renderable.getAbstractScalars(
        model.currentInput,
        model.renderable.getScalarMode(),
        model.renderable.getArrayAccessMode(),
        0,
        model.renderable.getColorByArrayName()
      );
      if (scalars) {
        const lut = model.renderable.getLookupTable?.();
        if (lut) {
          lut.build?.();
          c = lut.mapScalars(
            scalars,
            model.renderable.getColorMode?.() ?? ColorMode.MAP_SCALARS,
            model.renderable.getFieldDataTupleId?.() ?? -1
          );
        }
      }
    }

    if (!c) {
      model._cellColorSSBO = null;
      return;
    }

    const cdata = c.getData();
    const numTuples = c.getNumberOfTuples();
    if (!cdata || !numTuples) {
      model._cellColorSSBO = null;
      return;
    }

    if (!model._cellColorSSBO) {
      model._cellColorSSBO = vtkWebGPUStorageBuffer.newInstance({
        label: 'cellColorSSBO',
      });
    } else {
      model._cellColorSSBO.clearData();
      model._cellColorSSBO.setLabel('cellColorSSBO');
    }

    model._cellColorSSBO.addEntry('CellColor', 'vec4<f32>');
    model._cellColorSSBO.setNumberOfInstances(numTuples);
    model._cellColorSSBO.setAllInstancesFromArrayColorToFloat(
      'CellColor',
      cdata
    );
    model._cellColorSSBO.send(model.device);
  };

  publicAPI.replaceShaderPosition = (hash, pipeline, vertexInput) => {
    replaceShaderPositionHelper(publicAPI, model, hash, pipeline, vertexInput);
  };
  model.shaderReplacements.set(
    'replaceShaderPosition',
    publicAPI.replaceShaderPosition
  );

  publicAPI.replaceShaderCoincidentOffset = (hash, pipeline, vertexInput) => {
    replaceShaderCoincidentOffsetHelper(
      publicAPI,
      model,
      hash,
      pipeline,
      vertexInput
    );
  };
  model.shaderReplacements.set(
    'replaceShaderCoincidentOffset',
    publicAPI.replaceShaderCoincidentOffset
  );

  publicAPI.replaceShaderNormal = (hash, pipeline, vertexInput) => {
    replaceShaderNormalHelper(publicAPI, model, hash, pipeline, vertexInput);
  };
  model.shaderReplacements.set(
    'replaceShaderNormal',
    publicAPI.replaceShaderNormal
  );

  // we only apply lighting when there is a "var normal" declaration in the
  // fragment shader code. That is the lighting trigger.
  publicAPI.replaceShaderLight = (hash, pipeline, vertexInput) => {
    replaceShaderLightHelper(publicAPI, model, hash, pipeline, vertexInput);
  };
  model.shaderReplacements.set(
    'replaceShaderLight',
    publicAPI.replaceShaderLight
  );

  publicAPI.replaceShaderColor = (hash, pipeline, vertexInput) => {
    replaceShaderColorHelper(publicAPI, model, hash, pipeline, vertexInput);
  };
  model.shaderReplacements.set(
    'replaceShaderColor',
    publicAPI.replaceShaderColor
  );

  publicAPI.replaceShaderTCoord = (hash, pipeline, vertexInput) => {
    replaceShaderTCoordHelper(publicAPI, model, hash, pipeline, vertexInput);
  };
  model.shaderReplacements.set(
    'replaceShaderTCoord',
    publicAPI.replaceShaderTCoord
  );

  publicAPI.replaceShaderSelect = (hash, pipeline, vertexInput) => {
    replaceShaderSelectHelper(publicAPI, model, hash, pipeline, vertexInput);
  };
  model.shaderReplacements.set(
    'replaceShaderSelect',
    publicAPI.replaceShaderSelect
  );

  publicAPI.replaceShaderAlpha = (hash, pipeline, vertexInput) => {
    replaceShaderAlphaHelper(publicAPI, model, hash, pipeline, vertexInput);
  };
  model.shaderReplacements.set(
    'replaceShaderAlpha',
    publicAPI.replaceShaderAlpha
  );

  publicAPI.getUsage = (rep, i) => getUsageHelper(rep, i);

  publicAPI.getHashFromUsage = (usage) => getHashFromUsageHelper(usage);

  publicAPI.getTopologyFromUsage = (usage) => getTopologyFromUsageHelper(usage);

  publicAPI.buildVertexInput = () => {
    buildVertexInputHelper(publicAPI, model);
  };

  publicAPI.updateTextures = () => {
    updateTexturesHelper(publicAPI, model);
  };

  // compute a unique hash for a pipeline, this needs to be unique enough to
  // capture any pipeline code changes (which includes shader changes)
  // or vertex input changes/ bind groups/ etc
  publicAPI.computePipelineHash = () => {
    let pipelineHash = `pd${model.useRendererMatrix ? 'r' : ''}${
      model.forceZValue ? 'z' : ''
    }`;
    if (model.depthOnlyPass) {
      pipelineHash += 'd';
    }
    if (model.selectionPass) {
      pipelineHash += 's';
    }

    if (
      model.primitiveType === PrimitiveTypes.TriangleEdges ||
      model.primitiveType === PrimitiveTypes.TriangleStripEdges
    ) {
      pipelineHash += 'edge';
    } else {
      if (model.vertexInput.hasAttribute(`normalMC`)) {
        pipelineHash += `n`;
      }
      if (model.vertexInput.hasAttribute(`tangentMC`)) {
        pipelineHash += `tg`;
      }
      if (model.vertexInput.hasAttribute(`colorVI`)) {
        pipelineHash += `c`;
      }
      if (model.vertexInput.hasAttribute(`tcoord`)) {
        const tcoords = model.vertexInput.getBuffer('tcoord');
        const numComp = vtkWebGPUTypes.getNumberOfComponentsFromBufferFormat(
          tcoords.getArrayInformation()[0].format
        );
        pipelineHash += `t${numComp}`;
        if (model.vertexInput.hasAttribute('tcoord1')) {
          pipelineHash += 'tc1';
        }
      }
      if (model.vertexInput.hasAttribute(`colorTCoord`)) {
        const colorTCoords = model.vertexInput.getBuffer('colorTCoord');
        const numComp = vtkWebGPUTypes.getNumberOfComponentsFromBufferFormat(
          colorTCoords.getArrayInformation()[0].format
        );
        pipelineHash += `ct${numComp}`;
      }
      if (model.textures.length) {
        const textureLabels = model.textureViews
          .map((view) => view.getLabel?.() ?? '')
          .join(',');
        pipelineHash += `tx${model.textures.length}:${textureLabels}`;
      }

      const actor = model.WebGPUActor?.getRenderable?.();
      const ppty = actor?.getProperty?.();
      if (ppty) {
        const isEnabled = (value) => (value ? 1 : 0);
        const tcoordBuffer = model.vertexInput.getBuffer('tcoord');
        const tcoordComponents = tcoordBuffer
          ? vtkWebGPUTypes.getNumberOfComponentsFromBufferFormat(
              tcoordBuffer.getArrayInformation()[0].format
            )
          : 0;
        const displacementTexture = ppty.getDisplacementTexture?.();
        const hasDisplacement =
          displacementTexture?.getImageLoaded?.() &&
          displacementTexture.getDimensionality?.() === tcoordComponents &&
          model.vertexInput.hasAttribute('normalMC') &&
          !!tcoordBuffer;
        const {
          hasAnisotropy,
          hasClearCoat,
          hasCoatNormalTexture,
          hasDiffuseTransmission,
          hasDispersion,
          hasIridescence,
          hasKHRSpecular,
          hasSheen,
          hasTransmission,
          hasVolume,
        } = getMaterialFeatureFlags(ppty);
        const textureTransforms = ppty.getTextureTransforms?.() || {};
        pipelineHash += [
          `an${isEnabled(hasAnisotropy)}`,
          `cc${isEnabled(hasClearCoat)}`,
          `nm${isEnabled(ppty.getNormalTexture?.())}`,
          `cnm${isEnabled(hasCoatNormalTexture)}`,
          `vol${isEnabled(hasVolume)}`,
          `disp${isEnabled(hasDisplacement)}`,
          `tr${isEnabled(
            hasTransmission &&
              model.WebGPURenderer?.getOpaqueColorTextureView?.()
          )}`,
          `ac${isEnabled((ppty.getAlphaCutoff?.() ?? 0) > 0)}`,
          `am${ppty.getAlphaMode?.() ?? 0}`,
          `ir${isEnabled(hasIridescence)}`,
          `tt${
            Object.keys(textureTransforms).length
              ? Object.keys(textureTransforms).sort().join(',')
              : '0'
          }`,
          `sh${isEnabled(hasSheen)}`,
          `dt${isEnabled(hasDiffuseTransmission)}`,
          `dp${isEnabled(hasDispersion)}`,
          `sp${isEnabled(hasKHRSpecular)}`,
        ].join('');
      }
    }

    if (model._usesCellNormals) {
      pipelineHash += `cn`;
    }

    if (model.SSBO) {
      pipelineHash += `ssbo`;
    }

    if (model._hasSkinning) {
      pipelineHash += `skin${model._skinJointCount}`;
    }

    const uhash = publicAPI.getHashFromUsage(model.usage);
    pipelineHash += uhash;
    pipelineHash += `cm${publicAPI.getCullMode()}`;
    pipelineHash += model.renderEncoder.getPipelineHash();

    model.pipelineHash = pipelineHash;
  };

  publicAPI.updateBuffers = () => {
    // handle textures if not edges
    if (
      model.primitiveType !== PrimitiveTypes.TriangleEdges &&
      model.primitiveType !== PrimitiveTypes.TriangleStripEdges
    ) {
      publicAPI.updateTextures();
    }

    const actor = model.WebGPUActor.getRenderable();
    const rep = actor.getProperty().getRepresentation();

    // handle per primitive type
    model.usage = publicAPI.getUsage(rep, model.primitiveType);
    publicAPI.buildVertexInput();
    publicAPI.updateCellScalarSSBO();

    const vbo = model.vertexInput.getBuffer('vertexBC');
    publicAPI.setNumberOfVertices(
      vbo.getSizeInBytes() / vbo.getStrideInBytes()
    );
    publicAPI.setTopology(publicAPI.getTopologyFromUsage(model.usage));
    publicAPI.updateUBO();
    publicAPI.updateSkinSSBO();
    model.SSBO = model._skinSSBO || model._cellColorSSBO || null;
    if (publicAPI.haveWideLines()) {
      const ppty = actor.getProperty();
      publicAPI.setNumberOfInstances(Math.ceil(ppty.getLineWidth() * 2.0));
    } else {
      publicAPI.setNumberOfInstances(1);
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  depthOnlyPass: false,
  selectionPass: false,
  is2D: false,
  cellArray: null,
  currentInput: null,
  cellOffset: 0,
  primitiveType: 0,
  colorTexture: null,
  _usesCellScalars: false,
  _cellColorSSBO: null,
  renderEncoder: null,
  textures: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkWebGPUSimpleMapper.extend(publicAPI, model, initialValues);

  model.fragmentShaderTemplate = vtkWebGPUPolyDataFS;
  model.vertexShaderTemplate = vtkWebGPUPolyDataVS;

  model._tmpMat3 = mat3.identity(new Float64Array(9));

  // UBO
  model.UBO = vtkWebGPUUniformBuffer.newInstance({ label: 'mapperUBO' });
  model.UBO.addEntry('BCWCMatrix', 'mat4x4<f32>');
  model.UBO.addEntry('BCSCMatrix', 'mat4x4<f32>');
  model.UBO.addEntry('MCWCNormals', 'mat4x4<f32>');
  model.UBO.addEntry('AmbientColor', 'vec4<f32>');
  model.UBO.addEntry('AmbientColorBF', 'vec4<f32>');
  model.UBO.addEntry('DiffuseColor', 'vec4<f32>');
  model.UBO.addEntry('DiffuseColorBF', 'vec4<f32>');
  model.UBO.addEntry('EdgeColor', 'vec4<f32>');
  model.UBO.addEntry('SpecularColor', 'vec4<f32>');
  model.UBO.addEntry('SpecularColorBF', 'vec4<f32>');
  model.UBO.addEntry('AmbientIntensity', 'f32');
  model.UBO.addEntry('AmbientIntensityBF', 'f32');
  model.UBO.addEntry('DiffuseIntensity', 'f32');
  model.UBO.addEntry('DiffuseIntensityBF', 'f32');
  model.UBO.addEntry('Roughness', 'f32');
  model.UBO.addEntry('RoughnessBF', 'f32');
  model.UBO.addEntry('Metallic', 'f32');
  model.UBO.addEntry('MetallicBF', 'f32');
  model.UBO.addEntry('Ambient', 'f32');
  model.UBO.addEntry('Normal', 'f32');
  model.UBO.addEntry('Emission', 'f32');
  model.UBO.addEntry('EmissionBF', 'f32');
  model.UBO.addEntry('NormalStrength', 'f32');
  model.UBO.addEntry('NormalStrengthBF', 'f32');
  model.UBO.addEntry('BaseIOR', 'f32');
  model.UBO.addEntry('BaseIORBF', 'f32');
  model.UBO.addEntry('SpecularIntensity', 'f32');
  model.UBO.addEntry('SpecularIntensityBF', 'f32');
  model.UBO.addEntry('LineWidth', 'f32');
  model.UBO.addEntry('Opacity', 'f32');
  model.UBO.addEntry('OpacityBF', 'f32');
  model.UBO.addEntry('ZValue', 'f32');
  model.UBO.addEntry('CoincidentFactor', 'f32');
  model.UBO.addEntry('CoincidentOffset', 'f32');
  model.UBO.addEntry('CellScalarOffset', 'u32');
  model.UBO.addEntry('PropID', 'u32');
  model.UBO.addEntry('ClipNear', 'f32');
  model.UBO.addEntry('ClipFar', 'f32');
  model.UBO.addEntry('Time', 'u32');
  // Anisotropy
  model.UBO.addEntry('Anisotropy', 'f32');
  model.UBO.addEntry('AnisotropyRotation', 'f32');
  // Clearcoat
  model.UBO.addEntry('CoatStrength', 'f32');
  model.UBO.addEntry('CoatRoughness', 'f32');
  model.UBO.addEntry('CoatColor', 'vec4<f32>');
  model.UBO.addEntry('CoatF0', 'f32');
  model.UBO.addEntry('CoatNormalStrength', 'f32');
  // Displacement
  model.UBO.addEntry('DisplacementFactor', 'f32');
  // Emissive strength
  model.UBO.addEntry('EmissiveStrength', 'f32');
  // Occlusion strength
  model.UBO.addEntry('OcclusionStrength', 'f32');
  // Transmission
  model.UBO.addEntry('Transmission', 'f32');
  // Alpha cutoff
  model.UBO.addEntry('AlphaCutoff', 'f32');
  // Volume
  model.UBO.addEntry('ThicknessFactor', 'f32');
  model.UBO.addEntry('AttenuationDistance', 'f32');
  model.UBO.addEntry('AttenuationColor', 'vec4<f32>');
  // Iridescence
  model.UBO.addEntry('IridescenceFactor', 'f32');
  model.UBO.addEntry('IridescenceIOR', 'f32');
  model.UBO.addEntry('IridescenceThicknessMin', 'f32');
  model.UBO.addEntry('IridescenceThicknessMax', 'f32');
  // Sheen
  model.UBO.addEntry('SheenColor', 'vec4<f32>');
  model.UBO.addEntry('SheenRoughness', 'f32');
  // Diffuse Transmission
  model.UBO.addEntry('DiffuseTransmissionFactor', 'f32');
  model.UBO.addEntry('DiffuseTransmissionColor', 'vec4<f32>');
  // Dispersion
  model.UBO.addEntry('Dispersion', 'f32');
  // KHR_materials_specular
  model.UBO.addEntry('SpecularFactor', 'f32');
  model.UBO.addEntry('SpecularColorFactor', 'vec4<f32>');
  // Negative-determinant flag: flips frontFacing interpretation in the
  // fragment shader so normals and material properties are correct when
  // the model matrix contains an odd number of reflections (negative scale).
  model.UBO.addEntry('FlipFrontFacing', 'f32');
  // Debug channel selector (0 = normal rendering, see DebugChannel enum)
  model.UBO.addEntry('DebugChannel', 'u32');
  addClipPlaneEntries(model.UBO, 'ClipPlane');
  model.UBO.addEntry('NumClipPlanes', 'u32');

  // UV transform uniforms for KHR_texture_transform animation support.
  // Each texture type gets RS (rotation+scale) and Off (offset) as vec4.
  for (let i = 0; i < UV_TRANSFORM_KEYS.length; i++) {
    model.UBO.addEntry(`UVT_${UV_TRANSFORM_KEYS[i]}_RS`, 'vec4<f32>');
    model.UBO.addEntry(`UVT_${UV_TRANSFORM_KEYS[i]}_Off`, 'vec4<f32>');
  }
  model.uvTransformKeys = UV_TRANSFORM_KEYS;

  // Build VTK API
  macro.setGet(publicAPI, model, [
    'cellArray',
    'currentInput',
    'cellOffset',
    'is2D',
    'primitiveType',
    'renderEncoder',
  ]);

  model.textures = [];
  model.clipPlanes = Array.from({ length: MAX_CLIPPING_PLANES }, () => [
    0.0, 0.0, 0.0, 0.0,
  ]);

  // Object methods
  vtkWebGPUCellArrayMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkWebGPUCellArrayMapper'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
