import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { HtmlDataAccessHelper } from '../../Core/DataAccessHelper/HtmlDataAccessHelper';
import { HttpDataAccessHelper } from '../../Core/DataAccessHelper/HttpDataAccessHelper';
import { JSZipDataAccessHelper } from '../../Core/DataAccessHelper/JSZipDataAccessHelper';
import { LiteHttpDataAccessHelper } from '../../Core/DataAccessHelper/LiteHttpDataAccessHelper';

interface IDracoReaderOptions {
  binary?: boolean;
  compression?: string;
  progressCallback?: any;
}

/**
 *
 */
export interface IDracoReaderInitialValues {}

type vtkDracoReaderBase = vtkObject &
  Omit<
    vtkAlgorithm,
    | 'getInputData'
    | 'setInputData'
    | 'setInputConnection'
    | 'getInputConnection'
    | 'addInputConnection'
    | 'addInputData'
  >;

export interface vtkDracoReader extends vtkDracoReaderBase {
  /**
   *
   */
  getBaseURL(): string | undefined;

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
  getUrl(): string | undefined;

  /**
   * Load the object data.
   * @param {IDracoReaderOptions} [options]
   */
  loadData(options?: IDracoReaderOptions): Promise<any>;

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
   * Parse the data set through `setUrl` or `parseAsArrayBuffer` and publish it
   * on the output port.
   */
  requestData(): void;

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
   * @param {IDracoReaderOptions} [option] The Draco reader options.
   */
  setUrl(url: string, option?: IDracoReaderOptions): Promise<string | any>;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkDracoReader characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IDracoReaderInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IDracoReaderInitialValues
): void;

/**
 * Method used to create a new instance of vtkDracoReader
 * @param {IDracoReaderInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IDracoReaderInitialValues
): vtkDracoReader;

/**
 * Get the draco decoder
 */
declare function getDracoDecoder(): any;

/**
 * Set the draco decoder
 * @param dracoDecoder
 */
declare function setDracoDecoder(dracoDecoder: any): Promise<any>;

/**
 * Load the WASM decoder from url and set the decoderModule
 * @param url
 * @param binaryName
 */
declare function setWasmBinary(
  url: string,
  binaryName: string
): Promise<boolean>;

/**
 * vtkDracoReader is a source object that reads a geometry compressed with the
 * Draco library.
 */
export declare const vtkDracoReader: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  getDracoDecoder: typeof getDracoDecoder;
  setDracoDecoder: typeof setDracoDecoder;
  setWasmBinary: typeof setWasmBinary;
};
export default vtkDracoReader;
