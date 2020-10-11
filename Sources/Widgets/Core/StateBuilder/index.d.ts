export interface T100 {
  [key: string]: any;
}
export interface T102 {
  labels: any;
  mixins: any;
  name: any;
  initialValues: any;
}
export interface T105 {
  labels: any;
  name: any;
  instance: any;
}
export interface T107 {
  name: any;
  initialValue: any;
}
declare class Builder {
  publicAPI: T100;
  model: T100;
  constructor();
  addDynamicMixinState(T101: T102): this;
  addStateFromMixin(T103: T102): this;
  addStateFromInstance(T104: T105): this;
  addField(T106: T107): this;
  build(...mixins: any[]): Readonly<T100>;
}
declare function createBuilder_1(): Builder;
export const createBuilder: typeof createBuilder_1;
export interface T108 {
  createBuilder: typeof createBuilder_1;
}
declare const T109: T108;
export default T109;
