import { vtkAlgorithm, vtkObject } from '../../../interfaces';

/**
 *
 */
export interface IClosedPolyLineToSurfaceFilterInitialValues {}

type vtkClosedPolyLineToSurfaceFilterBase = vtkObject & vtkAlgorithm;

export interface vtkClosedPolyLineToSurfaceFilter extends vtkClosedPolyLineToSurfaceFilterBase {
  /**
   *
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkClosedPolyLineToSurfaceFilter characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IClosedPolyLineToSurfaceFilterInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IClosedPolyLineToSurfaceFilterInitialValues
): void;

/**
 * Method used to create a new instance of vtkClosedPolyLineToSurfaceFilter
 * @param {IClosedPolyLineToSurfaceFilterInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IClosedPolyLineToSurfaceFilterInitialValues
): vtkClosedPolyLineToSurfaceFilter;

/**
 * vtkClosedPolyLineToSurfaceFilter - converts closed polylines into polygons
 *
 * vtkClosedPolyLineToSurfaceFilter aggregates the line segments of its input
 * into closed loops and emits one polygon per loop. The output is a shallow
 * copy of the input with its polys replaced by the reconstructed faces.
 */
export declare const vtkClosedPolyLineToSurfaceFilter: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkClosedPolyLineToSurfaceFilter;
