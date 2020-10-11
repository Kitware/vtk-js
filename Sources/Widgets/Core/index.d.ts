/**
 * @param {*} publicAPI public methods to populate
 * @param {*} model internal values to populate
 * @param {object} initialValues Contains at least
 *   {viewType, renderer, camera, openGLRenderWindow, factory}
 */
declare function extend(publicAPI: any, model: any, initialValues?: any): void;
export interface T100 {
  newInstance: any;
  extend: typeof extend;
}
export interface T101 {
  [key: string]: any;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T101): void;
export interface T102 {
  newInstance: any;
  extend: typeof extend_1;
}
export interface T104 {
  labels: any;
  mixins: any;
  name: any;
  initialValues: any;
}
export interface T107 {
  labels: any;
  name: any;
  instance: any;
}
export interface T109 {
  name: any;
  initialValue: any;
}
declare class Builder {
  publicAPI: T101;
  model: T101;
  constructor();
  addDynamicMixinState(T103: T104): this;
  addStateFromMixin(T105: T104): this;
  addStateFromInstance(T106: T107): this;
  addField(T108: T109): this;
  build(...mixins: any[]): Readonly<T101>;
}
declare function createBuilder(): Builder;
export interface T110 {
  createBuilder: typeof createBuilder;
}
declare function extend_2(publicAPI: any, model: any, initialValues?: T101): void;
export interface T111 {
  newInstance: any;
  extend: typeof extend_2;
  Constants: any;
}
declare function extend_3(publicAPI: any, model: any, initialValues?: T101): void;
export interface T112 {
  extend: typeof extend_3;
}
export interface T113 {
  vtkAbstractWidget: T100;
  vtkAbstractWidgetFactory: T102;
  vtkStateBuilder: T110;
  vtkWidgetManager: T111;
  vtkWidgetState: T112;
}
declare const T114: T113;
export default T114;
