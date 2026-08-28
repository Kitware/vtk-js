import {
  EventHandler,
  vtkAlgorithm,
  vtkSubscription,
} from '../../../interfaces';
import { VtkProxy } from '../../../macros';

export interface vtkSourceProxy<T> extends VtkProxy {
  setInputProxy(source: vtkSourceProxy<T>): void;
  setInputData(dataset: T, type?: string): void;
  setInputAlgorithm(
    algo: vtkAlgorithm,
    type: string,
    autoUpdate?: boolean
  ): void;
  update(): void;

  /**
   * Returns true when the algorithm has been modified more recently than the
   * dataset it produced. Requires both an algorithm and a dataset to be set.
   */
  getUpdate(): boolean;

  getName(): string;
  setName(name: string): boolean;
  getType(): string | undefined;
  getDataset(): T | undefined;
  getAlgo(): vtkAlgorithm | undefined;
  getInputProxy(): vtkSourceProxy<T> | undefined;

  /**
   * Register a callback to be invoked when the `DatasetChange` event occurs.
   *
   * @param {EventHandler} cb The callback to register
   * @param {Number} [priority] Priority of this subscription
   */
  onDatasetChange(
    cb: EventHandler,
    priority?: number
  ): Readonly<vtkSubscription>;

  /**
   * Invoke the `DatasetChange` event with the given payload.
   *
   * @param args The event payload
   */
  invokeDatasetChange(...args: unknown[]): void;
}

export interface ISourceProxyInitialValues {
  name?: string;
}

/**
 * Decorates a given publicAPI + model with vtkSourceProxy characteristics.
 *
 * @param publicAPI
 * @param model
 * @param {object} [initialValues]
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ISourceProxyInitialValues
): void;

/**
 * Creates a vtkSourceProxy.
 * @param {object} [initialValues]
 */
export function newInstance<T = unknown>(
  initialValues?: ISourceProxyInitialValues
): vtkSourceProxy<T>;

declare const vtkSourceProxy: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkSourceProxy;
