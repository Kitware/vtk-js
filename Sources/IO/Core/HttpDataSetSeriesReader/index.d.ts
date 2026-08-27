import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { Nullable, Range } from '../../../types';
import { HtmlDataAccessHelper } from '../DataAccessHelper/HtmlDataAccessHelper';
import { HttpDataAccessHelper } from '../DataAccessHelper/HttpDataAccessHelper';
import { JSZipDataAccessHelper } from '../DataAccessHelper/JSZipDataAccessHelper';
import { LiteHttpDataAccessHelper } from '../DataAccessHelper/LiteHttpDataAccessHelper';

export interface IHttpDataSetSeriesReaderOptions {
  fullpath?: boolean;
  compression?: string;
  loadData?: boolean;
}

/**
 *
 */
export interface IHttpDataSetSeriesReaderInitialValues {
  fetchGzip?: boolean;
  url?: string;
  baseURL?: string;
  dataAccessHelper?:
    | HtmlDataAccessHelper
    | HttpDataAccessHelper
    | JSZipDataAccessHelper
    | LiteHttpDataAccessHelper;
}

type vtkHttpDataSetSeriesReaderBase = vtkObject &
  Omit<
    vtkAlgorithm,
    | 'getInputData'
    | 'setInputData'
    | 'setInputConnection'
    | 'getInputConnection'
    | 'addInputConnection'
    | 'addInputData'
  >;

export interface vtkHttpDataSetSeriesReader extends vtkHttpDataSetSeriesReaderBase {
  /**
   * Get the base url used to download the individual time steps.
   */
  getBaseURL(): Nullable<string>;

  /**
   * Get the url of the series index to load.
   */
  getUrl(): Nullable<string>;

  /**
   * Fetch the series index and create one vtkHttpDataSetReader per time step.
   * Resolves with this reader once every time step has been fetched.
   * @param {Boolean} [loadData] Also download the arrays (default false).
   */
  updateMetaData(loadData?: boolean): Promise<vtkHttpDataSetSeriesReader>;

  /**
   * Set the url of the series to load. The url must point at an `index.json`
   * file, or at a folder containing one.
   * @param {String} url the url of the series to load.
   * @param {IHttpDataSetSeriesReaderOptions} [options]
   */
  setUrl(
    url: string,
    options?: IHttpDataSetSeriesReaderOptions
  ): Promise<vtkHttpDataSetSeriesReader>;

  /**
   * Get the sorted list of time steps defined in the series.
   */
  getTimeSteps(): number[];

  /**
   * Get the first and last time steps of the series, or an empty array when
   * the series is empty.
   */
  getTimeRange(): Range | [];

  /**
   * Make the reader of the latest time step at or before the given time the
   * current one, and expose its dataset as this reader's output.
   * @param {Number} timeStep
   */
  setUpdateTimeStep(timeStep: number): void;

  /**
   * Enable or disable a given array on the current time step reader.
   * @param {String} location
   * @param {String} name
   * @param {Boolean} [enable] (default true)
   */
  enableArray(location: string, name: string, enable?: boolean): void;

  /**
   * Download the enabled arrays of the current time step reader.
   */
  loadData(): void;

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
   *
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkHttpDataSetSeriesReader characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IHttpDataSetSeriesReaderInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IHttpDataSetSeriesReaderInitialValues
): void;

/**
 * Method used to create a new instance of vtkHttpDataSetSeriesReader
 * @param {IHttpDataSetSeriesReaderInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IHttpDataSetSeriesReaderInitialValues
): vtkHttpDataSetSeriesReader;

/**
 * The vtkHttpDataSetSeriesReader is a reader which can load datasets that vary
 * over time. It is a wrapper over multiple vtkHttpDataSetReader, one per time
 * step, described by an `index.json` file of the following shape:
 *
 * ```json
 * {
 *   "series": [
 *     { "url": "0", "timeStep": 0.0 },
 *     { "url": "1", "timeStep": 0.333333 }
 *   ]
 * }
 * ```
 *
 * @example
 * ```js
 * import vtkHttpDataSetSeriesReader from '@kitware/vtk.js/IO/Core/HttpDataSetSeriesReader';
 *
 * const reader = vtkHttpDataSetSeriesReader.newInstance();
 * reader.setUrl('https://kitware.github.io/vtk-js-datasets/data/temporal').then(() => {
 *   const [begin, end] = reader.getTimeRange();
 *   reader.setUpdateTimeStep((begin + end) / 2);
 * });
 * ```
 */
export declare const vtkHttpDataSetSeriesReader: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkHttpDataSetSeriesReader;
