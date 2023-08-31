import { IAbstractManipulatorInitialValues, vtkAbstractManipulator } from "../AbstractManipulator";

/**
 *
 */
export interface IActorPickManipulatorInitialValues extends IAbstractManipulatorInitialValues {

}

export interface vtkActorPickManipulator extends vtkAbstractManipulator {

}


/**
 * Method use to decorate a given object (publicAPI+model) with vtkActorPickManipulator characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IActorPickManipulatorInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IActorPickManipulatorInitialValues): void;

/**
 * Method use to create a new instance of vtkActorPickManipulator
 */
export function newInstance(initialValues?: IActorPickManipulatorInitialValues): vtkActorPickManipulator;


/**
 * vtkActorPickManipulator.
 */
export declare const vtkActorPickManipulator: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkActorPickManipulator;
