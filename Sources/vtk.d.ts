/**
 * 
 * @param obj 
 * @return  
 */
declare function vtk(obj: object): any;

/**
 * Nest register method under the vtk function
 * @param vtkClassName 
 * @param constructor 
 */
declare function register(vtkClassName: string, constructor: any): void;

export default vtk;
