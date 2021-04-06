import {
	VtkAlgorithm,
	VtkObject
} from 'vtk.js/Sources/macro';

export enum ShapeType {
	TRIANGLE,
	STAR,
	ARROW_4,
	ARROW_6
}

/**
 *
 */
interface IArrowSourceInitialValues {
	tipResolution?: number;
	tipRadius?: number;
	tipLength?: number;
	shaftResolution?: number;
	shaftRadius?: number;
	invert?: boolean;
	direction?: number[];
	pointType?: string;
}

type vtkAlgorithm = VtkObject & Omit<VtkAlgorithm,
	'getInputData' |
	'setInputData' |
	'setInputConnection' |
	'getInputConnection' |
	'addInputConnection' |
	'addInputData' > ;

export interface vtkArrowSource extends vtkAlgorithm {

	/**
	 * Get the orientation vector of the cone.
	 * @default [1.0, 0.0, 0.0]
	 */
	getDirection(): number[];

	/**
	 * Get the orientation vector of the cone.
	 */
	getDirectionByReference(): number[];

	/**
	 *
	 * @default false
	 */
	getInvert(): boolean;

	/**
	 * Get the resolution of the shaft.
	 * @default 0.03
	 */
	getShaftRadius(): number;

	/**
	 * Get the resolution of the shaft.
	 * @default 6
	 */
	getShaftResolution(): number;

	/**
	 * Get the length of the tip.
	 * @default 0.35
	 */
	getTipLength(): number;

	/**
	 * Get the radius of the tip.
	 * @default 0.1
	 */
	getTipRadius(): number;

	/**
	 * Get the resolution of the tip.
	 * @default 6
	 */
	getTipResolution(): number;

	/**
	 * Expose methods
	 * @param inData
	 * @param outData
	 */
	requestData(inData: any, outData: any): void;

	/**
	 *
	 * @param x
	 * @param y
	 * @param z
	 */
	setDirection(x: number, y: number, z: number): boolean;

	/**
	 *
	 * @param direction
	 */
	setDirectionFrom(direction: number[]): boolean;

	/**
	 * Inverts the arrow direction.
	 * When set to true, base is at [1, 0, 0] while the tip is at [0, 0, 0].
	 * @param invert
	 */
	setInvert(invert: boolean): boolean;

	/**
	 * Set the radius of the shaft.
	 * @param shaftRadius
	 */
	setShaftRadius(shaftRadius: number): boolean;

	/**
	 * Set the resolution of the shaft.
	 * @param shaftResolution
	 */
	setShaftResolution(shaftResolution: number): boolean;

	/**
	 * Set the length of the tip.
	 * @param tipLength
	 */
	setTipLength(tipLength: number): boolean;

	/**
	 * Set the radius of the tip.
	 * @param tipRadius
	 */
	setTipRadius(tipRadius: number): boolean;

	/**
	 * Set the resolution of the tip.
	 * @param tipResolution
	 */
	setTipResolution(tipResolution: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkArrowSource characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param initialValues (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IArrowSourceInitialValues): void;

/**
 * Method used to create a new instance of vtkArrowSource.
 * @param initialValues for pre-setting some of its content
 */
export function newInstance(initialValues?: IArrowSourceInitialValues): vtkArrowSource;

/**
 * vtkArrowSource was intended to be used as the source for a glyph.
 * The shaft base is always at (0,0,0). The arrow tip is always at (1,0,0).
 * If "Invert" is true, then the ends are flipped i.e. tip is at (0,0,0) while base is at (1, 0, 0).
 * The resolution of the cone and shaft can be set and default to 6.
 * The radius of the cone and shaft can be set and default to 0.03 and 0.1.
 * The length of the tip can also be set, and defaults to 0.35.
 */
export declare const vtkArrowSource: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkArrowSource;
