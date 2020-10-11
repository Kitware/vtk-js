export interface T100 {
  [key: string]: any;
}
declare function extend(publicAPI: any, model: any, initialValues?: T100): void;
export interface T101 {
  newInstance: any;
  extend: typeof extend;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T100): void;
export interface T102 {
  newInstance: any;
  extend: typeof extend_1;
}
declare function extend_2(publicAPI: any, model: any, initialValues?: T100): void;
export interface T103 {
  newInstance: any;
  extend: typeof extend_2;
}
declare function extend_3(publicAPI: any, model: any, initialValues?: T100): void;
export interface T104 {
  newInstance: any;
  extend: typeof extend_3;
  SHARED_IMAGE_STREAM: any;
  connectImageStream: any;
  disconnectImageStream: any;
}
declare function extend_4(publicAPI: any, model: any, initialValues?: T100): void;
export interface T105 {
  newInstance: any;
  extend: typeof extend_4;
}
declare function extend_5(publicAPI: any, model: any, initialValues?: T100): void;
declare function getSynchronizerContext(name?: string): any;
declare function setSynchronizerContext(name: any, ctx: any): void;
declare function decorate(renderWindow: any, name?: string): any;
export interface T106 {
  getInstance: (id: any) => any;
  getInstanceId: (instance: any) => any;
  registerInstance: (id: any, instance: any) => void;
  unregisterInstance: (id: any) => void;
  emptyCachedInstances: () => void;
}
declare function createInstanceMap(): T106;
export interface T107 {
  setFetchArrayFunction: (fetcher: any) => void;
  getArray: (sha: any, dataType: any, context: any) => Promise<any>;
  emptyCachedArrays: () => void;
  freeOldArrays: (threshold: any, context: any) => void;
}
declare function createArrayHandler(): T107;
export interface T108 {
  start(): void;
  end(): void;
  resetProgress(): void;
}
declare function createProgressHandler(): T108;
export interface T109 {
  getMTime: (viewId: any) => any;
  incrementMTime: (viewId: any) => void;
  setActiveViewId: (viewId: any) => void;
  getActiveViewId: () => string;
}
declare function createSceneMtimeHandler(): T109;
declare function build(type: any, initialProps?: T100): any;
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
export interface T110 {
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
export interface T111 {
  newInstance: any;
  extend: typeof extend_5;
  getSynchronizerContext: typeof getSynchronizerContext;
  setSynchronizerContext: typeof setSynchronizerContext;
  decorate: typeof decorate;
  createInstanceMap: typeof createInstanceMap;
  createArrayHandler: typeof createArrayHandler;
  createProgressHandler: typeof createProgressHandler;
  createSceneMtimeHandler: typeof createSceneMtimeHandler;
  vtkObjectManager: T110;
}
declare function extend_6(publicAPI: any, model: any, initialValues?: T100): void;
export interface T112 {
  newInstance: any;
  extend: typeof extend_6;
}
export interface T113 {
  vtkCanvasView: T101;
  vtkFullScreenRenderWindow: T102;
  vtkGenericRenderWindow: T103;
  vtkRemoteView: T104;
  vtkRenderWindowWithControlBar: T105;
  vtkSynchronizableRenderWindow: T111;
  vtkTextureLODsDownloader: T112;
}
declare const T114: T113;
export default T114;
