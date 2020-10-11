export interface T100 {
  synchronizerContextName: string;
  synchronizerContext: any;
  synchronizedViewId: any;
}
export const DEFAULT_VALUES: T100;
export interface T101 {
  [key: string]: any;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T101): void;
export const extend: typeof extend_1;
export const newInstance: any;
declare function getSynchronizerContext(name?: string): any;
declare function setSynchronizerContext(name: any, ctx: any): void;
declare function decorate(renderWindow: any, name?: string): any;
export interface T102 {
  getInstance: (id: any) => any;
  getInstanceId: (instance: any) => any;
  registerInstance: (id: any, instance: any) => void;
  unregisterInstance: (id: any) => void;
  emptyCachedInstances: () => void;
}
declare function createInstanceMap(): T102;
export interface T103 {
  setFetchArrayFunction: (fetcher: any) => void;
  getArray: (sha: any, dataType: any, context: any) => Promise<any>;
  emptyCachedArrays: () => void;
  freeOldArrays: (threshold: any, context: any) => void;
}
declare function createArrayHandler(): T103;
export interface T104 {
  start(): void;
  end(): void;
  resetProgress(): void;
}
declare function createProgressHandler(): T104;
export interface T105 {
  getMTime: (viewId: any) => any;
  incrementMTime: (viewId: any) => void;
  setActiveViewId: (viewId: any) => void;
  getActiveViewId: () => string;
}
declare function createSceneMtimeHandler(): T105;
declare function build(type: any, initialProps?: T101): any;
declare function update(type: any, instance: any, props: any, context: any): void;
declare function genericUpdater(instance: any, state: any, context: any): void;
declare function oneTimeGenericUpdater(instance: any, state: any, context: any): void;
declare function setTypeMapping(type: any, buildFn?: any, updateFn?: typeof genericUpdater): void;
declare function clearTypeMapping(): void;
declare function getSupportedTypes(): string[];
declare function clearOneTimeUpdaters(...ids: any[]): void | any[];
declare function updateRenderWindow(instance: any, props: any, context: any): void;
declare function excludeInstance(type: any, propertyName: any, propertyValue: any): void;
declare function setDefaultMapping(reset?: boolean): void;
declare function applyDefaultAliases(): void;
declare function alwaysUpdateCamera(): void;
export interface T106 {
  build: typeof build;
  update: typeof update;
  genericUpdater: typeof genericUpdater;
  oneTimeGenericUpdater: typeof oneTimeGenericUpdater;
  setTypeMapping: typeof setTypeMapping;
  clearTypeMapping: typeof clearTypeMapping;
  getSupportedTypes: typeof getSupportedTypes;
  clearOneTimeUpdaters: typeof clearOneTimeUpdaters;
  updateRenderWindow: typeof updateRenderWindow;
  excludeInstance: typeof excludeInstance;
  setDefaultMapping: typeof setDefaultMapping;
  applyDefaultAliases: typeof applyDefaultAliases;
  alwaysUpdateCamera: typeof alwaysUpdateCamera;
}
export interface T107 {
  newInstance: any;
  extend: typeof extend_1;
  getSynchronizerContext: typeof getSynchronizerContext;
  setSynchronizerContext: typeof setSynchronizerContext;
  decorate: typeof decorate;
  createInstanceMap: typeof createInstanceMap;
  createArrayHandler: typeof createArrayHandler;
  createProgressHandler: typeof createProgressHandler;
  createSceneMtimeHandler: typeof createSceneMtimeHandler;
  vtkObjectManager: T106;
}
declare const T108: T107;
export default T108;
