import { vtkAlgorithm, vtkObject } from '../../../interfaces';

/**
 * Name of the per-element radius entry of `Utilities/XMLConverter/chemistry/elements.json`
 * used to size the atom spheres.
 */
export type RadiusType = 'radiusVDW' | 'radiusCovalent';

/**
 *
 */
export interface IMoleculeToRepresentationInitialValues {
  sphereScaleArrayName?: string;
  tolerance?: number;
  atomicRadiusScaleFactor?: number;
  bondRadius?: number;
  deltaBondFactor?: number;
  radiusType?: RadiusType;
  hideElements?: string | string[];
}

type vtkMoleculeToRepresentationBase = vtkObject & vtkAlgorithm;

export interface vtkMoleculeToRepresentation extends vtkMoleculeToRepresentationBase {
  /**
   * Get the factor applied to the tabulated atomic radius.
   */
  getAtomicRadiusScaleFactor(): number;

  /**
   * Get the radius of the sticks representing the bonds.
   */
  getBondRadius(): number;

  /**
   * Get the extra spacing inserted between the sticks of a multiple bond.
   */
  getDeltaBondFactor(): number;

  /**
   * Get the elements, identified by their id, that are not represented.
   */
  getHideElements(): string | string[];

  /**
   * Get which tabulated radius is used to size the atom spheres.
   */
  getRadiusType(): RadiusType;

  /**
   * Get the name given to the sphere scale array of the first output.
   */
  getSphereScaleArrayName(): string;

  /**
   * Get the extra distance allowed when deducing bonds from atom positions.
   */
  getTolerance(): number;

  /**
   * Produce the sphere polydata on output 0 and the stick polydata on output 1.
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): number;

  /**
   * Set the factor applied to the tabulated atomic radius.
   * @param {Number} atomicRadiusScaleFactor
   */
  setAtomicRadiusScaleFactor(atomicRadiusScaleFactor: number): boolean;

  /**
   * Set the radius of the sticks representing the bonds.
   * @param {Number} bondRadius
   */
  setBondRadius(bondRadius: number): boolean;

  /**
   * Set the extra spacing inserted between the sticks of a multiple bond.
   * @param {Number} deltaBondFactor
   */
  setDeltaBondFactor(deltaBondFactor: number): boolean;

  /**
   * Set the elements, identified by their id, that must not be represented.
   * @param {String|String[]} hideElements
   */
  setHideElements(hideElements: string | string[]): boolean;

  /**
   * Set which tabulated radius is used to size the atom spheres.
   * @param {RadiusType} radiusType
   */
  setRadiusType(radiusType: RadiusType): boolean;

  /**
   * Set the name given to the sphere scale array of the first output.
   * @param {String} sphereScaleArrayName
   */
  setSphereScaleArrayName(sphereScaleArrayName: string): boolean;

  /**
   * Set the extra distance allowed when deducing bonds from atom positions.
   * Two atoms are bonded when their distance is below the sum of their
   * covalent radii plus this tolerance.
   * @param {Number} tolerance
   */
  setTolerance(tolerance: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkMoleculeToRepresentation characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IMoleculeToRepresentationInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IMoleculeToRepresentationInitialValues
): void;

/**
 * Method used to create a new instance of vtkMoleculeToRepresentation
 * @param {IMoleculeToRepresentationInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IMoleculeToRepresentationInitialValues
): vtkMoleculeToRepresentation;

/**
 * vtkMoleculeToRepresentation - convert a molecule into renderable polydata
 *
 * vtkMoleculeToRepresentation takes a molecule as input and produces two
 * outputs: a polydata whose points are the atoms, carrying a scale and a color
 * array, and a polydata whose points are the bonds, carrying a scale, an
 * orientation and a color array. Bonds absent from the input are deduced from
 * the distance between the atoms and their covalent radii.
 */
export declare const vtkMoleculeToRepresentation: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkMoleculeToRepresentation;
