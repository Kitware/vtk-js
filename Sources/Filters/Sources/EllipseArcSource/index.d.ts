import { DesiredOutputPrecision } from '../../../Common/DataModel/DataSetAttributes';
import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { Vector3 } from '../../../types';

/**
 *
 */
export interface IEllipseArcSourceInitialValues {
  center?: Vector3;
  normal?: Vector3;
  majorRadiusVector?: Vector3;
  startAngle?: number;
  segmentAngle?: number;
  resolution?: number;
  close?: boolean;
  outputPointsPrecision?: DesiredOutputPrecision;
  ratio?: number;
}

type vtkEllipseArcSourceBase = vtkObject &
  Omit<
    vtkAlgorithm,
    | 'getInputData'
    | 'setInputData'
    | 'setInputConnection'
    | 'getInputConnection'
    | 'addInputConnection'
    | 'addInputData'
  >;

export interface vtkEllipseArcSource extends vtkEllipseArcSourceBase {
  /**
   * Get whether the arc is closed.
   */
  getClose(): boolean;

  /**
   * Get the center of the arc.
   */
  getCenter(): Vector3;

  /**
   * Get the center of the arc by reference.
   */
  getCenterByReference(): Vector3;

  /**
   * Get the major radius vector of the arc.
   */
  getMajorRadiusVector(): Vector3;

  /**
   * Get the major radius vector of the arc by reference.
   */
  getMajorRadiusVectorByReference(): Vector3;

  /**
   * Get the normal vector of the arc.
   */
  getNormal(): Vector3;

  /**
   * Get the normal vector of the arc by reference.
   */
  getNormalByReference(): Vector3;

  /**
   * Get the output points precision.
   */
  getOutputPointsPrecision(): DesiredOutputPrecision;

  /**
   * Get the ratio of the arc.
   */
  getRatio(): number;

  /**
   * Get the resolution of the arc.
   */
  getResolution(): number;

  /**
   * Get the segment angle of the arc.
   */
  getSegmentAngle(): number;

  /**
   * Get the start angle of the arc.
   */
  getStartAngle(): number;

  /**
   *
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;

  /**
   * Set whether the arc is closed.
   * @param {Boolean} close Whether the arc is closed.
   */
  setClose(close: boolean): boolean;

  /**
   * Set the center of the arc.
   * @param {Vector3} center The center's coordinates.
   */
  setCenter(center: Vector3): boolean;

  /**
   * Set the center of the arc by reference.
   * @param {Vector3} center The center's coordinates.
   */
  setCenterFrom(center: Vector3): boolean;

  /**
   * Set the major radius vector of the arc.
   * @param {Vector3} majorRadiusVector The major radius vector's coordinates.
   */
  setMajorRadiusVector(majorRadiusVector: Vector3): boolean;

  /**
   * Set the major radius vector of the arc by reference.
   * @param {Vector3} majorRadiusVector The major radius vector's coordinates.
   */
  setMajorRadiusVectorFrom(majorRadiusVector: Vector3): boolean;

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
   * Set the output points precision.
   * @param {DesiredOutputPrecision} precision The desired output precision.
   */
  setOutputPointsPrecision(precision: DesiredOutputPrecision): boolean;

  /**
   * Set the ratio of the arc.
   * @param {Number} ratio The ratio of the arc.
   */
  setRatio(ratio: number): boolean;

  /**
   * Set the resolution of the arc.
   * @param {Number} resolution The number of points in the arc.
   */
  setResolution(resolution: number): boolean;

  /**
   * Set the segment angle of the arc.
   * @param {Number} segmentAngle The segment angle in degrees.
   */
  setSegmentAngle(segmentAngle: number): boolean;

  /**
   * Set the start angle of the arc.
   * @param {Number} startAngle The start angle in degrees.
   */
  setStartAngle(startAngle: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with
 * vtkEllipseArcSource characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IEllipseArcSourceInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IEllipseArcSourceInitialValues
): void;

/**
 * Method used to create a new instance of vtkEllipseArcSource.
 * @param {IEllipseArcSourceInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IEllipseArcSourceInitialValues
): vtkEllipseArcSource;

/**
 * vtkEllipseArcSource is a source object that creates an elliptical arc defined
 * by a normal, a center and the major radius vector. You can define an angle to
 * draw only a section of the ellipse. The number of segments composing the
 * polyline is controlled by setting the object resolution.
 *
 * @example
 * ```js
 * import vtkEllipseArcSource from '@kitware/vtk.js/Filters/Sources/EllipseArcSource';
 *
 * const arc = vtkEllipseArcSource.newInstance();
 * const polydata = arc.getOutputData();
 * ```
 */
export declare const vtkEllipseArcSource: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkEllipseArcSource;
