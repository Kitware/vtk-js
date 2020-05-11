export function extend(publicAPI: any, model: any, initialValues?: {}): void;
export namespace DEFAULT_VALUES {
    export const synchronizerContextName: string;
    export const synchronizerContext: any;
    export const synchronizedViewId: any;
}
export const newInstance: any;
declare namespace _default {
    export { newInstance };
    export { extend };
    export { getSynchronizerContext };
    export { setSynchronizerContext };
    export { decorate };
    export { createInstanceMap };
    export { createArrayHandler };
    export { createProgressHandler };
    export { createSceneMtimeHandler };
    export { vtkObjectManager };
}
export default _default;
declare function getSynchronizerContext(name?: string): any;
declare function setSynchronizerContext(name: any, ctx: any): void;
declare function decorate(renderWindow: any, name?: string): any;
declare function createInstanceMap(): {
    getInstance: (id: any) => any;
    getInstanceId: (instance: any) => any;
    registerInstance: (id: any, instance: any) => void;
    unregisterInstance: (id: any) => void;
    emptyCachedInstances: () => void;
};
declare function createArrayHandler(): {
    setFetchArrayFunction: (fetcher: any) => void;
    getArray: (sha: any, dataType: any, context: any) => any;
    emptyCachedArrays: () => void;
    freeOldArrays: (threshold: any, context: any) => void;
};
declare function createProgressHandler(): {
    start(): void;
    end(): void;
    resetProgress(): void;
};
declare function createSceneMtimeHandler(): {
    getMTime: (viewId: any) => any;
    incrementMTime: (viewId: any) => void;
    setActiveViewId: (viewId: any) => void;
    getActiveViewId: () => string;
};
import vtkObjectManager from "./vtkObjectManager";
