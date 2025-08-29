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

type vtkCleanPolyDataBase = vtkObject & vtkAlgorithm;

export interface vtkCleanPolyData extends vtkCleanPolyDataBase {
  /**
   * Create default locator.
   */
  createDefaultLocator(): void;

  /**
   * Get the absolute tolerance value.
   */
  getAbsoluteTolerance(): number;

  /**
   * Get whether to convert lines to points.
   */
  getConvertLinesToPoints(): boolean;

  /**
   * Get whether to convert polygons to lines.
   */
  getConvertPolysToLines(): boolean;

  /**
   * Get whether to convert strips to polygons.
   */
  getConvertStripsToPolys(): boolean;

  /**
   * Get the output points precision.
   */
  getOutputPointsPrecision(): DesiredOutputPrecision;

  /**
   * Get whether to merge points.
   */
  getPointMerging(): boolean;

  /**
   * Get the tolerance used for point merging.
   */
  getTolerance(): number;

  /**
   * Get whether the tolerance is absolute or relative.
   */
  getToleranceIsAbsolute(): boolean;

  /**
   * Operate on a bounding box by applying a transformation.
   *
   * @param {Bounds} inBounds The input bounding box.
   * @param {Bounds} outBounds The output bounding box.
   */
  operateOnBounds(inBounds: Bounds, outBounds: Bounds): void;

  /**
   * Operate on a point by applying a transformation.
   *
   * @param {Vector3} point The point to operate on.
   */
  operateOnPoint(point: Vector3): void;

  /**
   *
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;

  /**
   * Set the absolute tolerance value.
   * This is only used if ToleranceIsAbsolute is true.
   * Initial value is 0.0
   * @param {Number} absoluteTolerance The absolute tolerance value.
   */
  setAbsoluteTolerance(absoluteTolerance: number): boolean;

  /**
   * Set whether to convert lines to points.
   * @param {Boolean} convertLinesToPoints
   */
  setConvertLinesToPoints(convertLinesToPoints: boolean): boolean;

  /**
   * Set whether to convert polygons to lines.
   * @param {Boolean} convertPolysToLines
   */
  setConvertPolysToLines(convertPolysToLines: boolean): boolean;

  /**
   * Set whether to convert strips to polygons.
   * @param {Boolean} convertStripsToPolys
   */
  setConvertStripsToPolys(convertStripsToPolys: boolean): boolean;

  /**
   * Set the desired output precision for points.
   * Initial value is DEFAULT_PRECISION.
   * @param {DesiredOutputPrecision} outputPointsPrecision The outputPointsPrecision value.
   */
  setOutputPointsPrecision(
    outputPointsPrecision: DesiredOutputPrecision
  ): boolean;

  /**
   * Set whether to merge points.
   * Initial value is false.
   * @param {Boolean} pointMerging The pointMerging value.
   */
  setPointMerging(pointMerging: boolean): boolean;

  /**
   * Set the tolerance used for point merging.
   * This is ignored if ToleranceIsAbsolute is true.
   * Initial value is 0.0
   * @param {Number} tolerance The tolerance value.
   */
  setTolerance(tolerance: number): boolean;

  /**
   * Set whether the tolerance is absolute or relative.
   * Initial value is false (relative).
   * @param {Boolean} toleranceIsAbsolute The toleranceIsAbsolute value.
   */
  setToleranceIsAbsolute(toleranceIsAbsolute: boolean): boolean;
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
