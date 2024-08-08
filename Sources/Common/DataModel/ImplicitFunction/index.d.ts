import { vtkObject } from '../../../interfaces';
import { Vector3 } from '../../../types';
import { vtkTransform } from '../../Transform/Transform';

/**
 *
 */
export interface IImplicitFunctionInitialValues {
  transform?: vtkTransform;
}

export interface vtkImplicitFunction extends vtkObject {
  /**
   * Given the point x evaluate the function.
   * @see functionValue
   * @param {Vector3} x The point coordinate.
   */
  evaluateFunction(x: Vector3): number;

  /**
   * Evaluate function at position x-y-z and return value. Point x[3] is
   * transformed through transform (if provided).
   * @see evaluateFunction
   * @param {Vector3} x The point coordinate.
   */
  functionValue(x: Vector3): number;

  /**
   * Get the transform. undefined by default
   */
  getTransform(): vtkTransform;

  /**
   * Set the transform to apply on all points.
   * @param {vtkTransform} transform The transform to apply
   */
  setTransform(transform: vtkTransform): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkImplicitFunction characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IImplicitFunctionInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IImplicitFunctionInitialValues
): void;

/**
 * Method used to create a new instance of vtkImplicitFunction.
 * @param {IImplicitFunctionInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IImplicitFunctionInitialValues
): vtkImplicitFunction;

/**
 * vtkImplicitFunction computes the implicit function and/or gradient for a function.
 */
export declare const vtkImplicitFunction: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkImplicitFunction;
