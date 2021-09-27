import { vtkObject } from "../../../interfaces";

/**
 *
 */
export interface ILineManipulatorInitialValues {
	origin?: number[];
	normal?: number[];
}

export interface vtkLineManipulator extends vtkObject {

	/**
	 * Set the normal of the line
	 */
	getNormal(): number[];

	/**
	 * Set the normal of the line
	 */
	getNormalByReference(): number[];

	/**
	 * Set the origin of the line
	 */
	getOrigin(): number[];

	/**
	 * Set the origin of the line
	 */
	getOriginByReference(): number[];

	/**
	 * 
	 * @param callData 
	 * @param glRenderWindow 
	 */
	handleEvent(callData: any, glRenderWindow: any): number[];

	/**
	 * Set the normal of the line
	 * @param {Number[]} normal The normal coordinate.
	 */
	setNormal(normal: number[]): boolean;

	/**
	 * Set the normal of the line
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setNormal(x: number, y: number, z: number): boolean;

	/**
	 * Set the normal of the line
	 * @param {Number[]} normal The normal coordinate.
	 */
	setNormalFrom(normal: number[]): boolean;

	/**
	 * Set the origin of the line.
	 * @param {Number[]} origin The coordinate of the origin point.
	 */
	setOrigin(origin: number[]): boolean;

	/**
	 * Set the origin of the line
	 * @param {Number} x The x coordinate of the origin point.
	 * @param {Number} y The y coordinate of the origin point.
	 * @param {Number} z The z coordinate of the origin point.
	 */
	setOrigin(x: number, y: number, z: number): boolean;

	/**
	 * Set the origin of the line
	 * @param {Number[]} origin The coordinate of the origin point.
	 */
	setOriginFrom(origin: number[]): boolean;
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
 * @param {Number[]} lineOrigin 
 * @param {Number[]} lineDirection 
 * @param renderer 
 * @param glRenderWindow 
 */
export function projectDisplayToLine(x: number, y: number, lineOrigin: number[], lineDirection: number[], renderer: any, glRenderWindow: any): number[];

/**
 * vtkLineManipulator.
 */
export declare const vtkLineManipulator: {
	newInstance: typeof newInstance,
	extend: typeof extend,
	projectDisplayToLine: typeof projectDisplayToLine;
};
export default vtkLineManipulator;
