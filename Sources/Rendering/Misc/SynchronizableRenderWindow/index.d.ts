import { vtkRenderWindow, IRenderWindowInitialValues } from '../../Rendering/Core/RenderWindow';

// Keeps state for client / server scene synchronization.
export interface SynchContext {
    // Set a function that fetches the data array for the given object.
    setFetchArrayFunction(fetcher: (hash: string, dataType: any) => Promise<ArrayBuffer>): void;
    // Invokes the fetcher registered by setFetchArrayFunction.
    getArray(sha: string, dataType: any, context: SynchContext): Promise<ArrayBuffer>;
    emptyCachedArrays(): void;
    freeOldArrays(threshold: number, context: SynchContext): void;

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

export interface IInitialValues extends IRenderWindowInitialValues {
  synchronizerContextName?: string; // default: 'default':
  synchronizerContext?: SynchContext | null;
  synchronizedViewId?: string | null;
}

// Server-side view state.
export interface ViewState {
  id: ViewId;
  // vtk object type.
  type: string;
  // vtk object mtime.
  mtime: number;
  // ID of the parent. Null for the root.
  parent?: string | null;
  properties?: {[key: string]: any};
  // Child objects.
  dependencies?: ViewState[];
  extra?: any;
  // List of [methodName, args] to be invoked on the object.
  calls?: [string, string[]][];
  // ViewState may contain other arbitrary key / value pairs.
  [key: string]: any;
}

export interface vtkSynchronizableRenderWindowInstance extends vtkRenderWindow {
  getSynchronizerContext(): SynchContext;

  // methods added by createSyncFunction
  synchronize(state: ViewState): Promise<boolean>;
  setSynchronizedViewId(viewId: string): void;
  getSynchronizedViewId(): string;
  updateGarbageCollectorThreshold(v: number): void;
  getManagedInstanceIds(): Array<string>;
  clearOneTimeUpdaters(): void;
}

export function newInstance(props: IInitialValues): vtkSynchronizableRenderWindowInstance;
export function getSynchronizerContext(name?: string): SynchContext;

export const vtkSynchronizableRenderWindow: {
  newInstance: typeof newInstance;
  getSynchronizerContext: typeof getSynchronizerContext;
};

export default vtkSynchronizableRenderWindow;
