import macro from 'vtk.js/Sources/macros';
import { mat4, quat, vec3 } from 'gl-matrix';

const { vtkWarningMacro } = macro;

function ensureMatrices(model) {
  const needed = model.bones.length * 16;
  if (model.localMatrices.length === needed) return;

  const oldLen = model.localMatrices.length;
  const copyLen = Math.min(oldLen, needed);

  const newLocal = new Float32Array(needed);
  const newWorld = new Float32Array(needed);
  const newSkinning = new Float32Array(needed);

  if (copyLen > 0) {
    newLocal.set(model.localMatrices.subarray(0, copyLen));
    newWorld.set(model.worldMatrices.subarray(0, copyLen));
    newSkinning.set(model.skinningMatrices.subarray(0, copyLen));
  }

  // Initialize new slots to identity
  const oldBoneCount = oldLen / 16;
  for (let i = oldBoneCount; i < model.bones.length; i++) {
    const offset = i * 16;
    newLocal[offset] = 1;
    newLocal[offset + 5] = 1;
    newLocal[offset + 10] = 1;
    newLocal[offset + 15] = 1;

    newWorld[offset] = 1;
    newWorld[offset + 5] = 1;
    newWorld[offset + 10] = 1;
    newWorld[offset + 15] = 1;

    newSkinning[offset] = 1;
    newSkinning[offset + 5] = 1;
    newSkinning[offset + 10] = 1;
    newSkinning[offset + 15] = 1;
  }

  model.localMatrices = newLocal;
  model.worldMatrices = newWorld;
  model.skinningMatrices = newSkinning;
}

// ---------------------------------------------------------------------------
// vtkArmature methods
// ---------------------------------------------------------------------------

function vtkArmature(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkArmature');

  // -----------------------------------------------------------------------
  // Internal: normalize a plain bone-data object into a canonical shape
  // -----------------------------------------------------------------------
  function normalizeBoneData(boneData) {
    return {
      name: boneData.name || '',
      parentIndex:
        boneData.parentIndex !== undefined ? boneData.parentIndex : -1,
      inverseBindMatrix: boneData.inverseBindMatrix || mat4.create(),
      localRestTranslation:
        boneData.localRestTranslation || vec3.fromValues(0, 0, 0),
      localRestRotation:
        boneData.localRestRotation || quat.fromValues(0, 0, 0, 1),
      localRestScale: boneData.localRestScale || vec3.fromValues(1, 1, 1),
      nodeId: boneData.nodeId !== undefined ? boneData.nodeId : null,
    };
  }

  /**
   * Add a bone to the skeleton.
   * @param {object} boneData Plain object with bone properties.
   * @return {number} Index of added bone.
   */
  publicAPI.addBone = (boneData) => {
    const index = model.bones.length;
    const bone = normalizeBoneData(boneData);
    model.bones.push(bone);

    if (bone.name) {
      model.nameToIndex.set(bone.name, index);
    }

    if (bone.parentIndex === -1) {
      model.rootBoneIndices.push(index);
    }

    publicAPI.modified();
    return index;
  };

  /**
   * Insert a bone at a specific index.
   * @param {number} index
   * @param {object} boneData Plain object with bone properties.
   */
  publicAPI.insertBone = (index, boneData) => {
    if (index < 0 || index > model.bones.length) {
      vtkWarningMacro(
        `Invalid index ${index} for skeleton with ${model.bones.length} bones`
      );
      return;
    }

    const bone = normalizeBoneData(boneData);
    model.bones.splice(index, 0, bone);

    // Rebuild nameToIndex for shifted bones
    for (let i = index; i < model.bones.length; i++) {
      const n = model.bones[i].name;
      if (n) {
        model.nameToIndex.set(n, i);
      }
    }

    if (bone.parentIndex === -1) {
      model.rootBoneIndices.push(index);
    }

    // Shift matrix data to make room
    ensureMatrices(model);
    const boneCount = model.bones.length;
    for (let i = boneCount - 1; i > index; i--) {
      const dst = i * 16;
      const src = (i - 1) * 16;
      for (let j = 0; j < 16; j++) {
        model.localMatrices[dst + j] = model.localMatrices[src + j];
        model.worldMatrices[dst + j] = model.worldMatrices[src + j];
        model.skinningMatrices[dst + j] = model.skinningMatrices[src + j];
      }
    }
    // Initialize the inserted slot to identity
    const offset = index * 16;
    model.localMatrices.fill(0, offset, offset + 16);
    model.localMatrices[offset] = 1;
    model.localMatrices[offset + 5] = 1;
    model.localMatrices[offset + 10] = 1;
    model.localMatrices[offset + 15] = 1;

    model.worldMatrices.fill(0, offset, offset + 16);
    model.worldMatrices[offset] = 1;
    model.worldMatrices[offset + 5] = 1;
    model.worldMatrices[offset + 10] = 1;
    model.worldMatrices[offset + 15] = 1;

    model.skinningMatrices.fill(0, offset, offset + 16);
    model.skinningMatrices[offset] = 1;
    model.skinningMatrices[offset + 5] = 1;
    model.skinningMatrices[offset + 10] = 1;
    model.skinningMatrices[offset + 15] = 1;

    publicAPI.modified();
  };

  /**
   * Remove a bone at a specific index.
   * @param {number} index
   */
  publicAPI.removeBone = (index) => {
    if (index < 0 || index >= model.bones.length) {
      vtkWarningMacro(
        `Invalid index ${index} for skeleton with ${model.bones.length} bones`
      );
      return;
    }

    const bone = model.bones[index];
    if (bone.name) {
      model.nameToIndex.delete(bone.name);
    }

    model.bones.splice(index, 1);

    // Update root indices
    const rootIdx = model.rootBoneIndices.indexOf(index);
    if (rootIdx !== -1) {
      model.rootBoneIndices.splice(rootIdx, 1);
    }
    for (let i = 0; i < model.rootBoneIndices.length; i++) {
      if (model.rootBoneIndices[i] > index) {
        model.rootBoneIndices[i]--;
      }
    }

    // Shift matrix data to fill the gap
    ensureMatrices(model);
    const boneCount = model.bones.length;
    for (let i = index; i < boneCount; i++) {
      const dst = i * 16;
      const src = (i + 1) * 16;
      for (let j = 0; j < 16; j++) {
        model.localMatrices[dst + j] = model.localMatrices[src + j];
        model.worldMatrices[dst + j] = model.worldMatrices[src + j];
        model.skinningMatrices[dst + j] = model.skinningMatrices[src + j];
      }
    }

    publicAPI.modified();
  };

  /**
   * Get the number of bones
   * @return {number}
   */
  publicAPI.getNumberOfBones = () => model.bones.length;

  /**
   * Get a bone by index.
   * @param {number} index
   * @return {object} Plain bone data object.
   */
  publicAPI.getBone = (index) => model.bones[index];

  /**
   * Get all bones.
   * @return {object[]}
   */
  publicAPI.getBones = () => [...model.bones];

  /**
   * Get bone name by index.
   * @param {number} index
   * @return {string}
   */
  publicAPI.getBoneName = (index) => {
    if (index >= 0 && index < model.bones.length) {
      return model.bones[index].name;
    }
    return '';
  };

  /**
   * Get bone index by name.
   * @param {string} name
   * @return {number} Index or -1 if not found.
   */
  publicAPI.getBoneIndexByName = (name) =>
    model.nameToIndex.get(name) !== undefined
      ? model.nameToIndex.get(name)
      : -1;

  /**
   * Get parent index of a bone.
   * @param {number} index
   * @return {number}
   */
  publicAPI.getParentIndex = (index) => {
    if (index >= 0 && index < model.bones.length) {
      return model.bones[index].parentIndex;
    }
    return -1;
  };

  /**
   * Set the parent index for a bone and update rootBoneIndices accordingly.
   * @param {number} boneIndex
   * @param {number} parentIndex
   */
  publicAPI.setParentIndex = (boneIndex, parentIndex) => {
    if (boneIndex < 0 || boneIndex >= model.bones.length) return;
    const oldParent = model.bones[boneIndex].parentIndex;
    model.bones[boneIndex].parentIndex = parentIndex;

    // Update rootBoneIndices
    if (oldParent === -1 && parentIndex !== -1) {
      const idx = model.rootBoneIndices.indexOf(boneIndex);
      if (idx !== -1) model.rootBoneIndices.splice(idx, 1);
    } else if (oldParent !== -1 && parentIndex === -1) {
      model.rootBoneIndices.push(boneIndex);
    }
  };

  /**
   * Get all children indices for a bone.
   * @param {number} index
   * @return {number[]}
   */
  publicAPI.getChildrenIndices = (index) => {
    const children = [];
    for (let i = 0; i < model.bones.length; i++) {
      if (model.bones[i].parentIndex === index) {
        children.push(i);
      }
    }
    return children;
  };

  /**
   * Get root bone indices.
   * @return {number[]}
   */
  publicAPI.getRootBoneIndices = () => [...model.rootBoneIndices];

  // -----------------------------------------------------------------------
  // Bone property accessors
  // -----------------------------------------------------------------------

  /**
   * Get the inverse bind matrix for a bone.
   * @param {number} boneIndex
   * @return {Float32Array}
   */
  publicAPI.getInverseBindMatrix = (boneIndex) => {
    if (boneIndex >= 0 && boneIndex < model.bones.length) {
      return model.bones[boneIndex].inverseBindMatrix;
    }
    return mat4.create();
  };

  /**
   * Set the inverse bind matrix for a bone.
   * @param {number} boneIndex
   * @param {Float32Array | number[]} matrix
   */
  publicAPI.setInverseBindMatrix = (boneIndex, matrix) => {
    if (boneIndex >= 0 && boneIndex < model.bones.length) {
      model.bones[boneIndex].inverseBindMatrix = matrix;
    }
  };

  /**
   * Get the local rest translation for a bone.
   * @param {number} boneIndex
   * @return {Float32Array}
   */
  publicAPI.getLocalRestTranslation = (boneIndex) => {
    if (boneIndex >= 0 && boneIndex < model.bones.length) {
      return model.bones[boneIndex].localRestTranslation;
    }
    return vec3.fromValues(0, 0, 0);
  };

  /**
   * Get the local rest rotation for a bone.
   * @param {number} boneIndex
   * @return {Float32Array}
   */
  publicAPI.getLocalRestRotation = (boneIndex) => {
    if (boneIndex >= 0 && boneIndex < model.bones.length) {
      return model.bones[boneIndex].localRestRotation;
    }
    return quat.fromValues(0, 0, 0, 1);
  };

  /**
   * Get the local rest scale for a bone.
   * @param {number} boneIndex
   * @return {Float32Array}
   */
  publicAPI.getLocalRestScale = (boneIndex) => {
    if (boneIndex >= 0 && boneIndex < model.bones.length) {
      return model.bones[boneIndex].localRestScale;
    }
    return vec3.fromValues(1, 1, 1);
  };

  /**
   * Get the node ID for a bone.
   * @param {number} boneIndex
   * @return {number|null}
   */
  publicAPI.getNodeId = (boneIndex) => {
    if (boneIndex >= 0 && boneIndex < model.bones.length) {
      return model.bones[boneIndex].nodeId;
    }
    return null;
  };

  /**
   * Compose the local rest matrix from TRS for a bone.
   * @param {number} boneIndex
   * @return {Float32Array}
   */
  publicAPI.getLocalRestMatrix = (boneIndex) => {
    if (boneIndex < 0 || boneIndex >= model.bones.length) {
      return mat4.create();
    }
    const bone = model.bones[boneIndex];
    const m = mat4.create();
    mat4.fromRotationTranslation(
      m,
      bone.localRestRotation,
      bone.localRestTranslation
    );
    mat4.scale(m, m, bone.localRestScale);
    return m;
  };

  // -----------------------------------------------------------------------
  // Per-bone matrix accessors (merged from vtkPose)
  // -----------------------------------------------------------------------

  /**
   * Set local matrix for a bone
   * @param {number} boneIndex
   * @param {Float32Array | number[]} matrix
   */
  publicAPI.setLocalMatrix = (boneIndex, matrix) => {
    if (boneIndex < 0 || boneIndex >= model.bones.length) {
      vtkWarningMacro(`Invalid bone index ${boneIndex}`);
      return;
    }
    ensureMatrices(model);
    const offset = boneIndex * 16;
    for (let i = 0; i < 16; i++) {
      model.localMatrices[offset + i] = matrix[i];
    }
    publicAPI.modified();
  };

  /**
   * Get local matrix for a bone
   * @param {number} boneIndex
   * @return {Float32Array}
   */
  publicAPI.getLocalMatrix = (boneIndex) => {
    if (boneIndex < 0 || boneIndex >= model.bones.length) {
      vtkWarningMacro(`Invalid bone index ${boneIndex}`);
      return mat4.create();
    }
    ensureMatrices(model);
    const offset = boneIndex * 16;
    const result = mat4.create();
    for (let i = 0; i < 16; i++) {
      result[i] = model.localMatrices[offset + i];
    }
    return result;
  };

  /**
   * Set world matrix for a bone
   * @param {number} boneIndex
   * @param {Float32Array | number[]} matrix
   */
  publicAPI.setWorldMatrix = (boneIndex, matrix) => {
    if (boneIndex < 0 || boneIndex >= model.bones.length) {
      vtkWarningMacro(`Invalid bone index ${boneIndex}`);
      return;
    }
    ensureMatrices(model);
    const offset = boneIndex * 16;
    for (let i = 0; i < 16; i++) {
      model.worldMatrices[offset + i] = matrix[i];
    }
    publicAPI.modified();
  };

  /**
   * Get world matrix for a bone
   * @param {number} boneIndex
   * @return {Float32Array}
   */
  publicAPI.getWorldMatrix = (boneIndex) => {
    if (boneIndex < 0 || boneIndex >= model.bones.length) {
      vtkWarningMacro(`Invalid bone index ${boneIndex}`);
      return mat4.create();
    }
    ensureMatrices(model);
    const offset = boneIndex * 16;
    const result = mat4.create();
    for (let i = 0; i < 16; i++) {
      result[i] = model.worldMatrices[offset + i];
    }
    return result;
  };

  /**
   * Set skinning matrix for a bone
   * @param {number} boneIndex
   * @param {Float32Array | number[]} matrix
   */
  publicAPI.setSkinningMatrix = (boneIndex, matrix) => {
    if (boneIndex < 0 || boneIndex >= model.bones.length) {
      vtkWarningMacro(`Invalid bone index ${boneIndex}`);
      return;
    }
    ensureMatrices(model);
    const offset = boneIndex * 16;
    for (let i = 0; i < 16; i++) {
      model.skinningMatrices[offset + i] = matrix[i];
    }
    publicAPI.modified();
  };

  /**
   * Get skinning matrix for a bone
   * @param {number} boneIndex
   * @return {Float32Array}
   */
  publicAPI.getSkinningMatrix = (boneIndex) => {
    if (boneIndex < 0 || boneIndex >= model.bones.length) {
      vtkWarningMacro(`Invalid bone index ${boneIndex}`);
      return mat4.create();
    }
    ensureMatrices(model);
    const offset = boneIndex * 16;
    const result = mat4.create();
    for (let i = 0; i < 16; i++) {
      result[i] = model.skinningMatrices[offset + i];
    }
    return result;
  };

  /**
   * Get the raw local matrices array (boneCount * 16 floats)
   * @return {Float32Array}
   */
  publicAPI.getLocalMatrices = () => {
    ensureMatrices(model);
    return model.localMatrices;
  };

  /**
   * Get the raw world matrices array (boneCount * 16 floats)
   * @return {Float32Array}
   */
  publicAPI.getWorldMatrices = () => {
    ensureMatrices(model);
    return model.worldMatrices;
  };

  /**
   * Get the raw skinning matrices array (boneCount * 16 floats)
   * @return {Float32Array}
   */
  publicAPI.getSkinningMatrices = () => {
    ensureMatrices(model);
    return model.skinningMatrices;
  };

  // -----------------------------------------------------------------------
  // Pose evaluation
  // -----------------------------------------------------------------------

  /**
   * Evaluate animation clip at a given time: compose TRS per bone from
   * rest pose overridden by animated tracks, then compute world and
   * skinning matrices.
   * @param {vtkAnimationClip} clip
   * @param {number} time
   */
  publicAPI.evaluatePose = (clip, time) => {
    if (!clip) return;

    const boneCount = model.bones.length;
    if (boneCount === 0) return;

    ensureMatrices(model);
    const localMatrices = model.localMatrices;
    const tracks = clip.getTracks();

    for (let i = 0; i < boneCount; i++) {
      const bone = model.bones[i];

      let t = bone.localRestTranslation;
      let r = bone.localRestRotation;
      let s = bone.localRestScale;

      for (let ti = 0; ti < tracks.length; ti++) {
        const track = tracks[ti];
        if (track.getBoneIndex() !== i) continue;

        const trackType = track.getTrackType();
        const value = track.evaluate(time);

        if (trackType === 0) t = value;
        else if (trackType === 1) r = value;
        else if (trackType === 2) s = value;
      }

      const offset = i * 16;
      const m = mat4.create();
      const q = quat.fromValues(r[0], r[1], r[2], r[3]);
      mat4.fromRotationTranslationScale(m, q, t, s);

      for (let j = 0; j < 16; j++) {
        localMatrices[offset + j] = m[j];
      }
    }

    publicAPI.computeWorldMatrices();
    publicAPI.computeSkinningMatrices();
  };

  // -----------------------------------------------------------------------
  // Hierarchy computations
  // -----------------------------------------------------------------------

  /**
   * Compute world matrices from local matrices by traversing the bone hierarchy.
   * Uses the skeleton's internal localMatrices and writes to internal worldMatrices.
   */
  publicAPI.computeWorldMatrices = () => {
    ensureMatrices(model);
    const boneCount = model.bones.length;
    const hasRootTransform = model.rootTransform != null;

    for (let i = 0; i < boneCount; i++) {
      const parentIdx = model.bones[i].parentIndex;
      const localMatrix = mat4.create();

      for (let j = 0; j < 16; j++) {
        localMatrix[j] = model.localMatrices[i * 16 + j];
      }

      let worldMatrix;
      if (parentIdx === -1) {
        if (hasRootTransform) {
          worldMatrix = mat4.create();
          mat4.multiply(worldMatrix, model.rootTransform, localMatrix);
        } else {
          worldMatrix = localMatrix;
        }
      } else {
        const parentWorldMatrix = mat4.create();
        for (let j = 0; j < 16; j++) {
          parentWorldMatrix[j] = model.worldMatrices[parentIdx * 16 + j];
        }
        worldMatrix = mat4.create();
        mat4.multiply(worldMatrix, parentWorldMatrix, localMatrix);
      }

      for (let j = 0; j < 16; j++) {
        model.worldMatrices[i * 16 + j] = worldMatrix[j];
      }
    }

    publicAPI.modified();
  };

  /**
   * Compute skinning matrices: skinningMatrix[i] = worldMatrix[i] * inverseBindMatrix[i].
   * Uses the skeleton's internal worldMatrices and writes to internal skinningMatrices.
   */
  publicAPI.computeSkinningMatrices = () => {
    ensureMatrices(model);
    const boneCount = model.bones.length;

    for (let i = 0; i < boneCount; i++) {
      const inverseBindMatrix = model.bones[i].inverseBindMatrix;

      const worldMatrix = mat4.create();
      for (let j = 0; j < 16; j++) {
        worldMatrix[j] = model.worldMatrices[i * 16 + j];
      }

      const skinningMatrix = mat4.create();
      mat4.multiply(skinningMatrix, worldMatrix, inverseBindMatrix);

      for (let j = 0; j < 16; j++) {
        model.skinningMatrices[i * 16 + j] = skinningMatrix[j];
      }
    }

    publicAPI.modified();
  };
}

// ---------------------------------------------------------------------------
// Object factory
// ---------------------------------------------------------------------------

const DEFAULT_VALUES = {
  bones: null,
  nameToIndex: null,
  rootBoneIndices: null,
  rootTransform: null,
  localMatrices: null,
  worldMatrices: null,
  skinningMatrices: null,
};

// ---------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Initialize collections
  if (!model.bones) {
    model.bones = [];
  }
  if (!model.nameToIndex) {
    model.nameToIndex = new Map();
  }
  if (!model.rootBoneIndices) {
    model.rootBoneIndices = [];
  }
  if (!model.localMatrices) {
    model.localMatrices = new Float32Array(0);
  }
  if (!model.worldMatrices) {
    model.worldMatrices = new Float32Array(0);
  }
  if (!model.skinningMatrices) {
    model.skinningMatrices = new Float32Array(0);
  }

  // Object methods
  macro.obj(publicAPI, model);

  // Getters and setters
  macro.setGet(publicAPI, model, ['rootTransform']);

  // Object specific methods
  vtkArmature(publicAPI, model);
}

// ---------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkArmature');

// ---------------------------------------------------------------------------

export default { newInstance, extend };
