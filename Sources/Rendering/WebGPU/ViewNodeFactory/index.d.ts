import {
  IViewNodeFactoryInitialValues,
  vtkViewNodeFactory,
} from '../../SceneGraph/ViewNodeFactory';
import { vtkViewNode } from '../../SceneGraph/ViewNode';

/**
 * Register the view node factory function used for a given renderable class
 * name. The mapping is static and shared by every vtkWebGPUViewNodeFactory
 * instance; each WebGPU backend module registers itself when imported.
 *
 * @param className the renderable class name, e.g. 'vtkActor'
 * @param fn the factory creating the matching view node
 */
export function registerOverride(
  className: string,
  fn: (initialValues?: object) => vtkViewNode
): void;

export interface IWebGPUViewNodeFactoryInitialValues extends IViewNodeFactoryInitialValues {}

export interface vtkWebGPUViewNodeFactory extends vtkViewNodeFactory {}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUViewNodeFactory characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUViewNodeFactoryInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUViewNodeFactoryInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUViewNodeFactory.
 * @param {IWebGPUViewNodeFactoryInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUViewNodeFactoryInitialValues
): vtkWebGPUViewNodeFactory;

/**
 * The factory choosing which WebGPU view node to create for a renderable.
 */
export declare const vtkWebGPUViewNodeFactory: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUViewNodeFactory;
