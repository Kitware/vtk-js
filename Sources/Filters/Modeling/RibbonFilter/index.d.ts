import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { Vector3 } from '../../../types';

export type IGenerateTCoords =
  | 'TCOORDS_OFF'
  | 'TCOORDS_FROM_SCALARS'
  | 'TCOORDS_FROM_LENGTH'
  | 'TCOORDS_FROM_NORMALIZED_LENGTH';

/**
 *
 */
export interface IRibbonFilterInitialValues {
  useDefaultNormal?: boolean;
  width?: number;
  varyWidth?: boolean;
  angle?: number;
  generateTCoords?: IGenerateTCoords;
  widthFactor?: number;
  textureLength?: number;
  defaultNormal?: Vector3;
}

type vtkRibbonFilterBase = vtkObject & vtkAlgorithm;

export interface vtkRibbonFilter extends vtkRibbonFilterBase {
  /**
   * Get the angle (in degrees) of rotation about the line tangent used to
   * orient the ribbon.
   */
  getAngle(): number;

  /**
   * Get the default normal used to orient the ribbon when no normals are
   * provided in the input.
   */
  getDefaultNormal(): Vector3;

  /**
   * Get the default normal used to orient the ribbon when no normals are
   * provided in the input.
   */
  getDefaultNormalByReference(): Vector3;

  /**
   * Get the method used to generate texture coordinates.
   */
  getGenerateTCoords(): IGenerateTCoords;

  /**
   * Get the method used to generate texture coordinates as a string.
   */
  getGenerateTCoordsAsString(): string;

  /**
   * Get the texture length, used when generating texture coordinates from
   * length.
   */
  getTextureLength(): number;

  /**
   * Get whether to use the default normal to orient the ribbon when no
   * normals are provided in the input.
   */
  getUseDefaultNormal(): boolean;

  /**
   * Get whether to vary the width of the ribbon using scalar data.
   */
  getVaryWidth(): boolean;

  /**
   * Get the width of the ribbon.
   */
  getWidth(): number;

  /**
   * Get the width factor, used to scale the width when varying the width.
   */
  getWidthFactor(): number;

  /**
   *
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;

  /**
   * Set the angle (in degrees) of rotation about the line tangent used to orient the ribbon.
   * Default is 0.0.
   * @param angle The angle in degrees.
   * @returns true if the angle is set successfully.
   */
  setAngle(angle: number): boolean;

  /**
   * Set the default normal used to orient the ribbon when no normals are provided in the input.
   * The default normal is a vector defined by three components (x,y,z). The
   * default is (0,0,1).
   * @param defaultNormal The default normal as an array of three numbers or a Vector3.
   * @returns true if the default normal is set successfully.
   */
  setDefaultNormal(defaultNormal: Vector3): boolean;

  /**
   * Set the default normal used to orient the ribbon when no normals are provided in the input.
   * The default normal is a vector defined by three components (x,y,z). The
   * default is (0,0,1).
   * @returns true if the default normal is set successfully.
   */
  setDefaultNormalFrom(defaultNormal: Vector3): boolean;

  /**
   * Set the method used to generate texture coordinates. By default, texture
   * coordinates are not generated.
   * @param generateTCoords The method to generate texture coordinates.
   * @returns true if the method is set successfully.
   */
  setGenerateTCoords(generateTCoords: IGenerateTCoords): boolean;

  /**
   * Set the texture length, used when generating texture coordinates from length.
   * The default is 1.0.
   * @param textureLength The texture length.
   * @returns true if the texture length is set successfully.
   */
  setTextureLength(textureLength: number): boolean;

  /**
   * Set whether to use the default normal to orient the ribbon when no normals are provided in the input.
   * The default is false.
   * @param useDefaultNormal Whether to use the default normal.
   * @returns true if the flag is set successfully.
   */
  setUseDefaultNormal(useDefaultNormal: boolean): boolean;

  /**
   * Set whether to vary the width of the ribbon using scalar data. By default,
   * the width of the ribbon is uniform.
   * @param varyWidth Whether to vary the width of the ribbon.
   * @returns true if the flag is set successfully.
   */
  setVaryWidth(varyWidth: boolean): boolean;

  /**
   * Set the width of the ribbon. The width is the total width of the ribbon;
   * the ribbon extends width/2 on either side of the line. The default is 0.5.
   * @param width The width of the ribbon.
   * @returns true if the width is set successfully.
   */
  setWidth(width: number): boolean;

  /**
   * Set the width factor, used to scale the width when varying the width.
   * The default is 1.0.
   * @param widthFactor The width factor.
   * @returns true if the width factor is set successfully.
   */
  setWidthFactor(widthFactor: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkRibbonFilter characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IRibbonFilterInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IRibbonFilterInitialValues
): void;

/**
 * Method used to create a new instance of vtkRibbonFilter
 * @param {IRibbonFilterInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IRibbonFilterInitialValues
): vtkRibbonFilter;

/**
 * vtkRibbonFilter is a filter to create oriented ribbons from lines defined in
 * polygonal dataset. The orientation of the ribbon is along the line segments
 * and perpendicular to "projected" line normals. Projected line normals are the
 * original line normals projected to be perpendicular to the local line
 * segment. An offset angle can be specified to rotate the ribbon with respect
 * to the normal.
 */
export declare const vtkRibbonFilter: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkRibbonFilter;
