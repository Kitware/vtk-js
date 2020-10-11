declare function extractCellSizes(cellArray: any): any;
declare function getNumberOfCells(cellArray: any): any;
export interface T100 {
  extractCellSizes: typeof extractCellSizes;
  getNumberOfCells: typeof getNumberOfCells;
}
export const STATIC: T100;
export interface T101 {
  [key: string]: any;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T101): void;
export const extend: typeof extend_1;
export const newInstance: any;
export interface T102 {
  extractCellSizes: typeof extractCellSizes;
  getNumberOfCells: typeof getNumberOfCells;
  newInstance: any;
  extend: typeof extend_1;
}
declare const T103: T102;
export default T103;
