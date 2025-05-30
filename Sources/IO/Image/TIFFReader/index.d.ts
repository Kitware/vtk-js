import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { HtmlDataAccessHelper } from '../../Core/DataAccessHelper/HtmlDataAccessHelper';
import { HttpDataAccessHelper } from '../../Core/DataAccessHelper/HttpDataAccessHelper';
import { JSZipDataAccessHelper } from '../../Core/DataAccessHelper/JSZipDataAccessHelper';
import { LiteHttpDataAccessHelper } from '../../Core/DataAccessHelper/LiteHttpDataAccessHelper';

interface ITIFFReaderOptions {
  compression?: string;
  progressCallback?: any;
  flipY?: boolean;
}

/**
 *
 */
export interface ITIFFReaderInitialValues {}

type vtkTIFFReaderBase = vtkObject &
  Omit<
    vtkAlgorithm,
    | 'getInputData'
    | 'setInputData'
    | 'setInputConnection'
    | 'getInputConnection'
    | 'addInputConnection'
    | 'addInputData'
  >;

export interface vtkTIFFReader extends vtkTIFFReaderBase {
  /**
   * Get the base url.
   */
  getBaseURL(): string;

  /**
   * Get if the image is flipped vertically.
   */
  getFlipY(): boolean;

  /**
   * Get the dataAccess helper.
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
   * @param {ITIFFReaderOptions} [options]
   */
  loadData(options?: ITIFFReaderOptions): Promise<any>;

  /**
   * Parse data.
   * @param {ArrayBuffer} content The content to parse.
   */
  parse(content: ArrayBuffer): void;

  /**
   * Parse data as ArrayBuffer.
   * @param {ArrayBuffer} content The content to parse.
   */
  parseAsArrayBuffer(content: ArrayBuffer): void;

  /**
   *
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;

  /**
   * Flip the image vertically.
   * @param {String} flipY If true, flip the image vertically.
   */
  setFlipY(flipY: boolean): boolean;

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
   * @param {ITIFFReaderOptions} [option] The PLY reader options.
   */
  setUrl(url: string, option?: ITIFFReaderOptions): Promise<string | any>;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkTIFFReader characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ITIFFReaderInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ITIFFReaderInitialValues
): void;

/**
 * Method used to create a new instance of vtkTIFFReader
 * @param {ITIFFReaderInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: ITIFFReaderInitialValues
): vtkTIFFReader;

/**
 * vtkTIFFReader is a source object that reads TIFF files.
 */
export declare const vtkTIFFReader: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkTIFFReader;
