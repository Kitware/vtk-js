declare function getCase(index: any): number[];
declare function getEdge(eid: any): number[];
export interface T100 {
  getCase: typeof getCase;
  getEdge: typeof getEdge;
}
declare const T101: T100;
export default T101;
