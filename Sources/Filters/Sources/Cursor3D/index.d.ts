import {
	VtkAlgorithm,
	VtkObject
} from 'vtk.js/Sources/macro';

import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';


/**
 *
 */
interface ICursor3DInitialValues {
	modelBounds?: number[];
	focalPoint?: number[];
	outline?: boolean;
	axes?: boolean;
	xShadows?: boolean;
	yShadows?: boolean;
	zShadows?: boolean;
	wrap?: boolean;
	translationMode?: boolean;
}

type vtkAlgorithm = VtkObject & Omit<VtkAlgorithm,
	'getInputData' |
	'setInputData' |
	'setInputConnection' |
	'getInputConnection' |
	'addInputConnection' |
	'addInputData' > ;

export interface vtkCursor3D extends vtkAlgorithm {

	/**
	 * Turn every part of the 3D cursor off.
	 */
	allOff(): void;

	/**
	 * Turn every part of the 3D cursor on.
	 */
	allOn(): void;

	/**
	 *
	 */
	getAxes(): boolean;

	/**
	 * Get the position of cursor focus.
	 *
	 */
	getFocalPoint(): number[];

	/**
	 *
	 *
	 */
	getFocalPointByReference(): number[];

	/**
	 *
	 *
	 * @default null
	 */
	getFocus(): null | vtkPolyDat;

	/**
	 * Set the boundary of the 3D cursor.
	 * @default [-1.0, 1.0, -1.0, 1.0, -1.0, 1.0]
	 */
	getModelBounds(): number[];

	/**
	 *
	 *  @default [-1.0, 1.0, -1.0, 1.0, -1.0, 1.0]
	 */
	getModelBoundsByReference(): number[];

	/**
	 *
	 *
	 * @default true
	 */
	getOutline(): boolean;

	/**
	 * Get the translation mode.
	 * @default false
	 */
	getTranslationMode(): boolean;

	/**
	 * Get the state of the cursor wrapping.
	 * @default false
	 */
	getWrap(): boolean;

	/**
	 * Get the state of the wireframe x-shadows.
	 * @default true
	 */
	getXShadows(): boolean;

	/**
	 * Get the state of the wireframe y-shadows.
	 * @default true
	 */
	getYShadows(): boolean;

	/**
	 * Get the state of the wireframe z-shadows.
	 * @default true
	 */
	getZShadows(): boolean;

	/**
	 * Expose methods
	 * @param inData
	 * @param outData
	 */
	requestData(inData: any, outData: any): void;
	/**
	 *
	 * @param flag
	 */
	setAll(flag: boolean): void;

	/**
	 * Turn on/off the wireframe axes.
	 * @param axes
	 */
	setAxes(axes: boolean): boolean;

	/**
	 * Set/Get the position of cursor focus.
	 * If translation mode is on, then the entire cursor (including bounding box, cursor, and shadows) is
	 * translated. Otherwise, the focal point will either be clamped to the bounding box, or wrapped, if Wrap is on.
	 * (Note: this behavior requires that the bounding box is set prior to the focal point.)
	 * @param points
	 */
	setFocalPoint(points: number[]): boolean;

	/**
	 * Set the boundary of the 3D cursor.
	 * @param bounds
	 */
	setModelBounds(bounds: number[]): boolean;

	/**
	 * Enable/disable the translation mode.
	 * If on, changes in cursor position cause the entire widget to translate along with the cursor.
	 * @param translationMode
	 */
	setTranslationMode(translationMode: boolean): boolean;

	/**
	 * Turn on/off cursor wrapping.
	 * If the cursor focus moves outside the specified bounds,
	 * the cursor will either be restrained against the nearest "wall" (Wrap=off),
	 * or it will wrap around (Wrap=on).
	 * @param wrap
	 */
	setWrap(wrap: number): boolean;

	/**
	 * Turn on/off the wireframe x-shadows.

	 * @param xLength
	 */
	setXShadows(xLength: number): boolean;

	/**
	 * Turn on/off the wireframe y-shadows.

	 * @param yLength
	 */
	setYShadows(yLength: number): boolean;

	/**
	 * Turn on/off the wireframe z-shadows.
	 * @param zLength
	 */
	setZShadows(zLength: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkCursor3D characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param initialValues (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ICursor3DInitialValues): void;

/**
 * Method used to create a new instance of vtkCursor3D.
 * @param initialValues for pre-setting some of its content
 */
export function newInstance(initialValues?: ICursor3DInitialValues): vtkCursor3D;

/**
 * vtkCursor3D creates a cube centered at origin. The cube is represented with four-sided polygons.
 * It is possible to specify the length, width, and height of the cube independently.
 */
export declare const vtkCursor3D: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkCursor3D;