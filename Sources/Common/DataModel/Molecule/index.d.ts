import { vtkObject } from '../../../interfaces';

/**
 * Chemical JSON description of the atoms of the molecule, e.g.
 * `{ elements: { number: [...] }, coords: { '3d': [...] } }`.
 */
export type MoleculeAtoms = Record<string, any>;

/**
 * Chemical JSON description of the bonds of the molecule.
 */
export type MoleculeBonds = Record<string, any>;

/**
 *
 */
export interface IMoleculeInitialValues {
  /**
   * Version of the chemical JSON format the molecule follows.
   */
  'chemical json'?: number;
  name?: string;
  inchi?: string;
  formula?: string;
  atoms?: MoleculeAtoms;
  bonds?: MoleculeBonds;
  properties?: Record<string, any>;
}

export interface vtkMolecule extends vtkObject {
  /**
   * The field name is `chemical json`, so the generated accessor name
   * contains a space.
   */
  'getChemical json'(): number;

  /**
   * @see getChemical json
   */
  'setChemical json'(chemicalJson: number): boolean;

  /**
   *
   */
  getAtoms(): MoleculeAtoms;

  /**
   *
   */
  getBonds(): MoleculeBonds;

  /**
   *
   */
  getFormula(): string;

  /**
   *
   */
  getInchi(): string;

  /**
   *
   */
  getName(): string;

  /**
   *
   */
  getProperties(): Record<string, any>;

  /**
   *
   * @param {MoleculeAtoms} atoms
   */
  setAtoms(atoms: MoleculeAtoms): boolean;

  /**
   *
   * @param {MoleculeBonds} bonds
   */
  setBonds(bonds: MoleculeBonds): boolean;

  /**
   *
   * @param {String} formula
   */
  setFormula(formula: string): boolean;

  /**
   *
   * @param {String} inchi
   */
  setInchi(inchi: string): boolean;

  /**
   *
   * @param {String} name
   */
  setName(name: string): boolean;

  /**
   *
   * @param properties
   */
  setProperties(properties: Record<string, any>): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkMolecule characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IMoleculeInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IMoleculeInitialValues
): void;

/**
 * Method used to create a new instance of vtkMolecule.
 * @param {IMoleculeInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IMoleculeInitialValues
): vtkMolecule;

/**
 * vtkMolecule holds the chemical JSON description of a molecule: its atoms,
 * bonds and associated properties.
 */
export declare const vtkMolecule: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkMolecule;
