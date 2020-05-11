export function extend(publicAPI: any, model: any, initialValues?: {}): void;
export namespace STATIC {
    export { getClassNameFromTypeId };
    export { getTypeIdFromClassName };
    export { isLinear };
}
export const newInstance: any;
declare var _default: any;
export default _default;
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
