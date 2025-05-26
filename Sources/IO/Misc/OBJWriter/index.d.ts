import vtkPolyData from '../../../Common/DataModel/PolyData';
import vtkTexture from '../../../Rendering/Core/Texture';
import { vtkAlgorithm, vtkObject } from '../../../interfaces';

/**
 *
 */
export interface IOBJWriterInitialValues {
  modelFilename?: string;
  materialFilename?: string;
  texture?: vtkTexture;
  textureFileName?: string;
}

type vtkOBJWriterBase = vtkObject & vtkAlgorithm;

export interface vtkOBJWriter extends vtkOBJWriterBase {
  /**
   * Get the zip file containing the OBJ and MTL files.
   */
  exportAsZip(): Promise<Uint8Array>;

  /**
   * Get the MTL file as a string.
   */
  getMtl(): string;

  /**
   *
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;

  /**
   * Set the material filename.
   * @param materialFilename
   * @returns {boolean} true if the material file name was set successfully
   */
  setMaterialFilename(materialFilename: string): boolean;

  /**
   * Set the model filename.
   * @param modelFilename
   */
  setModelFilename(modelFilename: string): boolean;

  /**
   * Set the texture instance.
   * @param {vtkTexture} texture
   * @returns {boolean} true if the texture was set successfully
   */
  setTexture(texture: vtkTexture): boolean;

  /**
   * Set the texture file name.
   * @param {string} textureFileName
   * @returns {boolean} true if the texture file name was set successfully
   */
  setTextureFileName(textureFileName: string): boolean;
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
 *
 * One can specify a texture passing a vtkTexture using `setTexture`. If a texture is
 * set, additional .mtl and .png files are generated.
 */
export declare const vtkOBJWriter: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  writeOBJ: typeof writeOBJ;
};
export default vtkOBJWriter;
