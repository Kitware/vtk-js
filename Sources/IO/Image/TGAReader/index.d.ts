import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { HtmlDataAccessHelper } from '../../Core/DataAccessHelper/HtmlDataAccessHelper';
import { HttpDataAccessHelper } from '../../Core/DataAccessHelper/HttpDataAccessHelper';
import { JSZipDataAccessHelper } from '../../Core/DataAccessHelper/JSZipDataAccessHelper';
import { LiteHttpDataAccessHelper } from '../../Core/DataAccessHelper/LiteHttpDataAccessHelper';

interface ITGAReaderOptions {
  compression?: string;
  progressCallback?: any;
}

/**
 *
 */
export interface ITGAReaderInitialValues {}

type vtkTGAReaderBase = vtkObject &
  Omit<
    vtkAlgorithm,
    | 'getInputData'
    | 'setInputData'
    | 'setInputConnection'
    | 'getInputConnection'
    | 'addInputConnection'
    | 'addInputData'
  >;

export interface vtkTGAReader extends vtkTGAReaderBase {
  /**
   * Get the base url.
   */
  getBaseURL(): string;

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
   * @param {ITGAReaderOptions} [options]
   */
  loadData(options?: ITGAReaderOptions): Promise<any>;

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
   * @param {ITGAReaderOptions} [option] The PLY reader options.
   */
  setUrl(url: string, option?: ITGAReaderOptions): Promise<string | any>;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkTGAReader characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ITGAReaderInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ITGAReaderInitialValues
): void;

/**
 * Method used to create a new instance of vtkTGAReader
 * @param {ITGAReaderInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: ITGAReaderInitialValues
): vtkTGAReader;

/**
 * vtkTGAReader is a source object that reads Truevision Targa(TGA) files.
 */
export declare const vtkTGAReader: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkTGAReader;
