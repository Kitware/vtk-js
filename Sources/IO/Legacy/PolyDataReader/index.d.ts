import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { Nullable } from '../../../types';
import { HtmlDataAccessHelper } from '../../Core/DataAccessHelper/HtmlDataAccessHelper';
import { HttpDataAccessHelper } from '../../Core/DataAccessHelper/HttpDataAccessHelper';
import { JSZipDataAccessHelper } from '../../Core/DataAccessHelper/JSZipDataAccessHelper';
import { LiteHttpDataAccessHelper } from '../../Core/DataAccessHelper/LiteHttpDataAccessHelper';

export interface IPolyDataReaderOptions {
  compression?: string;
  progressCallback?: any;
}

/**
 *
 */
export interface IPolyDataReaderInitialValues {
  url?: string;
  baseURL?: string;
  compression?: string;
  progressCallback?: any;
  dataAccessHelper?:
    | HtmlDataAccessHelper
    | HttpDataAccessHelper
    | JSZipDataAccessHelper
    | LiteHttpDataAccessHelper;
}

type vtkPolyDataReaderBase = vtkObject &
  Omit<
    vtkAlgorithm,
    | 'getInputData'
    | 'setInputData'
    | 'setInputConnection'
    | 'getInputConnection'
    | 'addInputConnection'
    | 'addInputData'
  >;

export interface vtkPolyDataReader extends vtkPolyDataReaderBase {
  /**
   *
   */
  getBaseURL(): Nullable<string>;

  /**
   * Get the url of the object to load.
   */
  getUrl(): Nullable<string>;

  /**
   *
   */
  getDataAccessHelper():
    | HtmlDataAccessHelper
    | HttpDataAccessHelper
    | JSZipDataAccessHelper
    | LiteHttpDataAccessHelper;

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
   * Set the url of the object to load.
   * @param {String} url the url of the object to load.
   * @param {IPolyDataReaderOptions} [option] The PolyData reader options.
   */
  setUrl(url: string, option?: IPolyDataReaderOptions): Promise<void>;

  /**
   * Load the object data.
   * @param {IPolyDataReaderOptions} [option]
   */
  loadData(option?: IPolyDataReaderOptions): Promise<void>;

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
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkPolyDataReader characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IPolyDataReaderInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IPolyDataReaderInitialValues
): void;

/**
 * Method used to create a new instance of vtkPolyDataReader
 * @param {IPolyDataReaderInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IPolyDataReaderInitialValues
): vtkPolyDataReader;

/**
 * The vtkPolyDataReader reads legacy VTK ASCII files. The current
 * implementation is limited to the geometry: no point, cell or field data is
 * read.
 */
export declare const vtkPolyDataReader: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkPolyDataReader;
