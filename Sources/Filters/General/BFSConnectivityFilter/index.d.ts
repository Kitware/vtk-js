import { vtkAlgorithm, vtkObject } from '../../../interfaces';

export enum ExtractionMode {
  ExtractionMode_ALL,
  ExtractionMode_LARGEST,
  ExtractionMode_SMALLEST,
  ExtractionMode_CUSTOM,
}

/**
 *
 */
export interface IBFSConnectivityFilterInitialValues {
  extractionMode?: ExtractionMode;
  extractionIndex?: number;
  regionsCount?: number;
}

type vtkBFSConnectivityFilterBase = vtkObject & vtkAlgorithm;

export interface vtkBFSConnectivityFilter extends vtkBFSConnectivityFilterBase {
  /**
   * Get the ExtractionMode.
   */
  getExtractionMode(): ExtractionMode;

  /**
   * Get the extractionIndex.
   */
  getExtractionIndex(): number;

  /**
   * Get the count of regions.
   */
  getRegionsCount(): number;

  /**
   *
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;

  /**
   * Set the extractionMode to extract the required connected regions
   * @param {ExtractionMode} extractionMode
   */
  setExtractionMode(extractionMode: ExtractionMode): void;

  /**
   * Set the index to extract regions. should be 0 ~ regionsCount-1.
   * @param {Number} extractionIndex
   */
  setExtractionIndex(extractionIndex: number): void;

  /**
   * @param {Number} regionsCount
   */
  setRegionsCount(regionsCount: number): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkBFSConnectivityFilter characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IBFSConnectivityFilterInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IBFSConnectivityFilterInitialValues
): void;

/**
 * Method used to create a new instance of vtkBFSConnectivityFilter
 * @param {IBFSConnectivityFilterInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IBFSConnectivityFilterInitialValues
): vtkBFSConnectivityFilter;

/**
 * vtkBFSConnectivityFilter - Use BFS to find connected regions and extract regions
 * After searching for connected regions, set extractionMode(All, Largest, smallest)
 * or (Custom) and extractionIndex to extract the required connected regions.
 * The input output of the filter is polygonal data.
 */
export declare const vtkBFSConnectivityFilter: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkBFSConnectivityFilter;
