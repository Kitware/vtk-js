import { IAbstractManipulatorInitialValues, vtkAbstractManipulator } from "../AbstractManipulator";
import { Vector3 } from "../../../types";

/**
 *
 */
export interface ITrackballManipulatorInitialValues extends IAbstractManipulatorInitialValues {

}

export interface vtkTrackballManipulator extends vtkAbstractManipulator {

	/**
	 * 
	 */
	reset(callData: any): void;
}


/**
 * Method use to decorate a given object (publicAPI+model) with vtkTrackballManipulator characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ITrackballManipulatorInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ITrackballManipulatorInitialValues): void;

/**
 * Method use to create a new instance of vtkTrackballManipulator
 */
export function newInstance(initialValues?: ITrackballManipulatorInitialValues): vtkTrackballManipulator;

/**
 * 
 * @param {Number} prevX 
 * @param {Number} prevY 
 * @param {Number} curX 
 * @param {Number} curY 
 * @param {Vector3} origin 
 * @param {Vector3} direction 
 * @param renderer 
 * @param glRenderWindow 
 */
export function trackballRotate(prevX: number, prevY: number, curX: number, curY: number, origin: Vector3, direction: Vector3, renderer: any, glRenderWindow: any): void;


/**
 * vtkTrackballManipulator.
 */
export declare const vtkTrackballManipulator: {
	newInstance: typeof newInstance,
	extend: typeof extend,
	trackballRotate: typeof trackballRotate;
};
export default vtkTrackballManipulator;
