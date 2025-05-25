import vtkPolyData from '../../../Common/DataModel/PolyData';
import { vtkAlgorithm, vtkObject } from '../../../interfaces';

/**
 *
 */
export interface IOBJWriterInitialValues {}

type vtkOBJWriterBase = vtkObject & vtkAlgorithm;

export interface vtkOBJWriter extends vtkOBJWriterBase {
  /**
   *
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkOBJWriter characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IOBJWriterInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IOBJWriterInitialValues
): void;

/**
 * Method used to create a new instance of vtkOBJWriter
 * @param {IOBJWriterInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IOBJWriterInitialValues
): vtkOBJWriter;

/**
 *
 * @param {vktPolyData} polyData
 */
export function writeOBJ(polyData: vtkPolyData): vtkPolyData;

/**
 * vtkOBJWriter writes wavefront obj (.obj) files in ASCII form. OBJ files
 * contain the geometry including lines, triangles and polygons. Normals and
 * texture coordinates on points are also written if they exist.
 */
export declare const vtkOBJWriter: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  writeOBJ: typeof writeOBJ;
};
export default vtkOBJWriter;
