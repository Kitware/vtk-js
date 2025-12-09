import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { DesiredOutputPrecision } from '../../../Common/DataModel/DataSetAttributes';
import { SolidType } from './Constants';

/**
 *
 */
export interface IPlatonicSolidSourceInitialValues {
  solidType?: SolidType;
  outputPointsPrecision?: DesiredOutputPrecision;
  scale?: number;
}

type vtkPlatonicSolidSourceBase = vtkObject &
  Omit<
    vtkAlgorithm,
    | 'getInputData'
    | 'setInputData'
    | 'setInputConnection'
    | 'getInputConnection'
    | 'addInputConnection'
    | 'addInputData'
  >;

export interface vtkPlatonicSolidSource extends vtkPlatonicSolidSourceBase {
  /**
   * Get the desired output precision.
   * @returns {DesiredOutputPrecision}
   */
  getOutputPointsPrecision(): DesiredOutputPrecision;

  /**
   * Get the scale factor of the source.
   */
  getScale(): number;

  /**
   * Get the solid type of the source.
   * @returns {SolidType}
   */
  getSolidType(): SolidType;

  /**
   * Request data for the source.
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;

  /**
   * Set the desired output precision.
   * @param {DesiredOutputPrecision} outputPointsPrecision
   */
  setOutputPointsPrecision(
    outputPointsPrecision: DesiredOutputPrecision
  ): boolean;

  /**
   * Set the scale factor of the source.
   * @param {Number} scale The scale factor.
   */
  setScale(scale: number): boolean;

  /**
   * Set the solid type of the source.
   * @param {SolidType} solidType
   */
  setSolidType(solidType: SolidType): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkPlatonicSolidSource characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IPlatonicSolidSourceInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IPlatonicSolidSourceInitialValues
): void;

/**
 * Method used to create a new instance of vtkPlatonicSolidSource.
 * @param {IPlatonicSolidSourceInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IPlatonicSolidSourceInitialValues
): vtkPlatonicSolidSource;

/**
 * vtkPlatonicSolidSource can generate each of the five Platonic solids:
 * tetrahedron, cube, octahedron, icosahedron, and dodecahedron. Each of the
 * solids is placed inside a sphere centered at the origin with radius 1.0.
 *
 * @example
 * ```js
 * import vtkPlatonicSolidSource from '@kitware/vtk.js/Filters/Sources/PlatonicSolidSource';
 *
 * const platonicSolidSource = vtkPlatonicSolidSource.newInstance();
 * const polydata = platonicSolidSource.getOutputData();
 * ```
 */
export declare const vtkPlatonicSolidSource: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkPlatonicSolidSource;
