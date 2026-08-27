import { mat4, vec3 } from 'gl-matrix';
import { Vector3 } from '../../../types';

/**
 * Labels used to encode a handle position in the handle state's name property.
 * `'-'` is the lower bound, `'='` the middle and `'+'` the upper bound.
 */
export declare const AXES: string[];

/**
 * Apply a 4x4 transform to a 3-component vector.
 */
export function transformVec3(ain: Vector3, transform: mat4): Float64Array;

/**
 * Apply only the rotation part of a 4x4 transform to a 3-component vector.
 */
export function rotateVec3(vec: Vector3, transform: mat4): vec3;

/**
 * Classify a handle from its name: `'corners'`, `'edges'` or `'faces'`.
 *
 * @param {String} name The handle name, made of three characters of `AXES`
 */
export function handleTypeFromName(name: string): string;

/**
 * Compute the world-space center of the crop box described by `planes`.
 *
 * @param planes The cropping planes, in index space
 * @param {mat4} transform The index-to-world transform
 */
export function calculateCropperCenter(
  planes: [number, number, number, number, number, number],
  transform: mat4
): Float64Array;

/**
 * Compute the normalized direction going from `v2` to `v1`.
 */
export function calculateDirection(v1: Vector3, v2: Vector3): vec3;
