import { vtkObject } from "../../../../interfaces" ;
import { Nullable } from "../../../../types" ;
import { ISynchronizerContext, IViewState } from "..";

export type BuilderFunction = <T extends vtkObject>(type: string, initialProps?: Record<string, unknown>) => Nullable<T>;
export type UpdaterFunction = (instance: vtkObject, state: IViewState, context: ISynchronizerContext) => void;

export interface IObjectManager {
  /**
   * Build a vtkObject.
   */
  build: BuilderFunction;

  /**
   * @param {String} type The type to update 
   * @param {vtkObject} instance The specific instance 
   * @param {IViewState} props 
   * @param {ISynchronizerContext} context 
   */
  update(type: string, instance: vtkObject, props: IViewState, context: ISynchronizerContext): Promise<Error | void>;

  /**
   * Defines a new type handler with the specified builder and updater functions
   * 
   * @param {String} type The type you wish to register
   * @param {BuilderFunction} [buildFn] The builder function to associate with the type 
   * @param {UpdaterFunction} [updateFn] The updater function to associate with the type 
   */
  setTypeMapping(type: string, buildFn?: BuilderFunction, updateFn?: UpdaterFunction): void;
  
  /**
   * Clear all type mappings
   */
  clearTypeMapping(): void;
 
  /**
   * Get a list of all supported types
   * 
   * @returns {string[]}
   */
  getSupportedTypes(): string[];
 
  /**
   * Clear all one time updaters
   */
  clearOneTimeUpdaters(): void;
 
  /**
   * Update the associated render window
   */
  updateRenderWindow(): void;
 
  /**
   * Register a new type to exclude
   * 
   * @param {string} type The type to exclude 
   * @param {string} propertyName The property name to exclude
   * @param {unknown} propertyValue The property value to exclude 
   */
  excludeInstance(type: string, propertyName: string, propertyValue: unknown): void;
 
  /**
   * Set the default types mapping
   * 
   * @param {boolean} [reset] Clear all existing type mappings, defaults to true 
   */
  setDefaultMapping(reset?: boolean): void;
 
  /**
   * Apply the default aliases
   */
  applyDefaultAliases(): void;
 
  /**
   * Always update the camera
   */
  alwaysUpdateCamera(): void;
}

export default IObjectManager;
