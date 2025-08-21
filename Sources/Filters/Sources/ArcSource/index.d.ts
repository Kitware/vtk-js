import { DesiredOutputPrecision } from '../../../Common/DataModel/DataSetAttributes';
import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { Vector3 } from '../../../types';

/**
 *
 */
export interface IArcSourceInitialValues {
  point1?: Vector3;
  point2?: Vector3;
  center?: Vector3;
  normal?: Vector3;
  polarVector?: Vector3;
  angle?: number;
  resolution?: number;
  negative?: boolean;
  useNormalAndAngle?: boolean;
  outputPointsPrecision?: DesiredOutputPrecision;
}

type vtkArcSourceBase = vtkObject &
  Omit<
    vtkAlgorithm,
    | 'getInputData'
    | 'setInputData'
    | 'setInputConnection'
    | 'getInputConnection'
    | 'addInputConnection'
    | 'addInputData'
  >;

export interface vtkArcSource extends vtkArcSourceBase {
  /**
   * Get the angle of the arc.
   */
  getAngle(): number;

  /**
   * Get the center of the arc.
   */
  getCenter(): Vector3;

  /**
   * Get the center of the arc by reference.
   */
  getCenterByReference(): Vector3;

  /**
   * Get the first point of the arc.
   */
  getPoint1(): Vector3;

  /**
   * Get the first point of the arc by reference.
   */
  getPoint1ByReference(): Vector3;

  /**
   * Get the second point of the arc.
   */
  getPoint2(): Vector3;

  /**
   * Get the second point of the arc by reference.
   */
  getPoint2ByReference(): Vector3;

  /**
   * Get the normal vector of the arc.
   */
  getNormal(): Vector3;

  /**
   * Get the normal vector of the arc by reference.
   */
  getNormalByReference(): Vector3;

  /**
   * Get the polar vector of the arc.
   */
  getPolarVector(): Vector3;

  /**
   * Get the polar vector of the arc by reference.
   */
  getPolarVectorByReference(): Vector3;

  /**
   * Get the resolution of the arc.
   */
  getResolution(): number;

  /**
   * Get the negative flag of the arc.
   */
  getNegative(): boolean;

  /**
   * Get the output points precision.
   */
  getOutputPointsPrecision(): DesiredOutputPrecision;

  /**
   * Get the use normal and angle flag.
   */
  getUseNormalAndAngle(): boolean;

  /**
   *
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;

  /**
   * Set the first point of the arc.
   * @param {Vector3} point1 The first point's coordinates.
   */
  setPoint1(point1: Vector3): boolean;

  /**
   * Set the first point of the arc by reference.
   * @param {Vector3} point1 The first point's coordinates.
   */
  setPoint1From(point1: Vector3): boolean;

  /**
   * Set the second point of the arc.
   * @param {Vector3} point2 The second point's coordinates.
   */
  setPoint2(point2: Vector3): boolean;

  /**
   * Set the second point of the arc by reference.
   * @param {Vector3} point2 The second point's coordinates.
   */
  setPoint2From(point2: Vector3): boolean;

  /**
   * Set the center of the arc.
   * @param {Vector3} center The center point's coordinates.
   */
  setCenter(center: Vector3): boolean;

  /**
   * Set the center of the arc by reference.
   * @param {Vector3} center The center point's coordinates.
   */
  setCenterFrom(center: Vector3): boolean;

  /**
   * Set the normal vector of the arc.
   * @param {Vector3} normal The normal vector's coordinates.
   */
  setNormal(normal: Vector3): boolean;

  /**
   * Set the normal vector of the arc by reference.
   * @param {Vector3} normal The normal vector's coordinates.
   */
  setNormalFrom(normal: Vector3): boolean;

  /**
   * Set the polar vector of the arc.
   * @param {Vector3} polarVector The polar vector's coordinates.
   */
  setPolarVector(polarVector: Vector3): boolean;

  /**
   * Set the polar vector of the arc by reference.
   * @param {Vector3} polarVector The polar vector's coordinates.
   */
  setPolarVectorFrom(polarVector: Vector3): boolean;

  /**
   * Set the angle of the arc.
   * @param {Number} angle The angle in radians.
   */
  setAngle(angle: number): boolean;

  /**
   * Set the resolution of the arc.
   * @param {Number} resolution The number of points in the arc.
   */
  setResolution(resolution: number): boolean;

  /**
   * Set the negative flag of the arc.
   * @param {Boolean} negative If true, the arc will be drawn in the negative direction.
   */
  setNegative(negative: boolean): boolean;

  /**
   * Set the use normal and angle flag.
   * @param {Boolean} useNormalAndAngle If true, the normal and angle will be used to define the arc.
   */
  setUseNormalAndAngle(useNormalAndAngle: boolean): boolean;

  /**
   * Set the output points precision.
   * @param {DesiredOutputPrecision} precision The desired output precision.
   */
  setOutputPointsPrecision(precision: DesiredOutputPrecision): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkArcSource characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IArcSourceInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IArcSourceInitialValues
): void;

/**
 * Method used to create a new instance of vtkArcSource.
 * @param {IArcSourceInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IArcSourceInitialValues
): vtkArcSource;

/**
 * vtkArcSource is a source object that creates an arc defined by two endpoints
 * and a center. The number of segments composing the polyline is controlled by
 * setting the object resolution.
 *
 * @example
 * ```js
 * import vtkArcSource from '@kitware/vtk.js/Filters/Sources/ArcSource';
 *
 * const arc = vtkArcSource.newInstance();
 * const polydata = arc.getOutputData();
 * ```
 */
export declare const vtkArcSource: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkArcSource;
