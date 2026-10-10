import { vtkAlgorithm, vtkObject, vtkSubscription } from '../../../interfaces';
import { Nullable } from '../../../types';
import { HtmlDataAccessHelper } from '../../Core/DataAccessHelper/HtmlDataAccessHelper';
import { HttpDataAccessHelper } from '../../Core/DataAccessHelper/HttpDataAccessHelper';
import { JSZipDataAccessHelper } from '../../Core/DataAccessHelper/JSZipDataAccessHelper';
import { LiteHttpDataAccessHelper } from '../../Core/DataAccessHelper/LiteHttpDataAccessHelper';

export interface ISkyboxReaderOptions {
  compression?: string;
  progressCallback?: any;
}

export interface ISkyboxFaceTransform {
  flipX?: boolean;
  flipY?: boolean;
  rotate?: number;
}

/**
 * Mapping of a skybox face index to the image it should be filled with.
 * The order is right, left, up, down, back, front.
 */
export interface ISkyboxFaceMapping {
  fileName: string;
  transform?: ISkyboxFaceTransform;
}

/**
 *
 */
export interface ISkyboxReaderInitialValues {
  url?: string;
  busy?: boolean;
  faceMapping?: ISkyboxFaceMapping[];

  /**
   * Data access helper used to fetch the zip. It has no accessor, so it can
   * only be provided through the initial values.
   */
  dataAccessHelper?:
    | HtmlDataAccessHelper
    | HttpDataAccessHelper
    | JSZipDataAccessHelper
    | LiteHttpDataAccessHelper;
}

type vtkSkyboxReaderBase = vtkObject &
  Omit<
    vtkAlgorithm,
    | 'getInputData'
    | 'setInputData'
    | 'setInputConnection'
    | 'getInputConnection'
    | 'addInputConnection'
    | 'addInputData'
  >;

export interface vtkSkyboxReader extends vtkSkyboxReaderBase {
  /**
   * Get the url of the zip to load.
   */
  getUrl(): Nullable<string>;

  /**
   * Camera positions found in the loaded zip.
   */
  getPositions(): string[];

  /**
   * Camera position currently exposed as the output texture.
   */
  getPosition(): string;

  /**
   * Select the camera position to expose as the output texture. Ignored when
   * the name is not one of `getPositions()`.
   * @param {String} name
   */
  setPosition(name: string): void;

  /**
   *
   */
  getFaceMapping(): ISkyboxFaceMapping[];

  /**
   * Set which image of a position folder goes on which cube face, and how it
   * must be transformed. Overridden by the `index.json` of the zip when it
   * declares a face mapping.
   * @param {ISkyboxFaceMapping[]} faceMapping
   */
  setFaceMapping(faceMapping: ISkyboxFaceMapping[]): boolean;

  /**
   * Set the url of the zip to load and fetch it.
   * @param {String} url the url of the zip to load.
   * @param {ISkyboxReaderOptions} [option] The Skybox reader options.
   */
  setUrl(url: string, option?: ISkyboxReaderOptions): Promise<any>;

  /**
   * Load the object data.
   * @param {ISkyboxReaderOptions} [option]
   */
  loadData(option?: ISkyboxReaderOptions): Promise<any>;

  /**
   * Unzip the given buffer and build one vtkTexture per camera position it
   * contains. Returns false when no content is given.
   * @param {ArrayBuffer} content The content to parse.
   */
  parseAsArrayBuffer(content: ArrayBuffer): Promise<vtkSkyboxReader> | false;

  /**
   * Promise resolving with this reader once the images are all decoded.
   */
  getReadyPromise(): Promise<vtkSkyboxReader>;

  /**
   * Get the current status of the reader. True means busy and False means
   * idle.
   */
  isBusy(): boolean;

  /**
   *
   * @param {Boolean} busy
   */
  invokeBusy(busy: boolean): void;

  /**
   *
   * @param callback
   */
  onBusy(callback: (busy: boolean) => any): vtkSubscription;

  /**
   *
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkSkyboxReader characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ISkyboxReaderInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ISkyboxReaderInitialValues
): void;

/**
 * Method used to create a new instance of vtkSkyboxReader
 * @param {ISkyboxReaderInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: ISkyboxReaderInitialValues
): vtkSkyboxReader;

/**
 * vtkSkyboxReader reads a zip file containing one or more camera positions,
 * each holding the six jpg images composing a skybox texture. The mapping of
 * the images onto the cube faces comes either from `setFaceMapping()` or from
 * an `index.json` embedded in the zip:
 *
 * ```json
 * {
 *   "skybox": {
 *     "faceMapping": [
 *       { "fileName": "right.jpg", "transform": { "flipY": true } }
 *     ]
 *   }
 * }
 * ```
 */
export declare const vtkSkyboxReader: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkSkyboxReader;
