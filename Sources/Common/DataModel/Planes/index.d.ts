import { Bounds, Vector3 } from '../../../types';
import vtkDataArray from '../../Core/DataArray';
import vtkImplicitFunction, {
  IImplicitFunctionInitialValues,
} from '../ImplicitFunction';
import vtkPlane from '../Plane';
import vtkPoints from '../../Core/Points';

/**
 *
 */
export interface IPlanesInitialValues extends IImplicitFunctionInitialValues {
  points?: vtkPoints;
  normals?: vtkDataArray;
  bounds?: Bounds;
  planes?: number[];
}

export interface vtkPlanes extends vtkImplicitFunction {
  /**
   * Evaluate the function at a point x
   * @param x The point at which to evaluate the function
   * @returns The function value at the point x
   */
  evaluateFunction(x: Vector3): number;

  /**
   * Evaluate the gradient at a point x
   * @param x The point at which to evaluate the gradient
   * @returns The gradient at the point x
   */
  evaluateGradient(x: Vector3): Vector3;

  /**
   * Get the bounds of the planes.
   * @returns {Bounds} The bounds of the planes.
   */
  getBounds(): Bounds;

  /**
   * Get the number of planes in the set of planes.
   */
  getNumberOfPlanes(): number;

  /**
   * Get the normals of the plane.
   * @returns {vtkDataArray} The normals of the plane.
   */
  getNormals(): vtkDataArray;

  /**
   * Get the points of the plane.
   * @returns {vtkPoints} The points of the plane.
   */
  getPoints(): vtkPoints;

  /**
   * Get the i-th plane
   * @param {Number} i The index of the plane to get.
   * @param {vtkPlane} [plane] The vtkPlane instance to fill (optional).
   * @returns {vtkPlane} The plane instance at the specified index.
   * If no plane is provided, a new vtkPlane instance will be created.
   */
  getPlane(i: number, plane?: vtkPlane): vtkPlane;

  /**
   * Set the bounds of the planes.
   * @param {Bounds} bounds The bounds to set.
   * @returns {Boolean} true if bounds were set, false if they were already set
   * @see getBounds
   */
  setBounds(bounds: Bounds): boolean;

  /**
   * Set the Frustum planes.
   * @param {Vector3[]} planes The coordinates of the frustum planes.
   */
  setFrustumPlanes(planes: Vector3[]): boolean;

  /**
   * Set the normals of the plane.
   * @param {vtkDataArray} normals The normals to set.
   */
  setNormals(normals: vtkDataArray): boolean;

  /**
   * Set the points of the plane.
   * @param points The points to set.
   */
  setPoints(points: vtkPoints): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkPlane characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IPlanesInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IPlanesInitialValues
): void;

/**
 * Method used to create a new instance of vtkPlane.
 * @param {IPlanesInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IPlanesInitialValues): vtkPlanes;

/**
 * vtkPlanes computes the implicit function and function gradient for a set of
 * planes. The planes must define a convex space.
 */
export declare const vtkPlanes: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkPlanes;
