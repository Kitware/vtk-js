import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { HtmlDataAccessHelper } from '../../Core/DataAccessHelper/HtmlDataAccessHelper';
import { HttpDataAccessHelper } from '../../Core/DataAccessHelper/HttpDataAccessHelper';
import { JSZipDataAccessHelper } from '../../Core/DataAccessHelper/JSZipDataAccessHelper';
import { LiteHttpDataAccessHelper } from '../../Core/DataAccessHelper/LiteHttpDataAccessHelper';

interface ISTLReaderOptions {
  binary?: boolean;
  compression?: string;
  progressCallback?: any;
}

/**
 *
 */
export interface ISTLReaderInitialValues {
  /**
   * Data access helper used for loading remote resources.
   */
  dataAccessHelper?:
    | HtmlDataAccessHelper
    | HttpDataAccessHelper
    | JSZipDataAccessHelper
    | LiteHttpDataAccessHelper;

  /**
   * Point locator used for vertex merging.
   */
  locator?: any;

  /**
   * Enable/disable point merging.
   * Default is true.
   */
  merging?: boolean;

  /**
   * Merge tolerance power.
   * If >= 0, points within 10^-tolerance are merged.
   * Default is -1 (disabled).
   */
  removeDuplicateVertices?: number;
}

type vtkSTLReaderBase = vtkObject &
  Omit<
    vtkAlgorithm,
    | 'getInputData'
    | 'setInputData'
    | 'setInputConnection'
    | 'getInputConnection'
    | 'addInputConnection'
    | 'addInputData'
  >;

export interface vtkSTLReader extends vtkSTLReaderBase {
  /**
   *
   */
  getBaseURL(): string;

  /**
   *
   */
  getDataAccessHelper():
    | HtmlDataAccessHelper
    | HttpDataAccessHelper
    | JSZipDataAccessHelper
    | LiteHttpDataAccessHelper;

  /**
   * Get the point locator used for vertex merging.
   */
  getLocator(): any;

  /**
   * Get whether point merging is enabled.
   */
  getMerging(): boolean;

  /**
   * Get the url of the object to load.
   */
  getUrl(): string;

  /**
   * Get tolerance when removeDuplicateVertices is set
   */
  getRemoveDuplicateVertices(): number;

  /**
   * Load the object data.
   * @param {ISTLReaderOptions} [options]
   */
  loadData(options?: ISTLReaderOptions): Promise<any>;

  /**
   * Parse data.
   * @param {String | ArrayBuffer} content The content to parse.
   */
  parse(content: string | ArrayBuffer): void;

  /**
   * Parse data as ArrayBuffer.
   * @param {ArrayBuffer} content The content to parse.
   */
  parseAsArrayBuffer(content: ArrayBuffer): void;

  /**
   * Parse data as text.
   * @param {String} content The content to parse.
   */
  parseAsText(content: string): void;

  /**
   *
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;

  /**
   *
   * @param dataAccessHelper
   */
  setDataAccessHelper(
    dataAccessHelper:
      | HtmlDataAccessHelper
      | HttpDataAccessHelper
      | JSZipDataAccessHelper
      | LiteHttpDataAccessHelper
  ): boolean;

  /**
   * Set a point locator used for vertex merging.
   */
  setLocator(locator: any): boolean;

  /**
   * Enable/disable point merging.
   */
  setMerging(merging: boolean): boolean;

  /**
   * Set the url of the object to load.
   * @param {String} url the url of the object to load.
   * @param {ISTLReaderOptions} [option] The STL reader options.
   */
  setUrl(url: string, option?: ISTLReaderOptions): Promise<string | any>;

  /**
   * Turn on/off automatic removeDuplicateVertices
   * After reading the STL file, if `tolerance` is >= 0, then points with the same coordinates at 10 power tolerance are merged.
   * For a smooth rendering, you might want to compute normals with vtkPolyDataNormals.
   *
   *  @param {Number} tolerance
   */
  setRemoveDuplicateVertices(tolerance: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkSTLReader characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ISTLReaderInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ISTLReaderInitialValues
): void;

/**
 * Method used to create a new instance of vtkSTLReader
 * @param {ISTLReaderInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: ISTLReaderInitialValues
): vtkSTLReader;

/**
 * vtkSTLReader is a source object that reads ASCII or binary stereo lithography
 * files (.stl files). The object automatically detects whether the file is
 * ASCII or binary. .stl files are quite inefficient since they duplicate vertex
 * definitions.
 */
export declare const vtkSTLReader: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkSTLReader;
