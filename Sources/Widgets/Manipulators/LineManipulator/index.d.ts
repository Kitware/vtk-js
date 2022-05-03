import { IAbstractManipulatorInitialValues, vtkAbstractManipulator } from "../AbstractManipulator";
import { Vector3 } from "../../../types";

/**
 *
 */
export interface ILineManipulatorInitialValues extends IAbstractManipulatorInitialValues {

}

export interface vtkLineManipulator extends vtkAbstractManipulator {

}


/**
 * Method use to decorate a given object (publicAPI+model) with vtkLineManipulator characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ILineManipulatorInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ILineManipulatorInitialValues): void;

/**
 * Method use to create a new instance of vtkLineManipulator
 */
export function newInstance(initialValues?: ILineManipulatorInitialValues): vtkLineManipulator;

/**
 * 
 * @param {Number} x 
 * @param {Number} y 
 * @param {Vector3} lineOrigin 
 * @param {Vector3} lineDirection 
 * @param renderer 
 * @param glRenderWindow 
 */
export function projectDisplayToLine(x: number, y: number, lineOrigin: Vector3, lineDirection: Vector3, renderer: any, glRenderWindow: any): Vector3;

/**
 * vtkLineManipulator.
 */
export declare const vtkLineManipulator: {
	newInstance: typeof newInstance,
	extend: typeof extend,
	projectDisplayToLine: typeof projectDisplayToLine;
};
export default vtkLineManipulator;
