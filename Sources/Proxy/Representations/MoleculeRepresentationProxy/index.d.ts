import { vtkAbstractRepresentationProxy } from '../../Core/AbstractRepresentationProxy';

export interface vtkMoleculeRepresentationProxy extends vtkAbstractRepresentationProxy {
  /**
   * Atoms and bonds are colored by the molecule filter, so this is a no-op.
   */
  setColorBy(): void;
  getColorBy(): [];
  listDataArrays(): [];

  // proxy property mappings
  getTolerance(): number;
  setTolerance(tolerance: number): boolean;
  getAtomicRadiusScaleFactor(): number;
  setAtomicRadiusScaleFactor(atomicRadiusScaleFactor: number): boolean;
  getBondRadius(): number;
  setBondRadius(bondRadius: number): boolean;
  getDeltaBondFactor(): number;
  setDeltaBondFactor(deltaBondFactor: number): boolean;
  getRadiusType(): string;
  setRadiusType(radiusType: string): boolean;
  getHideElements(): string;
  setHideElements(hideElements: string): boolean;
}

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: object
): void;

export function newInstance(
  initialValues?: object
): vtkMoleculeRepresentationProxy;

/**
 * Representation proxy rendering a molecule as spheres for the atoms and
 * sticks for the bonds, both produced by vtkMoleculeToRepresentation.
 */
declare const vtkMoleculeRepresentationProxy: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkMoleculeRepresentationProxy;
