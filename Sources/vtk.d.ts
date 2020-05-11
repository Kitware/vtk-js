declare function vtk(obj: any): any;
declare namespace vtk {
    export { register };
}
export default vtk;
declare function register(vtkClassName: any, constructor: any): void;
