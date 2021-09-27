import { vtkObject } from "../../../interfaces";

/**
 *
 */
export interface ITrackballManipulatorInitialValues {
	normal?: number[];
}

export interface vtkTrackballManipulator extends vtkObject {

	/**
	 * Get normal
	 */
	getNormal(): number[];

	/**
	 * Get normal
	 */
	getNormalByReference(): number[];

	/**
	 * 
	 * @param callData 
	 * @param glRenderWindow 
	 */
	handleEvent(callData: any, glRenderWindow: any): void;

	/**
	 * Set the normal of the line.
	 * @param {Number[]} normal The normal coordinate.
	 */
	setNormal(normal: number[]): boolean;

	/**
	 * Set the normal of the line.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setNormal(x: number, y: number, z: number): boolean;

	/**
	 * Set the normal of the line.
	 * @param {Number[]} normal The normal coordinate.
	 */
	setNormalFrom(normal: number[]): boolean;

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
 * @param {Number[]} origin 
 * @param {Number[]} direction 
 * @param renderer 
 * @param glRenderWindow 
 */
export function trackballRotate(prevX: number, prevY: number, curX: number, curY: number, origin: number[], direction: number[], renderer: any, glRenderWindow: any): void;


/**
 * vtkTrackballManipulator.
 */
export declare const vtkTrackballManipulator: {
	newInstance: typeof newInstance,
	extend: typeof extend,
	trackballRotate: typeof trackballRotate;
};
export default vtkTrackballManipulator;
