import { vtkObject } from './interfaces';

interface ISerializedVtkObject {
  vtkClass: string;
  [attrName: string]: unknown;
}

interface Ivtk {
  /**
   * Deserializes a serialized VTK.js object.
   */
  (obj: ISerializedVtkObject): vtkObject;

  register(vtkClassName: string, constructor: <T>(model: unknown) => T): void;
}

declare const vtk: Ivtk;

export default vtk;
