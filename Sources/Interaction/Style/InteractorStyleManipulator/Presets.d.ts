// Imported as '../InteractorStyleManipulator' rather than './index' so that the
// path stays valid once the ESM package flattens `<Module>/index.d.ts` to
// `<Module>.d.ts`.
import { vtkInteractorStyleManipulator } from '../InteractorStyleManipulator';

/**
 * A single manipulator entry of a preset: the registered manipulator type name
 * plus the initial values handed to its `newInstance`.
 */
export interface IManipulatorDefinition {
  type: string;
  options?: object;
}

declare const vtkInteractorStyleManipulatorPresets: {
  /**
   * Remove every manipulator currently bound to the given style, then
   * instantiate and add the manipulators described by `definitions`. Each
   * instance is dispatched to `addVRManipulator`, `addGestureManipulator`,
   * `addKeyboardManipulator` or `addMouseManipulator` depending on its type.
   *
   * @param {IManipulatorDefinition[]} definitions The manipulators to create
   * @param {vtkInteractorStyleManipulator} manipulatorStyle The style to configure
   */
  applyDefinitions(
    definitions: IManipulatorDefinition[],
    manipulatorStyle: vtkInteractorStyleManipulator
  ): boolean;

  /**
   * Apply a registered preset onto an interactor style.
   *
   * The presets shipped with vtk.js are `'3D'`, `'2D'`, `'FirstPerson'`,
   * `'Unicam'`, `'zRotateTop'` and `'zRotateAll'`.
   *
   * @param {string} name The name of the preset
   * @param {vtkInteractorStyleManipulator} manipulatorStyle The style to configure
   */
  applyPreset(
    name: string,
    manipulatorStyle: vtkInteractorStyleManipulator
  ): boolean;

  /**
   * Register a manipulator class under a type name usable in definitions.
   *
   * @param {string} type The type name
   * @param {object} classDef The manipulator class (must expose `newInstance`)
   */
  registerManipulatorType(type: string, classDef: object): void;

  /**
   * Register a new style preset, or override an existing one.
   *
   * @param {string} name The name of the preset
   * @param {IManipulatorDefinition[]} definitions The manipulators of the preset
   */
  registerStylePreset(
    name: string,
    definitions: IManipulatorDefinition[]
  ): void;
};

export default vtkInteractorStyleManipulatorPresets;
