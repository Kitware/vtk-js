/**
 * Given an int (as defined in vtkCellType.h) identifier for a class
 * return it's classname.
 */
declare function getClassNameFromTypeId(typeId: any): any;
/**
 * Given a data object classname, return it's int identified (as
 * defined in vtkCellType.h)
 */
declare function getTypeIdFromClassName(cellTypeString: any): any;
/**
 * This convenience method is a fast check to determine if a cell type
 * represents a linear or nonlinear cell.  This is generally much more
 * efficient than getting the appropriate vtkCell and checking its IsLinear
 * method.
 */
declare function isLinear(type: any): boolean;
export interface T100 {
  getClassNameFromTypeId: typeof getClassNameFromTypeId;
  getTypeIdFromClassName: typeof getTypeIdFromClassName;
  isLinear: typeof isLinear;
}
export const STATIC: T100;
export interface T101 {
  [key: string]: any;
}
declare function extend_1(publicAPI: any, model: any, initialValues?: T101): void;
export const extend: typeof extend_1;
export const newInstance: any;
export interface T102 {
  getClassNameFromTypeId: typeof getClassNameFromTypeId;
  getTypeIdFromClassName: typeof getTypeIdFromClassName;
  isLinear: typeof isLinear;
  newInstance: any;
  extend: typeof extend_1;
}
declare const T103: T102;
export default T103;
