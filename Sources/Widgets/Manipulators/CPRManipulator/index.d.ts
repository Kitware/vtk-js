import vtkImageSlice from '../../../Rendering/Core/ImageSlice';
import { Matrix3x3, Nullable, Vector3 } from '../../../types';
import {
  IAbstractManipulatorInitialValues,
  vtkAbstractManipulator,
} from '../AbstractManipulator';

/**
 *
 */
export interface ICPRManipulatorInitialValues extends IAbstractManipulatorInitialValues {
  distanceStep?: number;
  currentDistance?: number;
  cprActor?: Nullable<vtkImageSlice>;
}

/**
 * Position and direction along the centerline, as returned by
 * `distanceEvent` and `handleScroll`.
 */
export interface ICPRManipulatorEvent {
  worldCoords: Nullable<Vector3>;
  worldDirection?: Matrix3x3;
}

export interface vtkCPRManipulator extends vtkAbstractManipulator {
  /**
   * Get the actor which holds the vtkImageCPRMapper this manipulator moves
   * along.
   */
  getCprActor(): Nullable<vtkImageSlice>;

  /**
   * Get the distance from the first point of the centerline of the last
   * handled event.
   */
  getCurrentDistance(): number;

  /**
   * Not used by the implementation, it is only stored on the model.
   */
  getDistance(): number | undefined;

  /**
   * Get the distance the manipulator moves for one scroll step. When no
   * distance step has been set, the smallest spacing of the mapper input
   * image is used instead.
   */
  getDistanceStep(): number;

  /**
   * Move to the given distance from the first point of the centerline, after
   * clamping it to the height of the mapper.
   * @param {Number} distance
   */
  distanceEvent(distance: number): ICPRManipulatorEvent;

  /**
   * Move by the given number of distance steps along the centerline.
   * @param {Number} nbSteps
   */
  handleScroll(nbSteps: number): ICPRManipulatorEvent;

  /**
   * Set the actor which holds the vtkImageCPRMapper this manipulator moves
   * along.
   * @param {vtkImageSlice} cprActor
   */
  setCprActor(cprActor: Nullable<vtkImageSlice>): boolean;

  /**
   * Set the distance from the first point of the centerline.
   * @param {Number} currentDistance
   */
  setCurrentDistance(currentDistance: number): boolean;

  /**
   * @see getDistance
   * @param {Number} distance
   */
  setDistance(distance: number): boolean;

  /**
   * Set the distance the manipulator moves for one scroll step.
   * @param {Number} distanceStep
   */
  setDistanceStep(distanceStep: number): boolean;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkCPRManipulator characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ICPRManipulatorInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ICPRManipulatorInitialValues
): void;

/**
 * Method use to create a new instance of vtkCPRManipulator
 */
export function newInstance(
  initialValues?: ICPRManipulatorInitialValues
): vtkCPRManipulator;

/**
 *
 * @param {Number} x
 * @param {Number} y
 * @param {Vector3} planeOrigin
 * @param {Vector3} planeNormal
 * @param renderer
 * @param glRenderWindow
 */
export function intersectDisplayWithPlane(
  x: number,
  y: number,
  planeOrigin: Vector3,
  planeNormal: Vector3,
  renderer: any,
  glRenderWindow: any
): Vector3 | [];

/**
 * vtkCPRManipulator moves a point along the centerline of a
 * vtkImageCPRMapper.
 */
export declare const vtkCPRManipulator: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  intersectDisplayWithPlane: typeof intersectDisplayWithPlane;
};
export default vtkCPRManipulator;
