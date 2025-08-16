import { DesiredOutputPrecision } from '../../../Common/DataModel/DataSetAttributes';
import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import vtkPlanes from '../../../Common/DataModel/Planes';

/**
 *
 */
export interface IFrustumSourceInitialValues {
  planes?: vtkPlanes;
  showLines?: boolean;
  outputPointsPrecision?: DesiredOutputPrecision;
}

type vtkFrustumSourceBase = vtkObject &
  Omit<
    vtkAlgorithm,
    | 'getInputData'
    | 'setInputData'
    | 'setInputConnection'
    | 'getInputConnection'
    | 'addInputConnection'
    | 'addInputData'
  >;

export interface vtkFrustumSource extends vtkFrustumSourceBase {
  /**
   * Get the output points precision.
   */
  getOutputPointsPrecision(): DesiredOutputPrecision;

  /**
   * Get the planes defining the frustum.
   */
  getPlanes(): vtkPlanes;

  /**
   * Get whether to show lines.
   */
  getShowLines(): boolean;

  /**
   *
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;

  /**
   * Set the output points precision.
   * @param {DesiredOutputPrecision} precision
   */
  setOutputPointsPrecision(precision: DesiredOutputPrecision): boolean;

  /**
   * Set the planes defining the frustum.
   * @param {vtkPlanes} planes
   */
  setPlanes(planes: vtkPlanes): boolean;

  /**
   * Set whether to show lines.
   * @param {Boolean} showLines
   */
  setShowLines(showLines: boolean): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkFrustumSource characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IFrustumSourceInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IFrustumSourceInitialValues
): void;

/**
 * Method used to create a new instance of vtkFrustumSource.
 * @param {IFrustumSourceInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IFrustumSourceInitialValues
): vtkFrustumSource;

/**
 * vtkFrustumSource creates a frustum defines by a set of planes. The frustum is
 * represented with four-sided polygons. It is possible to specify extra lines
 * to better visualize the field of view.
 *
 * @example
 * ```js
 * import vtkFrustumSource from '@kitware/vtk.js/Filters/Sources/FrustumSource';
 *
 * const frustum = vtkFrustumSource.newInstance();
 * const camera = vtkCamera.newInstance();
 * camera.setClippingRange(0.1, 0.4);
 * const planesArray = camera.getFrustumPlanes(1.0);
 * const planes = vtkPlanes.newInstance();
 * planes.setFrustumPlanes(planesArray);
 * frustum.setPlanes(planes);
 * frustum.setShowLines(false);
 * ```
 */
export declare const vtkFrustumSource: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkFrustumSource;
