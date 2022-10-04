import { IAbstractManipulatorInitialValues, vtkAbstractManipulator } from "../AbstractManipulator";
import { Vector3 } from "../../../types";

/**
 *
 */
export interface IPlaneManipulatorInitialValues extends IAbstractManipulatorInitialValues {

}

export interface vtkPlaneManipulator extends vtkAbstractManipulator {

}


/**
 * Method use to decorate a given object (publicAPI+model) with vtkPlaneManipulator characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IPlaneManipulatorInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IPlaneManipulatorInitialValues): void;

/**
 * Method use to create a new instance of vtkPlaneManipulator
 */
export function newInstance(initialValues?: IPlaneManipulatorInitialValues): vtkPlaneManipulator;

/**
 * 
 * @param {Number} x 
 * @param {Number} y 
 * @param {Vector3} planeOrigin 
 * @param {Vector3} planeNormal 
 * @param renderer 
 * @param glRenderWindow 
 */
export function intersectDisplayWithPlane(x: number, y: number, planeOrigin: Vector3, planeNormal: Vector3, renderer: any, glRenderWindow: any): Vector3;


/**
 * vtkPlaneManipulator.
 */
export declare const vtkPlaneManipulator: {
	newInstance: typeof newInstance,
	extend: typeof extend,
	intersectDisplayWithPlane: typeof intersectDisplayWithPlane;
};
export default vtkPlaneManipulator;
