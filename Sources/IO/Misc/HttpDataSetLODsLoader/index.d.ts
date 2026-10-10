import { vtkObject } from '../../../interfaces';
import { Nullable } from '../../../types';
import vtkHttpDataSetReader from '../../Core/HttpDataSetReader';
import vtkMapper from '../../../Rendering/Core/Mapper';

/**
 *
 */
export interface IHttpDataSetLODsLoaderInitialValues {
  baseUrl?: string;
  files?: string[];
  mapper?: vtkMapper;
  sceneItem?: any;
  stepFinishedCallback?: () => void;
  /**
   * Delay in milliseconds before the first level of detail is downloaded.
   */
  waitTimeToStart?: number;
  /**
   * Delay in milliseconds between two level of detail downloads.
   */
  waitTimeBetweenDownloads?: number;
}

export interface vtkHttpDataSetLODsLoader extends vtkObject {
  /**
   * Download every file of `files` in order, connecting each newly loaded
   * source to `mapper` as it arrives, so the rendered level of detail
   * improves over time.
   */
  startDownloads(): void;

  /**
   * Reader of the most recently created source.
   */
  getCurrentSource(): Nullable<vtkHttpDataSetReader>;

  /**
   *
   */
  getBaseUrl(): string;

  /**
   * Url prefix prepended to every entry of `files`.
   * @param {String} baseUrl
   */
  setBaseUrl(baseUrl: string): boolean;

  /**
   * File names of the levels of detail, from coarsest to finest.
   */
  getFiles(): string[];

  /**
   *
   * @param {String[]} files
   */
  setFiles(files: string[]): boolean;

  /**
   *
   */
  getMapper(): Nullable<vtkMapper>;

  /**
   * Mapper the loaded sources are connected to.
   * @param {vtkMapper} mapper
   */
  setMapper(mapper: vtkMapper): boolean;

  /**
   * Optional scene item whose default settings are applied to every newly
   * loaded source, and whose `source` is updated as levels of detail arrive.
   */
  getSceneItem(): any;

  /**
   *
   * @param sceneItem
   */
  setSceneItem(sceneItem: any): boolean;

  /**
   *
   */
  getStepFinishedCallback(): Nullable<() => void>;

  /**
   * Called after each level of detail has been connected to the mapper.
   * @param stepFinishedCallback
   */
  setStepFinishedCallback(stepFinishedCallback: () => void): boolean;

  /**
   *
   */
  getWaitTimeToStart(): number;

  /**
   * Delay in milliseconds before the first level of detail is downloaded.
   * @param {Number} waitTimeToStart
   */
  setWaitTimeToStart(waitTimeToStart: number): boolean;

  /**
   *
   */
  getWaitTimeBetweenDownloads(): number;

  /**
   * Delay in milliseconds between two level of detail downloads.
   * @param {Number} waitTimeBetweenDownloads
   */
  setWaitTimeBetweenDownloads(waitTimeBetweenDownloads: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkHttpDataSetLODsLoader characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IHttpDataSetLODsLoaderInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IHttpDataSetLODsLoaderInitialValues
): void;

/**
 * Method used to create a new instance of vtkHttpDataSetLODsLoader
 * @param {IHttpDataSetLODsLoaderInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IHttpDataSetLODsLoaderInitialValues
): vtkHttpDataSetLODsLoader;

/**
 * vtkHttpDataSetLODsLoader progressively downloads a list of increasingly
 * detailed versions of the same dataset and swaps each one into a mapper as it
 * becomes available, so a coarse representation is displayed while the finer
 * ones are still being fetched.
 */
export declare const vtkHttpDataSetLODsLoader: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkHttpDataSetLODsLoader;
