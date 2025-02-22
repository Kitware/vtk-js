import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import HtmlDataAccessHelper from '../../Core/DataAccessHelper/HtmlDataAccessHelper';
import HttpDataAccessHelper from '../../Core/DataAccessHelper/HttpDataAccessHelper';
import JSZipDataAccessHelper from '../../Core/DataAccessHelper/JSZipDataAccessHelper';
import LiteHttpDataAccessHelper from '../../Core/DataAccessHelper/LiteHttpDataAccessHelper';

interface IGCodeReaderOptions {
  binary?: boolean;
  compression?: string;
  progressCallback?: any;
}

/**
 *
 */
export interface IGCodeReaderInitialValues {}

type vtkGCodeReaderBase = vtkObject &
  Omit<
    vtkAlgorithm,
    | 'getInputData'
    | 'setInputData'
    | 'setInputConnection'
    | 'getInputConnection'
    | 'addInputConnection'
    | 'addInputData'
  >;

export interface vtkGCodeReader extends vtkGCodeReaderBase {
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
   * Get the url of the object to load.
   */
  getUrl(): string;

  /**
   * Load the object data.
   * @param {IGCodeReaderOptions} [options]
   */
  loadData(options?: IGCodeReaderOptions): Promise<any>;

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
   * Set the url of the object to load.
   * @param {String} url the url of the object to load.
   * @param {IGCodeReaderOptions} [option] The PLY reader options.
   */
  setUrl(url: string, option?: IGCodeReaderOptions): Promise<string | any>;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkGCodeReader characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IGCodeReaderInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IGCodeReaderInitialValues
): void;

/**
 * Method used to create a new instance of vtkGCodeReader
 * @param {IGCodeReaderInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IGCodeReaderInitialValues
): vtkGCodeReader;

/**
 * vtkGCodeReader is a source object that reads a GCODE file.
 */
export declare const vtkGCodeReader: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkGCodeReader;
