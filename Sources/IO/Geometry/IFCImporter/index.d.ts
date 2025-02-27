import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import vtkRenderer from '../../../Rendering/Core/Renderer';
import HtmlDataAccessHelper from '../../Core/DataAccessHelper/HtmlDataAccessHelper';
import HttpDataAccessHelper from '../../Core/DataAccessHelper/HttpDataAccessHelper';
import JSZipDataAccessHelper from '../../Core/DataAccessHelper/JSZipDataAccessHelper';
import LiteHttpDataAccessHelper from '../../Core/DataAccessHelper/LiteHttpDataAccessHelper';

interface IIFCImporterOptions {
  compression?: string;
  progressCallback?: any;
}

/**
 *
 */
export interface IIFCImporterInitialValues {
  mergeGeometries?: boolean;
}

type vtkIFCImporterBase = vtkObject &
  Omit<
    vtkAlgorithm,
    | 'getInputData'
    | 'setInputData'
    | 'setInputConnection'
    | 'getInputConnection'
    | 'addInputConnection'
    | 'addInputData'
  >;

export interface vtkIFCImporter extends vtkIFCImporterBase {
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
   * Import actors into the renderer.
   * @param {vtkRenderer} renderer The vtkRenderer to import the actors into.
   */
  importActors(renderer: vtkRenderer): void;

  /**
   * Load the object data.
   * @param {IIFCImporterOptions} [options]
   */
  loadData(options?: IIFCImporterOptions): Promise<any>;

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
   * @param {IIFCImporterOptions} [option] The PLY reader options.
   */
  setUrl(url: string, option?: IIFCImporterOptions): Promise<string | any>;
}

/**
 * Set WebIFC api to be used by vtkIFCImporter
 * @param {object} ifcApi
 */
export function setIFCAPI(ifcApi: any): void;

/**
 * Method used to decorate a given object (publicAPI+model) with vtkIFCImporter characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IIFCImporterInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IIFCImporterInitialValues
): void;

/**
 * Method used to create a new instance of vtkIFCImporter
 * @param {IIFCImporterInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IIFCImporterInitialValues
): vtkIFCImporter;

/**
 * vtkIFCImporter is a source object that reads Industry Foundation Class(IFC) files.
 *
 * The vtkIFCImporter is using web-ifc library to parse the IFC file.
 *
 * @example
 * ```js
 * import vtkResourceLoader from '@kitware/vtk.js/IO/Core/ResourceLoader';
 * import vtkIFCImporter from '@kitware/vtk.js/IO/Geometry/IFCImporter';
 *
 * function update() {
 *   importer.onReady(() => {
 *     importer.importActors(renderer);
 *     renderer.resetCamera();
 *     renderWindow.render();
 *   });
 * }
 *
 * vtkResourceLoader
 * .loadScript('https://cdn.jsdelivr.net/npm/web-ifc@0.0.55/web-ifc-api-iife.js')
 * .then(() => {
 *   // Pass WebIFC api to vtkIFCImporter
 *   vtkIFCImporter.setIFCAPI(window.WebIFC);
 *
 *   // Trigger data download
 *   importer.setUrl(`${__BASE_PATH__}/data/ifc/house.ifc`).then(update);
 * });
 * ```
 */
export declare const vtkIFCImporter: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  setIFCAPI: typeof setIFCAPI;
};
export default vtkIFCImporter;
