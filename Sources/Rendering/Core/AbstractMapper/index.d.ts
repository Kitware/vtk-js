import { mat4 } from 'gl-matrix';
import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import vtkPlane from '../../../Common/DataModel/Plane';
import { Vector4 } from '../../../types';

/**
 *
 */
export interface IAbstractMapperInitialValues {
  clippingPlanes?: vtkPlane[];
}

type vtkAbstractMapperBase = vtkObject &
  Omit<vtkAlgorithm, 'getOutputData' | 'getOutputPort'>;

export interface vtkAbstractMapper extends vtkAbstractMapperBase {
  /**
   * Added plane needs to be a vtkPlane object.
   * @param {vtkPlane} plane
   */
  addClippingPlane(plane: vtkPlane): boolean;

  /**
   * Get number of clipping planes.
   * @return {Number} The number of clipping planes.
   */
  getNumberOfClippingPlanes(): number;

  /**
   * Get all clipping planes.
   * @return {vtkPlane[]} An array of the clipping planes objects
   */
  getClippingPlanes(): vtkPlane[];

  /**
   * Get the modified time of the clipping planes list.
   * @return {Number} The modified time.
   */
  getClippingPlanesMTime(): number;

  /**
   * Remove all clipping planes.
   * @return true if there were planes, false otherwise.
   */
  removeAllClippingPlanes(): boolean;

  /**
   * Remove clipping plane.
   * @param {vtkPlane} plane
   * @return true if plane existed and therefore is removed, false otherwise.
   */
  removeClippingPlane(plane: vtkPlane): boolean;

  /**
   * Set clipping planes.
   * @param {vtkPlane[]} planes
   */
  setClippingPlanes(planes: vtkPlane[]): void;

  /**
   * Get the ith clipping plane transformed from world coordinates into the
   * target coordinate system defined by the provided world-to-coordinates
   * matrix.
   * @param {mat4} worldToCoords
   * @param {Number} i
   * @param {Number[]} [hnormal]
   */
  getClippingPlaneInCoords(
    worldToCoords: mat4,
    i: number,
    hnormal?: Vector4 | Float64Array
  ): Vector4 | Float64Array | undefined;

  /**
   * Get the ith clipping plane as a homogeneous plane equation.
   * Use getNumberOfClippingPlanes() to get the number of planes.
   * This API expects a coordinates-to-world matrix and preserves the legacy
   * behavior used by existing data-coordinate callers.
   * @param {mat4} propMatrix
   * @param {Number} i
   * @param {Number[]} hnormal
   */
  getClippingPlaneInDataCoords(
    propMatrix: mat4,
    i: number,
    hnormal: number[]
  ): void;

  /**
   *
   */
  update(): void;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkAbstractMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IAbstractMapperInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IAbstractMapperInitialValues
): void;

/**
 * vtkAbstractMapper is an abstract class to specify interface between data and
 * graphics primitives or software rendering techniques. Subclasses of
 * vtkAbstractMapper can be used for rendering 2D data, geometry, or volumetric
 * data.
 */
export declare const vtkAbstractMapper: {
  extend: typeof extend;
};
export default vtkAbstractMapper;
