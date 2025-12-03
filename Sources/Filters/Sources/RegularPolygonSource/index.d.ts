import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { Vector3 } from '../../../types';
import { DesiredOutputPrecision } from '../../../Common/DataModel/DataSetAttributes';

/**
 *
 */
export interface IPlaneSourceInitialValues {
  numberOfSides?: number;
  center?: Vector3;
  normal?: Vector3;
  radius?: number;
  generatePolygon?: boolean;
  generatePolyline?: boolean;
  outputPointsPrecision?: DesiredOutputPrecision;
}

type vtkRegularPolygonSourceBase = vtkObject &
  Omit<
    vtkAlgorithm,
    | 'getInputData'
    | 'setInputData'
    | 'setInputConnection'
    | 'getInputConnection'
    | 'addInputConnection'
    | 'addInputData'
  >;

export interface vtkRegularPolygonSource extends vtkRegularPolygonSourceBase {
  /**
   * Get the center of the regular polygon.
   * @returns {Vector3} center of the polygon
   */
  getCenter(): Vector3;

  /**
   * Get a reference to the center of the regular polygon.
   * @returns {Vector3} reference to the center of the polygon
   */
  getCenterByReference(): Vector3;

  /**
   * Get whether to generate polygon points.
   * @returns {Boolean} true if polygon points are generated, false otherwise
   */
  getGeneratePolygon(): boolean;

  /**
   * Get whether to generate polyline points.
   * @returns {Boolean} true if polyline points are generated, false otherwise
   */
  getGeneratePolyline(): boolean;

  /**
   * Get the normal of the regular polygon.
   * @returns {Vector3} normal of the polygon
   */
  getNormal(): Vector3;

  /**
   * Get a reference to the normal of the regular polygon.
   * @returns {Vector3} reference to the normal of the polygon
   */
  getNormalByReference(): Vector3;

  /**
   * Get the number of sides for the regular polygon.
   * @returns {Number} number of sides
   */
  getNumberOfSides(): number;

  /**
   * Get the output points precision.
   * @returns {DesiredOutputPrecision} the output points precision
   */
  getOutputPointsPrecision(): DesiredOutputPrecision;

  /**
   * Get the radius of the regular polygon.
   * @returns {Number} radius of the polygon
   */
  getRadius(): number;

  /**
   *
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;

  /**
   * Set the center of the regular polygon.
   * @param {Vector3} center
   * @returns {Boolean} true if the value was changed, false otherwise
   */
  setCenter(center: Vector3): boolean;

  /**
   * Set whether to generate polygon points.
   * @param generatePolygon
   * @returns {Boolean} true if the value was changed, false otherwise
   */
  setGeneratePolygon(generatePolygon: boolean): boolean;

  /**
   * Set whether to generate polyline points.
   * @param generatePolyline
   * @returns {Boolean} true if the value was changed, false otherwise
   */
  setGeneratePolyline(generatePolyline: boolean): boolean;

  /**
   * Set the normal of the regular polygon.
   * @param {Vector3} normal
   * @returns {Boolean} true if the value was changed, false otherwise
   */
  setNormal(normal: Vector3): boolean;

  /**
   * Set the number of sides for the regular polygon.
   * @param numberOfSides
   * @returns {Boolean} true if the value was changed, false otherwise
   */
  setNumberOfSides(numberOfSides: number): boolean;

  /**
   * Set the output points precision.
   * @param outputPointsPrecision
   * @returns {Boolean} true if the value was changed, false otherwise
   */
  setOutputPointsPrecision(
    outputPointsPrecision: DesiredOutputPrecision
  ): boolean;

  /**
   * Set the radius of the regular polygon.
   * @param radius
   * @returns {Boolean} true if the value was changed, false otherwise
   */
  setRadius(radius: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkRegularPolygonSource characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IPlaneSourceInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IPlaneSourceInitialValues
): void;

/**
 * Method used to create a new instance of vtkRegularPolygonSource.
 * @param {IPlaneSourceInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IPlaneSourceInitialValues
): vtkRegularPolygonSource;

/**
 * vtkRegularPolygonSource is a source object that creates a single n-sided
 * polygon and/or polyline. The polygon is centered at a specified point,
 * orthogonal to a specified normal, and with a circumscribing radius set by the
 * user. The user can also specify the number of sides of the polygon ranging
 * from [3,N].
 *
 * @example
 * ```js
 * import vtkRegularPolygonSource from '@kitware/vtk.js/Filters/Sources/RegularPolygonSource';
 *
 * const regularPolygonSource = vtkRegularPolygonSource.newInstance();
 * const polydata = regularPolygonSource.getOutputData();
 * ```
 */
export declare const vtkRegularPolygonSource: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkRegularPolygonSource;
