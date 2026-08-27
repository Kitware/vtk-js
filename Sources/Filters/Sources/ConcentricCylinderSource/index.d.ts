import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { Nullable, Vector3 } from '../../../types';

/**
 *
 */
export interface IConcentricCylinderSourceInitialValues {
  height?: number;
  radius?: number[];
  cellFields?: number[];
  resolution?: number;
  startTheta?: number;
  endTheta?: number;
  center?: Vector3;
  direction?: Vector3;
  skipInnerFaces?: boolean;
  mask?: Nullable<boolean[]>;
  pointType?: string;
}

type vtkConcentricCylinderSourceBase = vtkObject &
  Omit<
    vtkAlgorithm,
    | 'getInputData'
    | 'setInputData'
    | 'setInputConnection'
    | 'getInputConnection'
    | 'addInputConnection'
    | 'addInputData'
  >;

export interface vtkConcentricCylinderSource extends vtkConcentricCylinderSourceBase {
  /**
   * Add a new layer with the given radius.
   * When no cell field is provided, the index of the new layer is used.
   * @param {Number} radius
   * @param {Number} [cellField]
   */
  addRadius(radius: number, cellField?: number): void;

  /**
   * Remove every layer along with their cell fields.
   */
  clearRadius(): void;

  /**
   * Get the cell field value of each layer.
   * @default [1]
   */
  getCellFields(): number[];

  /**
   * Get the cell field value of each layer.
   */
  getCellFieldsByReference(): number[];

  /**
   * Get the center of the cylinder.
   * @default [0, 0, 0]
   */
  getCenter(): Vector3;

  /**
   * Get the center of the cylinder.
   */
  getCenterByReference(): Vector3;

  /**
   * Get the orientation vector of the cylinder.
   * @default [0, 0, 1]
   */
  getDirection(): Vector3;

  /**
   * Get the orientation vector of the cylinder.
   */
  getDirectionByReference(): Vector3;

  /**
   * Get the angular sector ending angle in degrees.
   * @default 360
   */
  getEndTheta(): number;

  /**
   * Get the height of the cylinder.
   * @default 1.0
   */
  getHeight(): number;

  /**
   * Get the full hidden-layer mask, or null when no mask is set.
   * @default null
   */
  getMaskLayer(): Nullable<boolean[]>;

  /**
   * Get whether the given layer is hidden.
   * @param {Number} index
   */
  getMaskLayer(index: number): boolean;

  /**
   * Get the number of layers.
   */
  getNumberOfRadius(): number;

  /**
   * Get the radius of the given layer.
   * @param {Number} [index] (default: 0)
   */
  getRadius(index?: number): number;

  /**
   * Get the number of facets used to represent each cylinder.
   * @default 6
   */
  getResolution(): number;

  /**
   * Get whether the faces shared by two visible layers are skipped.
   * @default true
   */
  getSkipInnerFaces(): boolean;

  /**
   * Get the angular sector starting angle in degrees.
   * @default 0
   */
  getStartTheta(): number;

  /**
   * Clear the hidden-layer mask so that every layer is visible.
   */
  removeMask(): void;

  /**
   * Expose methods
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;

  /**
   * Set the cell field value of the given layer.
   * @param {Number} index
   * @param {Number} field
   */
  setCellField(index: number, field: number): void;

  /**
   * Set the center of the cylinder.
   * @param {Number} x The x coordinate.
   * @param {Number} y The y coordinate.
   * @param {Number} z The z coordinate.
   */
  setCenter(x: number, y: number, z: number): boolean;

  /**
   * Set the center of the cylinder.
   * @param {Vector3} center
   */
  setCenter(center: Vector3): boolean;

  /**
   * Set the center of the cylinder.
   * @param {Vector3} center
   */
  setCenterFrom(center: Vector3): void;

  /**
   * Set the direction for the cylinder.
   * @param {Number} x The x coordinate.
   * @param {Number} y The y coordinate.
   * @param {Number} z The z coordinate.
   */
  setDirection(x: number, y: number, z: number): boolean;

  /**
   * Set the direction for the cylinder.
   * @param {Vector3} direction
   */
  setDirection(direction: Vector3): boolean;

  /**
   * Set the direction for the cylinder.
   * @param {Vector3} direction
   */
  setDirectionFrom(direction: Vector3): void;

  /**
   * Set the angular sector ending angle in degrees.
   * @param {Number} endTheta
   */
  setEndTheta(endTheta: number): boolean;

  /**
   * Set the height of the cylinder.
   * @param {Number} height
   */
  setHeight(height: number): boolean;

  /**
   * Hide or show the given layer.
   * @param {Number} index
   * @param {Boolean} hidden
   */
  setMaskLayer(index: number, hidden: boolean): void;

  /**
   * Set the radius of an already existing layer.
   * @param {Number} index
   * @param {Number} radius
   */
  setRadius(index: number, radius: number): void;

  /**
   * Set the number of facets used to represent each cylinder.
   * @param {Number} resolution
   */
  setResolution(resolution: number): boolean;

  /**
   * Turn on/off the generation of the faces that are shared by two
   * consecutive visible layers.
   * @param {Boolean} skipInnerFaces
   */
  setSkipInnerFaces(skipInnerFaces: boolean): boolean;

  /**
   * Set the angular sector starting angle in degrees.
   * @param {Number} startTheta
   */
  setStartTheta(startTheta: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkConcentricCylinderSource characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IConcentricCylinderSourceInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IConcentricCylinderSourceInitialValues
): void;

/**
 * Method used to create a new instance of vtkConcentricCylinderSource.
 * @param {IConcentricCylinderSourceInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IConcentricCylinderSourceInitialValues
): vtkConcentricCylinderSource;

/**
 * vtkConcentricCylinderSource creates a set of concentric cylinders sharing the
 * same axis. Each layer is defined by its radius and can carry its own cell
 * field value, which is stored in the `layer` cell array of the output
 * polydata. Layers can individually be hidden with a mask, and the faces shared
 * by two visible layers can be skipped.
 *
 * @example
 * ```js
 * import vtkConcentricCylinderSource from '@kitware/vtk.js/Filters/Sources/ConcentricCylinderSource';
 *
 * const cylinder = vtkConcentricCylinderSource.newInstance({
 *   height: 2,
 *   radius: [0.5, 1, 2],
 *   cellFields: [0, 1, 2],
 * });
 * const polydata = cylinder.getOutputData();
 * ```
 */
export declare const vtkConcentricCylinderSource: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkConcentricCylinderSource;
