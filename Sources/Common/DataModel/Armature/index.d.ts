import { Nullable } from '../../../types';
import { vtkObject } from '../../../interfaces';

/**
 * Plain object representing bone data stored in the armature.
 */
export interface BoneData {
  /** The name of the bone. */
  name?: string;
  /** The parent bone index (-1 for root bones). */
  parentIndex?: number;
  /** The inverse bind matrix (local space to bone). */
  inverseBindMatrix?: Float32Array | number[];
  /** The local rest translation. */
  localRestTranslation?: Float32Array | number[];
  /** The local rest rotation (quaternion [x, y, z, w]). */
  localRestRotation?: Float32Array | number[];
  /** The local rest scale. */
  localRestScale?: Float32Array | number[];
  /** Optional node ID (importer-specific, e.g., glTF node index). */
  nodeId?: Nullable<number>;
}

export interface IArmatureInitialValues {
  /**
   * Transform applied to root bones before computing world matrices.
   * Accounts for non-joint ancestor nodes (e.g., coordinate system conversions).
   * @default null
   */
  rootTransform?: Nullable<Float32Array>;
}

export interface vtkArmature extends vtkObject {
  /**
   * Add a bone to the skeleton.
   * @param {BoneData} boneData Plain object with bone properties.
   * @return {number} Index of the added bone.
   */
  addBone(boneData: BoneData): number;

  /**
   * Insert a bone at a specific index.
   * @param {number} index The index to insert at.
   * @param {BoneData} boneData Plain object with bone properties.
   */
  insertBone(index: number, boneData: BoneData): void;

  /**
   * Remove a bone at a specific index.
   * @param {number} index The index to remove.
   */
  removeBone(index: number): void;

  /**
   * Get the number of bones in the skeleton.
   */
  getNumberOfBones(): number;

  /**
   * Get a bone by index.
   * @param {number} index The bone index.
   */
  getBone(index: number): BoneData;

  /**
   * Get all bones in the skeleton.
   */
  getBones(): BoneData[];

  /**
   * Get the name of a bone by index.
   * @param {number} index The bone index.
   */
  getBoneName(index: number): string;

  /**
   * Get a bone index by name.
   * @param {string} name The bone name.
   * @return {number} The bone index, or -1 if not found.
   */
  getBoneIndexByName(name: string): number;

  /**
   * Get the parent index for a bone.
   * @param {number} index The bone index.
   * @return {number} The parent bone index, or -1 for root bones.
   */
  getParentIndex(index: number): number;

  /**
   * Set the parent index for a bone and update rootBoneIndices accordingly.
   * @param {number} boneIndex The bone index.
   * @param {number} parentIndex The parent bone index (-1 for root).
   */
  setParentIndex(boneIndex: number, parentIndex: number): void;

  /**
   * Get all children indices for a bone.
   * @param {number} index The bone index.
   */
  getChildrenIndices(index: number): number[];

  /**
   * Get all root bone indices (bones with parentIndex === -1).
   */
  getRootBoneIndices(): number[];

  /**
   * Set the root transform applied to root bones.
   * @param {Nullable<Float32Array>} transform The root transform matrix (mat4).
   */
  setRootTransform(transform: Nullable<Float32Array>): boolean;

  /**
   * Get the root transform applied to root bones.
   */
  getRootTransform(): Nullable<Float32Array>;

  /**
   * Get the inverse bind matrix for a bone.
   * @param {number} boneIndex The bone index.
   */
  getInverseBindMatrix(boneIndex: number): Float32Array;

  /**
   * Set the inverse bind matrix for a bone.
   * @param {number} boneIndex The bone index.
   * @param {Float32Array | number[]} matrix The 4x4 inverse bind matrix.
   */
  setInverseBindMatrix(
    boneIndex: number,
    matrix: Float32Array | number[]
  ): void;

  /**
   * Get the local rest translation for a bone.
   * @param {number} boneIndex The bone index.
   */
  getLocalRestTranslation(boneIndex: number): Float32Array;

  /**
   * Get the local rest rotation for a bone (quaternion [x, y, z, w]).
   * @param {number} boneIndex The bone index.
   */
  getLocalRestRotation(boneIndex: number): Float32Array;

  /**
   * Get the local rest scale for a bone.
   * @param {number} boneIndex The bone index.
   */
  getLocalRestScale(boneIndex: number): Float32Array;

  /**
   * Get the node ID for a bone.
   * @param {number} boneIndex The bone index.
   */
  getNodeId(boneIndex: number): Nullable<number>;

  /**
   * Compose the local rest matrix from TRS for a bone.
   * @param {number} boneIndex The bone index.
   * @return {Float32Array} The composed 4x4 local rest matrix.
   */
  getLocalRestMatrix(boneIndex: number): Float32Array;

  /**
   * Set the local matrix for a bone.
   * @param {number} boneIndex The bone index.
   * @param {Float32Array | number[]} matrix The 4x4 local matrix.
   */
  setLocalMatrix(boneIndex: number, matrix: Float32Array | number[]): void;

  /**
   * Get the local matrix for a bone.
   * @param {number} boneIndex The bone index.
   */
  getLocalMatrix(boneIndex: number): Float32Array;

  /**
   * Set the world matrix for a bone.
   * @param {number} boneIndex The bone index.
   * @param {Float32Array | number[]} matrix The 4x4 world matrix.
   */
  setWorldMatrix(boneIndex: number, matrix: Float32Array | number[]): void;

  /**
   * Get the world matrix for a bone.
   * @param {number} boneIndex The bone index.
   */
  getWorldMatrix(boneIndex: number): Float32Array;

  /**
   * Set the skinning matrix for a bone.
   * @param {number} boneIndex The bone index.
   * @param {Float32Array | number[]} matrix The 4x4 skinning matrix.
   */
  setSkinningMatrix(boneIndex: number, matrix: Float32Array | number[]): void;

  /**
   * Get the skinning matrix for a bone.
   * @param {number} boneIndex The bone index.
   */
  getSkinningMatrix(boneIndex: number): Float32Array;

  /**
   * Get the raw local matrices array (boneCount * 16 floats).
   */
  getLocalMatrices(): Float32Array;

  /**
   * Get the raw world matrices array (boneCount * 16 floats).
   */
  getWorldMatrices(): Float32Array;

  /**
   * Get the raw skinning matrices array (boneCount * 16 floats).
   */
  getSkinningMatrices(): Float32Array;

  /**
   * Evaluate animation clip at a given time: compose TRS per bone from
   * rest pose overridden by animated tracks, then compute world and
   * skinning matrices.
   * @param clip The animation clip to evaluate.
   * @param time The current time.
   */
  evaluatePose(clip: object, time: number): void;

  /**
   * Compute world matrices from local matrices by traversing the bone hierarchy.
   * Uses internal localMatrices and writes to internal worldMatrices.
   */
  computeWorldMatrices(): void;

  /**
   * Compute skinning matrices.
   * skinningMatrix[i] = worldMatrix[i] * inverseBindMatrix[i].
   * Uses internal worldMatrices and writes to internal skinningMatrices.
   */
  computeSkinningMatrices(): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkArmature characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IArmatureInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IArmatureInitialValues
): void;

/**
 * Method used to create a new instance of vtkArmature.
 * @param {IArmatureInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IArmatureInitialValues
): vtkArmature;

/**
 * vtkArmature manages a hierarchical collection of bones that define a skeletal
 * rig for animation. It stores per bone local, world, and skinning matrices
 * directly, provides methods for traversing the bone hierarchy, computing
 * world-space transforms from local matrices, and producing skinning matrices
 * used by GPU rendering backends.
 */
export declare const vtkArmature: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkArmature;
