export interface T100 {
  [key: string]: any;
}
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
export interface T101 {
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
declare const T102: T101;
export default T102;
