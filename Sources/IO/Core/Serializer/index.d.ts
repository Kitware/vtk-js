declare function getSerializer(obj: any): any;
declare function getDeserializer(obj: any): any;
export interface T100 {
  vtkArraySerializer: any;
  getSerializer: typeof getSerializer;
  getDeserializer: typeof getDeserializer;
}
declare const T101: T100;
export default T101;
