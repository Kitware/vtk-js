import { DesiredOutputPrecision } from '../../../Common/DataModel/DataSetAttributes';
import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { Bounds, Vector3 } from '../../../types';

/**
 * Initial values for vtkCleanPolyData.
 */
export interface ICleanPolyDataInitialValues {
  /**
   * The tolerance used for point merging.
   */
  tolerance?: number;

  /**
   * Whether the tolerance is absolute or relative.
   */
  toleranceIsAbsolute?: boolean;

  /**
   * The absolute tolerance value.
   */
  absoluteTolerance?: number;

  /**
   * The desired output precision for points.
   */
  outputPointsPrecision?: DesiredOutputPrecision;

  /**
   * Whether to merge points.
   */
  pointMerging?: boolean;

  /**
   * Whether to convert lines to points.
   */
  convertLinesToPoints?: boolean;

  /**
   * Whether to convert polygons to lines.
   */
  convertPolysToLines?: boolean;

  /**
   * Whether to convert strips to polygons.
   */
  convertStripsToPolys?: boolean;
}

type vtkCleanPolyDataBase = vtkObject &
  Omit<
    vtkAlgorithm,
    | 'getInputData'
    | 'setInputData'
    | 'setInputConnection'
    | 'getInputConnection'
    | 'addInputConnection'
    | 'addInputData'
  >;

export interface vtkCleanPolyData extends vtkCleanPolyDataBase {
  /**
   * Operate on a point by applying a transformation.
   *
   * @param {Vector3} point The point to operate on.
   */
  operateOnPoint(point: Vector3): void;

  /**
   * Operate on a bounding box by applying a transformation.
   *
   * @param {Bounds} inBounds The input bounding box.
   * @param {Bounds} outBounds The output bounding box.
   */
  operateOnBounds(inBounds: Bounds, outBounds: Bounds): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkCleanPolyData characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ICleanPolyDataInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ICleanPolyDataInitialValues
): void;

/**
 * Method used to create a new instance of vtkCleanPolyData.
 * @param {ICleanPolyDataInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: ICleanPolyDataInitialValues
): vtkCleanPolyData;

/**
 * vtkCleanPolyData merge exactly coincident points.
 *
 * vtkCleanPolyData is a locator object to quickly locate points in 3D.
 */
export declare const vtkCleanPolyData: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkCleanPolyData;
