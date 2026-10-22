import { vtkObject } from './interfaces';
import { Nullable } from './types';

interface ISerializedVtkObject {
  vtkClass: string;
  [attrName: string]: unknown;
}

interface Ivtk {
  (obj: null): null;
  (obj: undefined): undefined;
  <T extends vtkObject>(obj: T): T;

  /**
   * Deserializes a serialized VTK.js object.
   *
   * Returns null when `vtkClass` names no registered factory, and when the
   * registered factory itself returns null.
   */
  (obj: ISerializedVtkObject): Nullable<vtkObject>;

  /**
   * Register the factory used to rebuild instances of `vtkClassName` when
   * deserializing.
   *
   * @param vtkClassName The `vtkClass` value the factory handles
   * @param constructor Typically the class's own `newInstance`
   */
  register(
    vtkClassName: string,
    constructor: (initialValues?: any) => Nullable<vtkObject>
  ): void;
}

declare const vtk: Ivtk;

export default vtk;
