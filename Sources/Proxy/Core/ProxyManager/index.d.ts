import { vtkSubscription } from '../../../interfaces';
import { vtkSourceProxy } from '../SourceProxy';
import { vtkViewProxy } from '../ViewProxy';
import { vtkAbstractRepresentationProxy } from '../AbstractRepresentationProxy';
import { vtkLookupTableProxy } from '../LookupTableProxy';
import { vtkPiecewiseFunctionProxy } from '../PiecewiseFunctionProxy';
import { VtkProxy, VtkProxySection } from '../../../macros';

export type ProxyConfiguration = object;

export interface ProxyRegistrationChangeInfo {
  action: 'register' | 'unregister';
  proxyId: string;
  proxyName: string;
  proxyGroup: string;
  proxy: VtkProxy;
}

export interface IProxyManagerInitialValues {
  proxyConfiguration?: ProxyConfiguration;
}

export interface vtkProxyManager extends VtkProxy {
  // core //

  setProxyConfiguration(config: ProxyConfiguration): boolean;
  getProxyConfiguration(): ProxyConfiguration;

  setActiveSource<T>(sourceProxy: vtkSourceProxy<T> | undefined): void;
  getActiveSource<T>(): vtkSourceProxy<T> | undefined;
  onActiveSourceChange(
    callback: (source: vtkSourceProxy<any>) => void,
    priority?: number
  ): vtkSubscription;
  invokeActiveSourceChange(source: vtkSourceProxy<any>): void;

  setActiveView(viewProxy: vtkViewProxy | undefined): void;
  getActiveView(): vtkViewProxy | undefined;
  onActiveViewChange(
    callback: (view: vtkViewProxy) => void,
    priority?: number
  ): vtkSubscription;
  invokeActiveViewChange(view: vtkViewProxy): void;

  onProxyRegistrationChange(
    callback: (changeInfo: ProxyRegistrationChangeInfo) => void,
    priority?: number
  ): vtkSubscription;
  invokeProxyRegistrationChange(changeInfo: ProxyRegistrationChangeInfo): void;

  getProxyById<T extends VtkProxy>(id: string): T | undefined;
  getProxyGroups(): string[];
  getProxyInGroup(groupName: string): VtkProxy[];

  getSources(): vtkSourceProxy<any>[];
  getRepresentations(): vtkAbstractRepresentationProxy[];
  getViews(): vtkViewProxy[];

  createProxy<T extends VtkProxy>(
    group: string,
    name: string,
    options?: object
  ): T | null;

  getRepresentation<T extends vtkAbstractRepresentationProxy>(
    source: vtkSourceProxy<any>,
    view: vtkViewProxy
  ): T | null;

  deleteProxy(proxy: VtkProxy): void;

  // view //

  create3DView(options?: object): vtkViewProxy;
  create2DView(options?: object): vtkViewProxy;
  render(view?: vtkViewProxy): void;
  renderAllViews(blocking?: boolean): void;
  setAnimationOnAllViews(enable?: boolean): void;
  autoAnimateViews(debounceTimeout: number): void;
  resizeAllViews(): void;
  resetCamera(view?: vtkViewProxy): void;
  createRepresentationInAllViews(source: vtkSourceProxy<any>): void;
  resetCameraInAllViews(): void;

  // state //

  /**
   * Rebuild the proxy graph described by a state previously produced by
   * `saveState`. Resolves with the state's `userData` plus a `$oldToNewIdMapping`
   * entry mapping saved proxy ids to the ids of the recreated proxies.
   */
  loadState(
    state: object,
    options?: { datasetHandler?: (dataset: any) => any }
  ): Promise<object>;

  /**
   * Serialize the registered sources, views and representations. `options` is
   * copied into the state, minus its `datasetHandler` entry, and `userData` is
   * stored alongside it.
   */
  saveState(
    options?: { datasetHandler?: (dataset: any, source?: any) => any },
    userData?: object
  ): Promise<object>;

  // properties //

  /**
   * UI sections of the active source, its representation in the active view and
   * the active view, skipping the ones with an empty ui description.
   */
  getSections(): Array<VtkProxySection & { collapsed?: boolean }>;

  /**
   * Record whether the section with the given name is collapsed.
   */
  updateCollapseState(name: string, state: boolean): void;

  /**
   * Apply a set of `${proxyId}:${propertyName}` changes at once, then render
   * every view. The value `__command_execute__` calls the named method instead
   * of setting it.
   */
  applyChanges(changeSet: Record<string, unknown>): void;

  // these are specific to the proxy configuration...
  getLookupTable(arrayName: string, options?: any): vtkLookupTableProxy;
  getPiecewiseFunction(
    arrayName: string,
    options?: any
  ): vtkPiecewiseFunctionProxy;
  rescaleTransferFunctionToDataRange(
    arrayName: string,
    dataRange: [number, number]
  ): void;
}

/**
 * Decorates a given publicAPI + model with vtkProxyManager characteristics.
 *
 * @param publicAPI
 * @param model
 * @param {IProxyManagerInitialValues} [initialValues]
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IProxyManagerInitialValues
): void;

/**
 * Creates a vtkProxyManager.
 * @param {IProxyManagerInitialValues} [initialValues]
 */
export function newInstance(
  initialValues?: IProxyManagerInitialValues
): vtkProxyManager;

/**
 * vtkProxyManager is the central manager for managing proxy resources
 * in vtk.js.
 */
export declare const vtkProxyManager: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkProxyManager;
