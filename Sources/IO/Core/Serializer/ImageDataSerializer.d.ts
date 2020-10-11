declare function canSerialize(obj: any): any;
declare function serialize(obj: any, arrayHandler: any): any;
declare function canDeserialize(obj: any): boolean;
declare function deserialize(obj: any, arrayHandler: any): any;
export interface T100 {
  canSerialize: typeof canSerialize;
  serialize: typeof serialize;
  canDeserialize: typeof canDeserialize;
  deserialize: typeof deserialize;
}
declare const T101: T100;
export default T101;
