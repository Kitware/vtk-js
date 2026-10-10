import { vtkAbstractRepresentationProxy } from '../../Core/AbstractRepresentationProxy';

export interface vtkSkyboxRepresentationProxy extends vtkAbstractRepresentationProxy {
  /**
   * A skybox is textured, not colored by an array, so this is a no-op.
   */
  setColorBy(): void;
  getColorBy(): [];
  listDataArrays(): [];

  /**
   * Move the skybox to one of the positions offered by the input source.
   */
  setPosition(value: string): void;
  getPosition(): string;
}

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: object
): void;

export function newInstance(
  initialValues?: object
): vtkSkyboxRepresentationProxy;

/**
 * Representation proxy showing its input texture on a vtkSkybox, and exposing
 * the positions the input source can be viewed from.
 */
declare const vtkSkyboxRepresentationProxy: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkSkyboxRepresentationProxy;
