declare function canSerialize(obj: any): any;
export interface T100 {
  vtkClass: string;
}
declare function serialize(obj: any, arrayHandler: any): T100;
declare function canDeserialize(obj: any): boolean;
declare function deserialize(obj: any, arrayHandler: any): any;
export interface T101 {
  canSerialize: typeof canSerialize;
  serialize: typeof serialize;
  canDeserialize: typeof canDeserialize;
  deserialize: typeof deserialize;
}
declare const T102: T101;
export default T102;
