import macro from 'vtk.js/Sources/macros';
import vtkArmature from 'vtk.js/Sources/Common/DataModel/Armature';
import vtkAnimationTrack from 'vtk.js/Sources/Common/DataModel/AnimationTrack';
import vtkAnimationClip from 'vtk.js/Sources/Common/DataModel/AnimationClip';
import {
  InterpolationMode,
  TrackType,
} from 'vtk.js/Sources/Common/DataModel/AnimationTrack/Constants';
import { mat4, quat, vec3 } from 'gl-matrix';

const { vtkWarningMacro, vtkDebugMacro } = macro;

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
  const scale = node.scale ? vec3.fromValues(...node.scale) : vec3.fromValues(1, 1, 1);
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

function getRootJointNode(rootIndices, jointNodes) {
  const rootBoneIndex = rootIndices[0];
  if (rootBoneIndex === undefined) {
    return null;
  }
  return jointNodes[rootBoneIndex];
}

/**
 * Animation Parser - Converts resolved glTF 2.0 tree to vtk.js skeletal animation objects
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

// ---------------------------------------------------------------------------
// Create vtkArmature from resolved glTF skin
// ---------------------------------------------------------------------------

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
      continue;
    }

    const boneData = createBoneData(node, i, allNodes);

    // Set inverse bind matrix from resolved accessor
    if (gltfSkin.inverseBindMatrices && gltfSkin.inverseBindMatrices.value) {
      const ibmData = gltfSkin.inverseBindMatrices.value;
      const offset = i * 16;
      boneData.inverseBindMatrix = mat4.clone(
        ibmData.subarray(offset, offset + 16)
      );
    }

    skeleton.addBone(boneData);
    nodeToJointIndex.set(node, i);
  }

  // Set parent indices by checking node children relationships
  for (let i = 0; i < jointNodes.length; i++) {
    const node = jointNodes[i];
    if (node.children) {
      for (const child of node.children) {
        const childBoneIdx = nodeToJointIndex.get(child);
        if (childBoneIdx !== undefined) {
          skeleton.setParentIndex(childBoneIdx, i);
        }
      }
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

  const rootJointNode = getRootJointNode(rootIndices, jointNodes);
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

// ---------------------------------------------------------------------------
// Create vtkAnimationClip from resolved glTF animation
// ---------------------------------------------------------------------------

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
  for (const channel of gltfAnim.channels) {
    const sampler = gltfAnim.samplers[channel.sampler];
    if (!sampler) continue;

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
      continue;
    }

    const boneIdx = nodeIndexToBone.get(nodeIdx);
    if (boneIdx === undefined) {
      // Node not in this skeleton, skip
      continue;
    }

    // sampler.input and sampler.output are already TypedArrays
    const times = sampler.input;
    const values = sampler.output;

    if (!times || !values) {
      vtkWarningMacro('Missing sampler data for animation channel');
      continue;
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
  }

  return clip;
}

// ---------------------------------------------------------------------------
// Main entry point: parse all skeletal animation data from resolved tree
// ---------------------------------------------------------------------------

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

  // Parse skins → skeletons
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

    // Build cross skeleton parent relationships.
    // When a skeleton's root bone is a child of a bone in another skeleton,
    // record { parentSkeletonIdx, parentBoneIdx } so root transforms can be
    // updated each frame from the parent skeleton's animated world matrices.
    const nodeIdxToBone = new Map(); // nodeIndex → { skelIdx, boneIdx }
    for (let si = 0; si < result.skeletons.length; si++) {
      const skel = result.skeletons[si].skeleton;
      for (let bi = 0; bi < skel.getNumberOfBones(); bi++) {
        nodeIdxToBone.set(skel.getBone(bi).nodeId, {
          skelIdx: si,
          boneIdx: bi,
        });
      }
    }
    // Build node parent map
    const parentNodeMap = new Map(); // nodeIndex → parentNodeIndex
    for (let i = 0; i < allNodes.length; i++) {
      if (allNodes[i].children) {
        for (const child of allNodes[i].children) {
          const childIdx = allNodes.indexOf(child);
          if (childIdx >= 0) parentNodeMap.set(childIdx, i);
        }
      }
    }
    for (let si = 0; si < result.skeletons.length; si++) {
      const skel = result.skeletons[si].skeleton;
      const rootIndices = skel.getRootBoneIndices();
      if (rootIndices.length === 0) continue;

      const rootBone = skel.getBone(rootIndices[0]);
      const rootNodeIdx = rootBone.nodeId;
      let parentNodeIdx = parentNodeMap.get(rootNodeIdx);

      // Walk up the hierarchy past non joint ancestors
      while (parentNodeIdx !== undefined) {
        const parentBone = nodeIdxToBone.get(parentNodeIdx);
        if (parentBone && parentBone.skelIdx !== si) {
          // Found parent bone in another skeleton
          result.skeletons[si].parentSkeletonIdx = parentBone.skelIdx;
          result.skeletons[si].parentBoneIdx = parentBone.boneIdx;
          break;
        }
        parentNodeIdx = parentNodeMap.get(parentNodeIdx);
      }
    }

    // Recompute rest pose world/skinning matrices in topological order
    // (parents before children) so root transforms include parent bone chains.
    const processed = new Set();
    function recomputeRestPose(si) {
      if (processed.has(si)) return;
      const entry = result.skeletons[si];
      // Process parent first
      if (entry.parentSkeletonIdx !== undefined) {
        recomputeRestPose(entry.parentSkeletonIdx);
        // Set root transform from parent skeleton's bone world matrix
        const parentSkel = result.skeletons[entry.parentSkeletonIdx].skeleton;
        const parentBoneWorld = parentSkel.getWorldMatrix(entry.parentBoneIdx);
        entry.skeleton.setRootTransform(mat4.clone(parentBoneWorld));
      }
      const skel = entry.skeleton;
      skel.computeWorldMatrices();
      skel.computeSkinningMatrices();
      processed.add(si);
    }
    for (let si = 0; si < result.skeletons.length; si++) {
      recomputeRestPose(si);
    }
  }

  // Parse animations → per skeleton clips
  // Each skeleton has its own joints (different nodes), so each needs its own
  // clip with tracks mapped to its own bone indices.
  if (
    tree.animations &&
    tree.animations.length > 0 &&
    result.skeletons.length > 0
  ) {
    for (const gltfAnim of tree.animations) {
      for (const entry of result.skeletons) {
        const clip = createAnimationClipFromGLTFAnimation(
          gltfAnim,
          entry.skeleton,
          allNodes
        );
        if (clip && clip.getNumberOfTracks() > 0) {
          if (!entry.clips) entry.clips = [];
          entry.clips.push(clip);

          // Primary skeleton's clips go to the shared animationClips array
          if (entry === result.skeletons[0]) {
            result.animationClips.push(clip);
          }
        }
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Node Transform Animations (non skeletal)
// For animations that target node TRS directly (e.g., door opening)
// ---------------------------------------------------------------------------

/**
 * Interpolates between keyframes using linear or step interpolation.
 * @param {Float32Array} times - Keyframe times
 * @param {Float32Array} values - Keyframe values (packed)
 * @param {number} t - Current time
 * @param {number} components - Number of components per value (3 for vec3, 4 for quat)
 * @param {string} interpolation - 'LINEAR', 'STEP', or 'CUBICSPLINE'
 * @param {boolean} isRotation - Whether this is a rotation (quaternion slerp)
 * @returns {Float32Array} Interpolated value
 */
function interpolateKeyframes(
  times,
  values,
  t,
  components,
  interpolation,
  isRotation = false
) {
  const result = new Float32Array(components);

  if (times.length === 0) return result;

  // Clamp to range
  // For CUBICSPLINE, values are packed as [inTangent, value, outTangent] per keyframe
  const isCubic = interpolation === 'CUBICSPLINE';
  const stride = isCubic ? 3 * components : components;
  const valueOffset = isCubic ? components : 0; // skip inTangent for the value

  if (t <= times[0]) {
    const off = valueOffset;
    for (let i = 0; i < components; i++) result[i] = values[off + i];
    return result;
  }
  if (t >= times[times.length - 1]) {
    const off = (times.length - 1) * stride + valueOffset;
    for (let i = 0; i < components; i++) result[i] = values[off + i];
    return result;
  }

  // Find surrounding keyframes
  let k = 0;
  for (k = 0; k < times.length - 1; k++) {
    if (t < times[k + 1]) break;
  }

  if (interpolation === 'STEP') {
    const offset = k * components;
    for (let i = 0; i < components; i++) result[i] = values[offset + i];
    return result;
  }

  const t0 = times[k];
  const t1 = times[k + 1];
  const alpha = (t - t0) / (t1 - t0);

  if (interpolation === 'CUBICSPLINE') {
    // glTF CUBICSPLINE stores 3 values per keyframe: [in tangent, value, out tangent] per keyframe
    const off0 = k * stride;
    const off1 = (k + 1) * stride;
    const dt = t1 - t0;
    const alpha2 = alpha * alpha;
    const alpha3 = alpha2 * alpha;

    for (let i = 0; i < components; i++) {
      const p0 = values[off0 + components + i]; // value at k
      const m0 = values[off0 + 2 * components + i]; // out tangent at k
      const p1 = values[off1 + components + i]; // value at k+1
      const m1 = values[off1 + i]; // in tangent at k+1
      result[i] =
        (2 * alpha3 - 3 * alpha2 + 1) * p0 +
        (alpha3 - 2 * alpha2 + alpha) * dt * m0 +
        (-2 * alpha3 + 3 * alpha2) * p1 +
        (alpha3 - alpha2) * dt * m1;
    }

    if (isRotation && components === 4) {
      quat.normalize(result, result);
    }

    return result;
  }

  // Linear interpolation
  const offset0 = k * components;
  const offset1 = (k + 1) * components;

  if (isRotation && components === 4) {
    // Quaternion slerp
    const q0 = values.subarray(offset0, offset0 + 4);
    const q1 = values.subarray(offset1, offset1 + 4);
    quat.slerp(result, q0, q1, alpha);
  } else {
    // Linear lerp for vec3
    for (let i = 0; i < components; i++) {
      result[i] =
        values[offset0 + i] * (1 - alpha) + values[offset1 + i] * alpha;
    }
  }

  return result;
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

  const allNodes = tree.nodes || [];

  for (const gltfAnim of tree.animations) {
    if (!gltfAnim.channels || !gltfAnim.samplers) continue;

    const channels = [];
    let duration = 0;

    for (const channel of gltfAnim.channels) {
      const sampler = gltfAnim.samplers[channel.sampler];
      if (!sampler) continue;

      const nodeIdx = channel.target.node;
      const path = channel.target.path;

      if (
        path !== 'translation' &&
        path !== 'rotation' &&
        path !== 'scale' &&
        path !== 'weights'
      ) {
        continue;
      }

      const times = sampler.input;
      const values = sampler.output;
      if (!times || !values) continue;

      const maxTime = times[times.length - 1];
      if (maxTime > duration) duration = maxTime;

      let components;
      if (path === 'rotation') {
        components = 4;
      } else if (path === 'weights') {
        // Number of morph targets = total values / number of keyframes
        components = values.length / times.length;
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
      });
    }

    if (channels.length === 0) continue;

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

        for (const ch of channels) {
          if (!nodeUpdates.has(ch.nodeIndex)) {
            nodeUpdates.set(ch.nodeIndex, {});
          }
          const update = nodeUpdates.get(ch.nodeIndex);
          update[ch.path] = interpolateKeyframes(
            ch.times,
            ch.values,
            loopedT,
            ch.components,
            ch.interpolation,
            ch.path === 'rotation'
          );
        }

        return nodeUpdates;
      },
    };

    result.push(nodeAnim);
  }

  return result;
}

// ---------------------------------------------------------------------------
// KHR_animation_pointer: animates material/texture properties via JSON pointers
// ---------------------------------------------------------------------------

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

  for (const gltfAnim of tree.animations) {
    if (!gltfAnim.channels || !gltfAnim.samplers) continue;

    const channels = [];
    let duration = 0;

    for (const channel of gltfAnim.channels) {
      if (channel.target.path !== 'pointer') continue;

      const ext = channel.target.extensions?.KHR_animation_pointer;
      if (!ext || !ext.pointer) continue;

      const parsed = parseTextureTransformPointer(ext.pointer);
      if (!parsed) continue;

      const sampler = gltfAnim.samplers[channel.sampler];
      if (!sampler) continue;

      const times = sampler.input;
      const values = sampler.output;
      if (!times || !values) continue;

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
      });
    }

    if (channels.length === 0) continue;

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

        for (const ch of channels) {
          const key = `mat_${ch.materialIndex}`;
          if (!materialUpdates.has(key)) {
            materialUpdates.set(key, { textureTransforms: new Map() });
          }
          const matUpdate = materialUpdates.get(key);

          if (!matUpdate.textureTransforms.has(ch.textureKey)) {
            matUpdate.textureTransforms.set(ch.textureKey, {});
          }
          const texTransform = matUpdate.textureTransforms.get(ch.textureKey);

          const val = interpolateKeyframes(
            ch.times,
            ch.values,
            loopedT,
            ch.components,
            ch.interpolation,
            false
          );

          if (ch.transformProperty === 'offset') {
            texTransform.offset = [val[0], val[1]];
          } else if (ch.transformProperty === 'scale') {
            texTransform.scale = [val[0], val[1]];
          } else if (ch.transformProperty === 'rotation') {
            texTransform.rotation = val[0];
          }
        }

        return materialUpdates;
      },
    };

    result.push(pointerAnim);
  }

  return result;
}

export default {
  createSkeletonFromGLTFSkin,
  createAnimationClipFromGLTFAnimation,
  parseSkeletalAnimationFromGLTF,
  parseNodeAnimationsFromGLTF,
  parsePointerAnimationsFromGLTF,
};
