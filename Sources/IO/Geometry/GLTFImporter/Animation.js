import macro from 'vtk.js/Sources/macros';
import vtkArmature from 'vtk.js/Sources/Common/DataModel/Armature';
import vtkAnimationTrack from 'vtk.js/Sources/Common/DataModel/AnimationTrack';
import vtkAnimationClip from 'vtk.js/Sources/Common/DataModel/AnimationClip';
import {
  InterpolationMode,
  TrackType,
} from 'vtk.js/Sources/Common/DataModel/AnimationTrack/Constants';
import {
  findKeyframeInterval,
  hermite,
} from 'vtk.js/Sources/Common/DataModel/AnimationTrack/Interpolation';
import { mat4, quat, vec3 } from 'gl-matrix';

const { vtkWarningMacro } = macro;

function getNodeTRS(node) {
  if (node.matrix) {
    const m = mat4.clone(node.matrix);
    const translation = vec3.create();
    const rotation = quat.create();
    const scale = vec3.create();
    mat4.getTranslation(translation, m);
    mat4.getRotation(rotation, m);
    mat4.getScaling(scale, m);
    return { translation, rotation, scale };
  }

  const translation = node.translation
    ? vec3.fromValues(...node.translation)
    : vec3.create();
  const rotation = node.rotation
    ? quat.fromValues(
        node.rotation[0],
        node.rotation[1],
        node.rotation[2],
        node.rotation[3]
      )
    : quat.create();
  const scale = node.scale
    ? vec3.fromValues(...node.scale)
    : vec3.fromValues(1, 1, 1);
  return { translation, rotation, scale };
}

function getNodeLocalMatrix(node) {
  if (node.matrix) {
    return mat4.clone(node.matrix);
  }

  const translation = node.translation ?? [0, 0, 0];
  const rotation = node.rotation ?? [0, 0, 0, 1];
  const scale = node.scale ?? [1, 1, 1];
  return mat4.fromRotationTranslationScale(
    mat4.create(),
    quat.fromValues(rotation[0], rotation[1], rotation[2], rotation[3]),
    vec3.fromValues(translation[0], translation[1], translation[2]),
    vec3.fromValues(scale[0], scale[1], scale[2])
  );
}

function createBoneData(node, boneIndex, allNodes) {
  const { translation, rotation, scale } = getNodeTRS(node);
  return {
    name: node.name || node.id || `bone_${boneIndex}`,
    localRestTranslation: translation,
    localRestRotation: rotation,
    localRestScale: scale,
    nodeId: allNodes.indexOf(node),
  };
}

/**
 * Animation Parser - Converts resolved glTF 2.0 tree to VTK.js skeletal animation objects
 *
 * Works with the **resolved** tree produced by GLTFParser.parse():
 * - skins[].joints is an array of node objects (not indices)
 * - skins[].inverseBindMatrices is a resolved accessor object with .value
 * - animations[].samplers[].input/output are TypedArrays (already .value)
 * - animations[].channels[].target.node is a raw integer index
 *
 * Architecture:
 * ```
 * Resolved glTF Tree
 *   ├─ skins[] → createSkeletonFromGLTFSkin() → vtkArmature
 *   │   ├─ joints[] (node objects) → bone data objects
 *   │   └─ inverseBindMatrices.value → boneData.inverseBindMatrix
 *   │
 *   └─ animations[] → createAnimationClipFromGLTFAnimation() → vtkAnimationClip
 *       ├─ samplers[].input (Float32Array) → keyframe times
 *       ├─ samplers[].output (Float32Array) → keyframe values
 *       └─ channels[].target.node (int) → bone index mapping
 * ```
 */

/**
 * Converts a resolved glTF skin to a vtkArmature with bone hierarchy.
 *
 * @param {Object} gltfSkin - Resolved glTF skin (joints are node objects)
 * @param {Object[]} allNodes - The full resolved nodes array (tree.nodes)
 * @returns {vtkArmature|null}
 */
export function createSkeletonFromGLTFSkin(gltfSkin, allNodes) {
  if (!gltfSkin || !gltfSkin.joints || gltfSkin.joints.length === 0) {
    vtkWarningMacro('glTF skin has no joints');
    return null;
  }

  const skeleton = vtkArmature.newInstance();
  const jointNodes = gltfSkin.joints; // Already resolved node objects
  const nodeToJointIndex = new Map(); // node object → bone index
  const parentNodeMap = new Map(); // node object → parent node object

  for (let nodeIndex = 0; nodeIndex < allNodes.length; nodeIndex++) {
    const node = allNodes[nodeIndex];
    if (node.children) {
      for (
        let childIndex = 0;
        childIndex < node.children.length;
        childIndex++
      ) {
        const child = node.children[childIndex];
        parentNodeMap.set(child, node);
      }
    }
  }

  // Create bones for each joint node
  for (let i = 0; i < jointNodes.length; i++) {
    const node = jointNodes[i];
    if (!node) {
      vtkWarningMacro(`Null joint node at index ${i}`);
    } else {
      const boneData = createBoneData(node, i, allNodes);

      // Set inverse bind matrix from resolved accessor
      if (gltfSkin.inverseBindMatrices && gltfSkin.inverseBindMatrices.value) {
        const ibmData = gltfSkin.inverseBindMatrices.value;
        const offset = i * 16;
        boneData.inverseBindMatrix = mat4.clone(
          ibmData.subarray(offset, offset + 16)
        );
      }

      // addBone returns the actual bone index, which can differ from the
      // joint loop index when a joint node was null and skipped above. The
      // inverse bind matrix is still keyed by the joint index i, since the
      // glTF accessor stores one matrix per joint in joints order.
      const boneIndex = skeleton.addBone(boneData);
      nodeToJointIndex.set(node, boneIndex);
    }
  }

  // Set parent indices by checking node children relationships. Both parent
  // and child are resolved through nodeToJointIndex so the bone indices stay
  // correct even when some joint nodes were skipped.
  for (let i = 0; i < jointNodes.length; i++) {
    const node = jointNodes[i];
    const parentBoneIdx = node ? nodeToJointIndex.get(node) : undefined;
    if (node && node.children && parentBoneIdx !== undefined) {
      node.children.forEach((child) => {
        const childBoneIdx = nodeToJointIndex.get(child);
        if (childBoneIdx !== undefined) {
          skeleton.setParentIndex(childBoneIdx, parentBoneIdx);
        }
      });
    }
  }

  // Recompute root bone indices (bones with parentIndex === -1)
  // Done automatically by addBone, but parent assignment above changes things
  // Let skeleton recalculate
  const rootIndices = [];
  for (let i = 0; i < skeleton.getNumberOfBones(); i++) {
    if (skeleton.getBone(i).parentIndex === -1) {
      rootIndices.push(i);
    }
  }

  // Resolve the root joint node through the root bone's nodeId so it stays
  // correct regardless of how joint indices map onto bone indices.
  const rootBoneIndex = rootIndices[0];
  const rootJointNode =
    rootBoneIndex === undefined
      ? null
      : allNodes[skeleton.getBone(rootBoneIndex).nodeId];
  if (rootJointNode) {
    const chain = [];
    let parentNode = parentNodeMap.get(rootJointNode);
    while (parentNode) {
      chain.unshift(parentNode);
      parentNode = parentNodeMap.get(parentNode);
    }

    if (chain.length > 0) {
      const rootTransform = mat4.create();
      for (let i = 0; i < chain.length; i++) {
        const node = chain[i];
        mat4.multiply(rootTransform, rootTransform, getNodeLocalMatrix(node));
      }
      skeleton.setRootTransform(rootTransform);
    }
  }

  return skeleton;
}

/**
 * Converts a resolved glTF animation to a vtkAnimationClip.
 *
 * @param {Object} gltfAnim - Resolved animation (samplers have TypedArray input/output)
 * @param {vtkArmature} skeleton - Target skeleton
 * @param {Object[]} allNodes - The full resolved nodes array for node index lookup
 * @returns {vtkAnimationClip|null}
 */
export function createAnimationClipFromGLTFAnimation(
  gltfAnim,
  skeleton,
  allNodes
) {
  if (!gltfAnim || !gltfAnim.channels || !gltfAnim.samplers) {
    return null;
  }

  const clip = vtkAnimationClip.newInstance({
    name: gltfAnim.name || gltfAnim.id || 'animation',
  });

  // Build node index → bone index map
  const nodeIndexToBone = new Map();
  for (let i = 0; i < skeleton.getNumberOfBones(); i++) {
    const bone = skeleton.getBone(i);
    nodeIndexToBone.set(bone.nodeId, i);
  }

  // Process each animation channel
  gltfAnim.channels.forEach((channel) => {
    const sampler = gltfAnim.samplers[channel.sampler];
    if (!sampler) {
      return;
    }

    const nodeIdx = channel.target.node; // Raw integer index
    const path = channel.target.path;

    let trackType;
    if (path === 'translation') {
      trackType = TrackType.TRANSLATION;
    } else if (path === 'rotation') {
      trackType = TrackType.ROTATION;
    } else if (path === 'scale') {
      trackType = TrackType.SCALE;
    } else {
      // Skip unsupported paths (weights/morph targets)
      return;
    }

    const boneIdx = nodeIndexToBone.get(nodeIdx);
    if (boneIdx === undefined) {
      // Node not in this skeleton, skip
      return;
    }

    // sampler.input and sampler.output are already TypedArrays
    const times = sampler.input;
    const values = sampler.output;

    if (!times || !values) {
      vtkWarningMacro('Missing sampler data for animation channel');
      return;
    }

    // Determine interpolation mode
    let interpolationMode;
    if (sampler.interpolation === 'STEP') {
      interpolationMode = InterpolationMode.STEP;
    } else if (sampler.interpolation === 'CUBICSPLINE') {
      interpolationMode = InterpolationMode.CUBIC;
    } else {
      interpolationMode = InterpolationMode.LINEAR;
    }

    // Create track
    const track = vtkAnimationTrack.newInstance({
      name: `${path}_bone${boneIdx}`,
      boneIndex: boneIdx,
      trackType,
      interpolationMode,
    });

    // Component count: quat=4, vec3=3
    const componentCount = trackType === TrackType.ROTATION ? 4 : 3;

    // Add keyframes
    // CUBICSPLINE stores [inTangent, value, outTangent] per keyframe (3× components)
    const isCubic = sampler.interpolation === 'CUBICSPLINE';
    const stride = isCubic ? 3 * componentCount : componentCount;
    for (let i = 0; i < times.length; i++) {
      if (isCubic) {
        const base = i * stride;
        const inTangent = values.slice(base, base + componentCount);
        const value = values.slice(
          base + componentCount,
          base + 2 * componentCount
        );
        const outTangent = values.slice(
          base + 2 * componentCount,
          base + 3 * componentCount
        );
        track.addKeyframe(times[i], new Float32Array(value), {
          inTangent: new Float32Array(inTangent),
          outTangent: new Float32Array(outTangent),
        });
      } else {
        const value = values.slice(
          i * componentCount,
          (i + 1) * componentCount
        );
        track.addKeyframe(times[i], new Float32Array(value));
      }
    }

    clip.addTrack(track);
  });

  return clip;
}

/**
 * Parses all skeletal animation data from the resolved glTF tree.
 *
 * @param {Object} tree - Resolved glTF tree (output of GLTFParser.parse())
 * @returns {Object} { skeletons, animationClips }
 */
export function parseSkeletalAnimationFromGLTF(tree) {
  const result = {
    skeletons: [],
    animationClips: [],
  };

  if (!tree) return result;

  const allNodes = tree.nodes || [];

  // Parse skins → skeletons (for debug/armature visualization only;
  // runtime skinning is node driven via world matrices + inverse bind matrices)
  if (tree.skins && tree.skins.length > 0) {
    for (let si = 0; si < tree.skins.length; si++) {
      const gltfSkin = tree.skins[si];
      const skeleton = createSkeletonFromGLTFSkin(gltfSkin, allNodes);
      if (skeleton) {
        // Initialize local matrices from bone rest transforms
        const localMatrices = skeleton.getLocalMatrices();
        for (let i = 0; i < skeleton.getNumberOfBones(); i++) {
          const m = skeleton.getLocalRestMatrix(i);
          for (let j = 0; j < 16; j++) {
            localMatrices[i * 16 + j] = m[j];
          }
        }

        // Compute world and skinning matrices for initial pose
        skeleton.computeWorldMatrices();
        skeleton.computeSkinningMatrices();

        result.skeletons.push({ skeleton, gltfSkin, gltfSkinIndex: si });
      }
    }
  }

  // Parse animations → per skeleton clips (kept for backward compat / debug)
  if (
    tree.animations &&
    tree.animations.length > 0 &&
    result.skeletons.length > 0
  ) {
    tree.animations.forEach((gltfAnim) => {
      result.skeletons.forEach((entry) => {
        const clip = createAnimationClipFromGLTFAnimation(
          gltfAnim,
          entry.skeleton,
          allNodes
        );
        if (clip && clip.getNumberOfTracks() > 0) {
          if (!entry.clips) entry.clips = [];
          entry.clips.push(clip);

          if (entry === result.skeletons[0]) {
            result.animationClips.push(clip);
          }
        }
      });
    });
  }

  return result;
}

/**
 * Interpolates between keyframes using step, linear or cubic spline modes.
 * Delegates the interval search and the Hermite evaluation to the shared
 * helpers in AnimationTrack/Interpolation so the math lives in one place.
 *
 * @param {Float32Array} times - Keyframe times
 * @param {Float32Array} values - Keyframe values (packed)
 * @param {number} t - Current time
 * @param {number} components - Number of components per value (3 for vec3, 4 for quat)
 * @param {string} interpolation - 'LINEAR', 'STEP', or 'CUBICSPLINE'
 * @param {boolean} isRotation - Whether this is a rotation (quaternion slerp)
 * @param {number} hint - Last resolved interval, used to keep monotonic playback O(1)
 * @returns {{ value: Float32Array, index: number }} Interpolated value and the
 *   resolved interval index, which the caller can feed back as the next hint.
 */
function interpolateKeyframes(
  times,
  values,
  t,
  components,
  interpolation,
  isRotation = false,
  hint = 0
) {
  const value = new Float32Array(components);
  const count = times.length;

  if (count === 0) {
    return { value, index: 0 };
  }

  // For CUBICSPLINE, values are packed as [in tangent, value, out tangent] per
  // keyframe, so the stride is tripled and the value block is offset past the
  // leading in tangent.
  const isCubic = interpolation === 'CUBICSPLINE';
  const stride = isCubic ? 3 * components : components;
  const valueOffset = isCubic ? components : 0;

  // Clamp to range. The caller loops time, so both ends can occur.
  if (t <= times[0]) {
    for (let i = 0; i < components; i++) value[i] = values[valueOffset + i];
    return { value, index: 0 };
  }
  if (t >= times[count - 1]) {
    const off = (count - 1) * stride + valueOffset;
    for (let i = 0; i < components; i++) value[i] = values[off + i];
    return { value, index: Math.max(0, count - 2) };
  }

  const k = findKeyframeInterval(times, t, hint);

  if (interpolation === 'STEP') {
    const off = k * stride + valueOffset;
    for (let i = 0; i < components; i++) value[i] = values[off + i];
    return { value, index: k };
  }

  const t0 = times[k];
  const t1 = times[k + 1];
  const dt = t1 - t0;
  if (dt <= 0) {
    const off = k * stride + valueOffset;
    for (let i = 0; i < components; i++) value[i] = values[off + i];
    if (isRotation && components === 4) {
      quat.normalize(value, value);
    }
    return { value, index: k };
  }
  const alpha = (t - t0) / dt;

  if (isCubic) {
    const off0 = k * stride;
    const off1 = (k + 1) * stride;
    for (let i = 0; i < components; i++) {
      const p0 = values[off0 + components + i]; // value at k
      const m0 = values[off0 + 2 * components + i]; // out tangent at k
      const p1 = values[off1 + components + i]; // value at k+1
      const m1 = values[off1 + i]; // in tangent at k+1
      value[i] = hermite(p0, p1, m0, m1, alpha, dt);
    }
    if (isRotation && components === 4) {
      quat.normalize(value, value);
    }
    return { value, index: k };
  }

  // Linear interpolation
  const off0 = k * components;
  const off1 = (k + 1) * components;
  if (isRotation && components === 4) {
    // Quaternion slerp
    const q0 = values.subarray(off0, off0 + 4);
    const q1 = values.subarray(off1, off1 + 4);
    quat.slerp(value, q0, q1, alpha);
  } else {
    // Linear lerp for vec3
    for (let i = 0; i < components; i++) {
      value[i] = values[off0 + i] * (1 - alpha) + values[off1 + i] * alpha;
    }
  }

  return { value, index: k };
}

/**
 * Parses node transform animations from the resolved glTF tree.
 * These are animations that target node TRS properties directly (no skeleton).
 *
 * @param {Object} tree - Resolved glTF tree
 * @returns {Array} Array of node animation objects with evaluate(time) method
 */
export function parseNodeAnimationsFromGLTF(tree) {
  const result = [];

  if (!tree || !tree.animations) return result;

  tree.animations.forEach((gltfAnim) => {
    if (!gltfAnim.channels || !gltfAnim.samplers) {
      return;
    }

    const channels = [];
    let duration = 0;

    gltfAnim.channels.forEach((channel) => {
      const sampler = gltfAnim.samplers[channel.sampler];
      if (!sampler) {
        return;
      }

      const nodeIdx = channel.target.node;
      const path = channel.target.path;

      if (
        path !== 'translation' &&
        path !== 'rotation' &&
        path !== 'scale' &&
        path !== 'weights'
      ) {
        return;
      }

      const times = sampler.input;
      const values = sampler.output;
      if (!times || !values) {
        return;
      }

      const maxTime = times[times.length - 1];
      if (maxTime > duration) duration = maxTime;

      let components;
      if (path === 'rotation') {
        components = 4;
      } else if (path === 'weights') {
        // Number of morph targets = values per keyframe. CUBICSPLINE packs an
        // in tangent, the value and an out tangent per keyframe, so divide the
        // per keyframe count by 3 to recover the real morph target count.
        const perKeyframe = values.length / times.length;
        components =
          sampler.interpolation === 'CUBICSPLINE'
            ? perKeyframe / 3
            : perKeyframe;
      } else {
        components = 3;
      }

      channels.push({
        nodeIndex: nodeIdx,
        path,
        times,
        values,
        interpolation: sampler.interpolation || 'LINEAR',
        components,
        hint: 0,
      });
    });

    if (channels.length === 0) {
      return;
    }

    const nodeAnim = {
      name: gltfAnim.name || gltfAnim.id || `node_animation_${result.length}`,
      duration,
      channels,

      /**
       * Evaluate animation at given time.
       * Returns map of nodeIndex → { translation, rotation, scale } with only animated properties.
       */
      evaluate(t) {
        const loopedT = duration > 0 ? t % duration : 0;
        const nodeUpdates = new Map();

        channels.forEach((ch) => {
          if (!nodeUpdates.has(ch.nodeIndex)) {
            nodeUpdates.set(ch.nodeIndex, {});
          }
          const update = nodeUpdates.get(ch.nodeIndex);
          const { value, index } = interpolateKeyframes(
            ch.times,
            ch.values,
            loopedT,
            ch.components,
            ch.interpolation,
            ch.path === 'rotation',
            ch.hint
          );
          ch.hint = index;
          update[ch.path] = value;
        });

        return nodeUpdates;
      },
    };

    result.push(nodeAnim);
  });

  return result;
}

/**
 * Parses a KHR_animation_pointer JSON pointer targeting a texture transform.
 * Expected format: /materials/{idx}/.../extensions/KHR_texture_transform/{prop}
 *
 * @param {string} pointer - The JSON pointer string
 * @returns {{ materialIndex: number, textureKey: string, property: string } | null}
 */
function parseTextureTransformPointer(pointer) {
  const parts = pointer.split('/').filter((p) => p.length > 0);

  // Must start with "materials"
  if (parts[0] !== 'materials') return null;

  const materialIndex = parseInt(parts[1], 10);
  if (Number.isNaN(materialIndex)) return null;

  // Find "KHR_texture_transform" in the path
  const kttIdx = parts.indexOf('KHR_texture_transform');
  if (kttIdx === -1 || kttIdx >= parts.length - 1) return null;

  const property = parts[kttIdx + 1]; // "offset", "scale", or "rotation"
  if (
    property !== 'offset' &&
    property !== 'scale' &&
    property !== 'rotation'
  ) {
    return null;
  }

  // glTF texture slot name is the segment before "extensions/KHR_texture_transform"
  const gltfTextureSlot = parts[kttIdx - 2];

  // Map glTF texture slot names to the renderer's property keys
  const TEXTURE_KEY_MAP = {
    baseColorTexture: 'diffuse',
    metallicRoughnessTexture: 'rm',
    occlusionTexture: 'ao',
    emissiveTexture: 'emission',
    normalTexture: 'normal',
    specularTexture: 'specular',
    specularColorTexture: 'specularColor',
    sheenColorTexture: 'sheenColor',
    sheenRoughnessTexture: 'sheenRoughness',
    iridescenceTexture: 'iridescence',
    iridescenceThicknessTexture: 'iridescenceThickness',
    clearcoatTexture: 'coat',
    clearcoatRoughnessTexture: 'coatRoughness',
    clearcoatNormalTexture: 'coatNormal',
    transmissionTexture: 'transmission',
    thicknessTexture: 'thickness',
    anisotropyTexture: 'anisotropy',
    diffuseTransmissionTexture: 'diffuseTransmission',
    diffuseTransmissionColorTexture: 'diffuseTransmissionColor',
  };

  const textureKey = TEXTURE_KEY_MAP[gltfTextureSlot] || gltfTextureSlot;

  return { materialIndex, textureKey, property };
}

/**
 * Parses KHR_animation_pointer animations from the resolved glTF tree.
 * Currently supports animating KHR_texture_transform properties
 * (offset, scale, rotation) on materials.
 *
 * @param {Object} tree - Resolved glTF tree
 * @returns {Array} Array of pointer animation objects with evaluate(time) method.
 *   Each evaluate() returns a Map of "mat_{materialIndex}" →
 *     { textureTransforms: Map of textureKey → { offset?, scale?, rotation? } }
 */
export function parsePointerAnimationsFromGLTF(tree) {
  const result = [];

  if (!tree || !tree.animations) return result;

  tree.animations.forEach((gltfAnim) => {
    if (!gltfAnim.channels || !gltfAnim.samplers) {
      return;
    }

    const channels = [];
    let duration = 0;

    gltfAnim.channels.forEach((channel) => {
      if (channel.target.path !== 'pointer') {
        return;
      }

      const ext = channel.target.extensions?.KHR_animation_pointer;
      if (!ext || !ext.pointer) {
        return;
      }

      const parsed = parseTextureTransformPointer(ext.pointer);
      if (!parsed) {
        return;
      }

      const sampler = gltfAnim.samplers[channel.sampler];
      if (!sampler) {
        return;
      }

      const times = sampler.input;
      const values = sampler.output;
      if (!times || !values) {
        return;
      }

      const maxTime = times[times.length - 1];
      if (maxTime > duration) duration = maxTime;

      // offset/scale = 2 components (vec2), rotation = 1 component (scalar)
      const components = parsed.property === 'rotation' ? 1 : 2;

      channels.push({
        materialIndex: parsed.materialIndex,
        textureKey: parsed.textureKey,
        transformProperty: parsed.property,
        times,
        values,
        interpolation: sampler.interpolation || 'LINEAR',
        components,
        hint: 0,
      });
    });

    if (channels.length === 0) {
      return;
    }

    const pointerAnim = {
      name:
        gltfAnim.name || gltfAnim.id || `pointer_animation_${result.length}`,
      duration,
      channels,

      /**
       * Evaluate pointer animation at given time.
       * Returns Map of "mat_{materialIndex}" →
       *   { textureTransforms: Map of textureKey → { offset?, scale?, rotation? } }
       */
      evaluate(t) {
        const loopedT = duration > 0 ? t % duration : 0;
        const materialUpdates = new Map();

        channels.forEach((ch) => {
          const key = `mat_${ch.materialIndex}`;
          if (!materialUpdates.has(key)) {
            materialUpdates.set(key, { textureTransforms: new Map() });
          }
          const matUpdate = materialUpdates.get(key);

          if (!matUpdate.textureTransforms.has(ch.textureKey)) {
            matUpdate.textureTransforms.set(ch.textureKey, {});
          }
          const texTransform = matUpdate.textureTransforms.get(ch.textureKey);

          const { value: val, index } = interpolateKeyframes(
            ch.times,
            ch.values,
            loopedT,
            ch.components,
            ch.interpolation,
            false,
            ch.hint
          );
          ch.hint = index;

          if (ch.transformProperty === 'offset') {
            texTransform.offset = [val[0], val[1]];
          } else if (ch.transformProperty === 'scale') {
            texTransform.scale = [val[0], val[1]];
          } else if (ch.transformProperty === 'rotation') {
            texTransform.rotation = val[0];
          }
        });

        return materialUpdates;
      },
    };

    result.push(pointerAnim);
  });

  return result;
}

export default {
  createSkeletonFromGLTFSkin,
  createAnimationClipFromGLTFAnimation,
  parseSkeletalAnimationFromGLTF,
  parseNodeAnimationsFromGLTF,
  parsePointerAnimationsFromGLTF,
};
