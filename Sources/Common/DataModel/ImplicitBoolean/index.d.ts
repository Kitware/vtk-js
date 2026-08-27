import { Vector3 } from '../../../types';
import vtkImplicitFunction, {
  IImplicitFunctionInitialValues,
} from '../ImplicitFunction';
import { Operation } from './Constants';

/**
 *
 */
export interface IImplicitBooleanInitialValues extends IImplicitFunctionInitialValues {
  operation?: Operation;
  functions?: vtkImplicitFunction[];
}

export interface vtkImplicitBoolean extends vtkImplicitFunction {
  /**
   * Add an implicit function to the list of functions to combine.
   * The function is ignored if it is already in the list.
   * @param {vtkImplicitFunction} f
   */
  addFunction(f: vtkImplicitFunction): void;

  /**
   * Evaluate the combination of all the implicit functions, following the
   * current operation.
   * @param {Vector3} xyz The point coordinate.
   */
  evaluateFunction(xyz: Vector3): number;

  /**
   * @param {Vector3} xyz The point coordinate.
   */
  evaluateGradient(xyz: Vector3): number[];

  /**
   * Get the list of implicit functions being combined.
   */
  getFunctions(): vtkImplicitFunction[];

  /**
   * The modified time is the maximum of this object's and of all the
   * combined functions'.
   */
  getMTime(): number;

  /**
   * Get the operation used to combine the functions.
   */
  getOperation(): Operation;

  /**
   * Get the name of the current operation.
   */
  getOperationAsString(): string;

  /**
   * Whether the given function is part of the combination.
   * @param {vtkImplicitFunction} f
   */
  hasFunction(f: vtkImplicitFunction): boolean;

  /**
   * Remove every function from the combination.
   */
  removeAllFunctions(): void;

  /**
   * Remove the given function from the combination.
   * @param {vtkImplicitFunction} f
   */
  removeFunction(f: vtkImplicitFunction): void;

  /**
   * Set the operation used to combine the functions.
   * @param {Operation} operation
   */
  setOperation(operation: Operation): boolean;

  /**
   * Set the operation to Operation.DIFFERENCE.
   */
  setOperationToDifference(): boolean;

  /**
   * Set the operation to Operation.INTERSECTION.
   */
  setOperationToIntersection(): boolean;

  /**
   * Set the operation to Operation.UNION.
   */
  setOperationToUnion(): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkImplicitBoolean characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IImplicitBooleanInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IImplicitBooleanInitialValues
): void;

/**
 * Method used to create a new instance of vtkImplicitBoolean.
 * @param {IImplicitBooleanInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IImplicitBooleanInitialValues
): vtkImplicitBoolean;

/**
 * vtkImplicitBoolean combines a list of implicit functions with a boolean
 * operation: union, intersection or difference.
 */
export declare const vtkImplicitBoolean: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  // constants
  Operation: typeof Operation;
};
export default vtkImplicitBoolean;
