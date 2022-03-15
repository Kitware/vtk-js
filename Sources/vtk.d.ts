interface IvtkObject {
    vtkClass: string;
    [attrName: string]: unknown;
}

/**
 * 
 * @param obj 
 * @return  
 */
declare function vtk(obj: IvtkObject): unknown;

/**
 * Nest register method under the vtk function
 * @param vtkClassName 
 * @param constructor 
 */
declare function register(vtkClassName: string, constructor: unknown): void;

export default vtk;
