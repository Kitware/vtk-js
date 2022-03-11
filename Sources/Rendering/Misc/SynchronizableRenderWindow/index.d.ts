import { Nullable } from "../../../types";
import vtkRenderWindow, { IRenderWindowInitialValues } from "../../Core/RenderWindow";

// Keeps state for client / server scene synchronization.
export interface ISynchronizerContext {
    // Set a function that fetches the data array for the given object.
    setFetchArrayFunction(fetcher: (hash: string, dataType: any) => Promise<ArrayBuffer>): void;
    // Invokes the fetcher registered by setFetchArrayFunction.
    getArray(sha: string, dataType: any, context: ISynchronizerContext): Promise<ArrayBuffer>;
    emptyCachedArrays(): void;
    freeOldArrays(threshold: number, context: ISynchronizerContext): void;

    // instanceMap
    getInstance(id: any): any;
    getInstanceId(instance: any): any | null;
    registerInstance(id: any, instance: any): void;
    unregister(id: any): void;
    emptyCachedInstances(): void;

    // sceneMtimeHandler
    getMtime(): number;
    incrementMtime(viewId: string): number;
    setActiveViewId(viewId: string): void;
    getActiveViewId(): string;

    // TODO: fill progresshandler
}

export interface ISynchronizableRenderWindowInitialValues extends IRenderWindowInitialValues {
  synchronizerContextName?: string; // default: 'default':
  synchronizerContext?: Nullable<ISynchronizerContext>;
  synchronizedViewId?: Nullable<string>;
}

// Server-side view state.
export interface IViewState {
  id: string;
  // vtk object type.
  type: string;
  // vtk object mtime.
  mtime: number;
  // ID of the parent. Null for the root.
  parent?: string | null;
  properties?: {[key: string]: any};
  // Child objects.
  dependencies?: IViewState[];
  extra?: any;
  // List of [methodName, args] to be invoked on the object.
  calls?: [string, string[]][];
  // ViewState may contain other arbitrary key / value pairs.
  [key: string]: any;
}

export interface vtkSynchronizableRenderWindow extends vtkRenderWindow {

  /**
   * 
   */
  getSynchronizerContext(): ISynchronizerContext;

  // methods added by createSyncFunction

  /**
   * 
   * @param {IViewState} state 
   */
  synchronize(state: IViewState): Promise<boolean>;

  /**
   * 
   * @param {String} viewId 
   */
  setSynchronizedViewId(viewId: string): void;

  /**
   * 
   */
  getSynchronizedViewId(): string;

  /**
   * 
   * @param {Number} v 
   */
  updateGarbageCollectorThreshold(v: number): void;

  /**
   * 
   */
  getManagedInstanceIds(): string[];

  /**
   * 
   */
  clearOneTimeUpdaters(): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkCellArray characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ISynchronizableRenderWindowInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ISynchronizableRenderWindowInitialValues): void;

/**
 * Method used to create a new instance of vtkSynchronizableRenderWindow
 * @param {ISynchronizableRenderWindowInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ISynchronizableRenderWindowInitialValues): vtkSynchronizableRenderWindow;

/**
 * 
 * @param {String} [name] 
 */
export function getSynchronizerContext(name?: string): ISynchronizerContext;

/**
 * 
 * @param {String} name 
 * @param {ISynchronizerContext} ctx 
 */
export function setSynchronizerContext(name: string, ctx: ISynchronizerContext): ISynchronizerContext;

/**
 * 
 * @param {vtkRenderWindow} renderWindow 
 * @param {String} [name] 
 */
export function decorate(renderWindow: vtkRenderWindow, name?: string): object;

/**
 * 
 */
export function createInstanceMap(): object;

/**
 * 
 */
export function createArrayHandler(): object;

/**
 * 
 */
export function createProgressHandler(): object;

/**
 * 
 */
export function createSceneMtimeHandler(): object;

/**
 * 
 */
export declare const vtkSynchronizableRenderWindow: {
  newInstance: typeof newInstance;
  getSynchronizerContext: typeof getSynchronizerContext;
  setSynchronizerContext: typeof setSynchronizerContext;
  decorate: typeof decorate,
  createInstanceMap: typeof createInstanceMap,
  createArrayHandler: typeof createArrayHandler,
  createProgressHandler: typeof createProgressHandler,
  createSceneMtimeHandler: typeof createSceneMtimeHandler,
  vtkObjectManager: object
};
export default vtkSynchronizableRenderWindow;
