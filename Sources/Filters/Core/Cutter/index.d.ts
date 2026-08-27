import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { Nullable } from '../../../types';

export interface ICutterFunction {
  getMTime(): number;
  evaluateFunction(x: number, y: number, z: number): number;
}

/**
 *
 */
export interface ICutterInitialValues {
  /**
   * The implicit function used to cut the input data, e.g. a vtkPlane. Any
   * object exposing `evaluateFunction(x, y, z)` and `getMTime()` will do.
   */
  cutFunction?: Nullable<ICutterFunction>;

  /**
   * The iso-value of the cut function at which the input is cut.
   * @default 0.0
   */
  cutValue?: number;
}

type vtkCutterBase = vtkObject & vtkAlgorithm;

export interface vtkCutter extends vtkCutterBase {
  /**
   * Get the implicit function used to cut the input data.
   */
  getCutFunction(): Nullable<ICutterFunction>;

  /**
   * Set the implicit function used to cut the input data.
   *
   * @param {ICutterFunction} cutFunction The cut function
   */
  setCutFunction(cutFunction: Nullable<ICutterFunction>): boolean;

  /**
   * Get the iso-value at which the input is cut.
   * @default 0.0
   */
  getCutValue(): number;

  /**
   * Set the iso-value at which the input is cut.
   *
   * @param {Number} cutValue The iso-value
   */
  setCutValue(cutValue: number): boolean;

  /**
   * The modified time of the cutter, which also accounts for the modified time
   * of its cut function.
   */
  getMTime(): number;

  /**
   *
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkCutter characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ICutterInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ICutterInitialValues
): void;

/**
 * Method used to create a new instance of vtkCutter
 * @param {ICutterInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ICutterInitialValues): vtkCutter;

/**
 * vtkCutter is a filter that any dataset with an implicit function, such as a
 * vtkPlane, producing a vtkPolyData of the resulting lines and polygons.
 *
 * The cut function is evaluated at every input point; cells whose points do not
 * all lie on the same side of the iso-value are intersected, and the
 * intersection points are linearly interpolated along the crossed edges.
 */
declare const vtkCutter: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkCutter;
