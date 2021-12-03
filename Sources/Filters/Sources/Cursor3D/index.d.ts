import { vtkAlgorithm, vtkObject } from "../../../interfaces";
import vtkPolyData from '../../../Common/DataModel/PolyData';
import { Bounds, Vector3 } from "../../../types";


/**
 *
 */
export interface ICursor3DInitialValues {
	modelBounds?: Bounds;
	focalPoint?: Vector3;
	outline?: boolean;
	axes?: boolean;
	xShadows?: boolean;
	yShadows?: boolean;
	zShadows?: boolean;
	wrap?: boolean;
	translationMode?: boolean;
}

type vtkCursor3DBase = vtkObject & Omit<vtkAlgorithm,
	| 'getInputData'
	| 'setInputData'
	| 'setInputConnection'
	| 'getInputConnection'
	| 'addInputConnection'
	| 'addInputData'>;

export interface vtkCursor3D extends vtkCursor3DBase {

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
	 */
	getFocalPoint(): Vector3;

	/**
	 *
	 */
	getFocalPointByReference(): Vector3;

	/**
	 *
	 * @default null
	 */
	getFocus(): null | vtkPolyData;

	/**
	 * Set the boundary of the 3D cursor.
	 * @default [-1.0, 1.0, -1.0, 1.0, -1.0, 1.0]
	 */
	getModelBounds(): Bounds;

	/**
	 *
	 *  @default [-1.0, 1.0, -1.0, 1.0, -1.0, 1.0]
	 */
	getModelBoundsByReference(): Bounds;

	/**
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
	 * @param {Boolean} flag 
	 */
	setAll(flag: boolean): void;

	/**
	 * Turn on/off the wireframe axes.
	 * @param {Boolean} axes 
	 */
	setAxes(axes: boolean): boolean;

	/**
	 * Set the position of cursor focus.
	 * If translation mode is on, then the entire cursor (including bounding
	 * box, cursor, and shadows) is translated. Otherwise, the focal point will
	 * either be clamped to the bounding box, or wrapped, if Wrap is on. (Note:
	 * this behavior requires that the bounding box is set prior to the focal
	 * point.)
	 * @param {Vector3} points 
	 */
	setFocalPoint(points: Vector3): boolean;

	/**
	 * Set the boundary of the 3D cursor.
	 * @param {Bounds} bounds The bounds of the 3D cursor.
	 */
	setModelBounds(bounds: Bounds): boolean;

	/**
	 * Enable/disable the translation mode.
	 * If on, changes in cursor position cause the entire widget to translate
	 * along with the cursor.
	 * @param {Boolean} translationMode 
	 */
	setTranslationMode(translationMode: boolean): boolean;

	/**
	 * Turn on/off cursor wrapping.
	 * If the cursor focus moves outside the specified bounds,
	 * the cursor will either be restrained against the nearest "wall" (Wrap=off),
	 * or it will wrap around (Wrap=on).
	 * @param {Number} wrap 
	 */
	setWrap(wrap: number): boolean;

	/**
	 * Turn on/off the wireframe x-shadows.

	 * @param {Number} xLength 
	 */
	setXShadows(xLength: number): boolean;

	/**
	 * Turn on/off the wireframe y-shadows.

	 * @param {Number} yLength 
	 */
	setYShadows(yLength: number): boolean;

	/**
	 * Turn on/off the wireframe z-shadows.
	 * @param {Number} zLength 
	 */
	setZShadows(zLength: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkCursor3D characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ICursor3DInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ICursor3DInitialValues): void;

/**
 * Method used to create a new instance of vtkCursor3D.
 * @param {ICursor3DInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ICursor3DInitialValues): vtkCursor3D;

/**
 * vtkCursor3D is an object that generates a 3D representation of a cursor. The
 * cursor consists of a wireframe bounding box, three intersecting axes lines
 * that meet at the cursor focus, and "shadows" or projections of the axes
 * against the sides of the bounding box. Each of these components can be turned
 * on/off.
 * 
 * @example
 * ```js
 * import vtkCursor3D from '@kitware/vtk.js/Filters/Sources/vtkCursor3D';
 * 
 * const cursor = vtkCursor3D.newInstance({focalPoint: [0, 0, 0], modelBounds: [-100, 100, -100, 100, -100, 100]});
 * const polyData = cursor.getOutputData();
 * ```
 */
export declare const vtkCursor3D: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkCursor3D;
