import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { Nullable } from '../../../types';
import { HtmlDataAccessHelper } from '../DataAccessHelper/HtmlDataAccessHelper';
import { HttpDataAccessHelper } from '../DataAccessHelper/HttpDataAccessHelper';
import { JSZipDataAccessHelper } from '../DataAccessHelper/JSZipDataAccessHelper';
import { LiteHttpDataAccessHelper } from '../DataAccessHelper/LiteHttpDataAccessHelper';

export interface IZipMultiDataSetReaderOptions {
  compression?: string;
  progressCallback?: any;
}

/**
 *
 */
export interface IZipMultiDataSetReaderInitialValues {
  url?: string;
  baseURL?: string;
  dataAccessHelper?:
    | HtmlDataAccessHelper
    | HttpDataAccessHelper
    | JSZipDataAccessHelper
    | LiteHttpDataAccessHelper;
}

type vtkZipMultiDataSetReaderBase = vtkObject &
  Omit<
    vtkAlgorithm,
    | 'getInputData'
    | 'setInputData'
    | 'setInputConnection'
    | 'getInputConnection'
    | 'addInputConnection'
    | 'addInputData'
    | 'getOutputData'
    | 'getOutputPort'
  >;

export interface vtkZipMultiDataSetReader extends vtkZipMultiDataSetReaderBase {
  /**
   *
   */
  getBaseURL(): Nullable<string>;

  /**
   * Get the url of the zip to load.
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
   * Set the url of the zip to load and fetch it.
   * @param {String} url the url of the zip to load.
   * @param {IZipMultiDataSetReaderOptions} [option]
   */
  setUrl(url: string, option?: IZipMultiDataSetReaderOptions): Promise<void>;

  /**
   * Fetch and parse the zip at the currently set url.
   * @param {IZipMultiDataSetReaderOptions} [option]
   */
  loadData(option?: IZipMultiDataSetReaderOptions): Promise<void>;

  /**
   * Unzip the given buffer, reading `datasets.json` and every `array_*` entry
   * it contains.
   * @param {ArrayBuffer} arrayBuffer The content to parse.
   */
  parseAsArrayBuffer(arrayBuffer: ArrayBuffer): Promise<void>;

  /**
   *
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkZipMultiDataSetReader characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IZipMultiDataSetReaderInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IZipMultiDataSetReaderInitialValues
): void;

/**
 * Method used to create a new instance of vtkZipMultiDataSetReader
 * @param {IZipMultiDataSetReaderInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IZipMultiDataSetReaderInitialValues
): vtkZipMultiDataSetReader;

/**
 * vtkZipMultiDataSetReader reads a zip archive produced by
 * vtkZipMultiDataSetWriter: a `datasets.json` metadata file alongside one
 * binary file per data array.
 */
export declare const vtkZipMultiDataSetReader: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkZipMultiDataSetReader;
