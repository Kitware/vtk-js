import vtkPicker, { IPickerInitialValues } from "../Picker";
import vtkMapper from "../Mapper";
import { Vector3 } from "../../../types";

interface IPointPickerInitialValues extends IPickerInitialValues {
	pointId?: number;
	pointIJK?: number[];
	useCells?: boolean;
}

export interface vtkPointPicker extends vtkPicker {

	/**
	 * 
	 */
	getPointIJK(): number[];

	/**
	 * 
	 */
	getPointIJKByReference(): number[];

	/**
	 * Get the id of the picked point.
	 * If PointId = -1, nothing was picked.
	 */
	getPointId(): number;

	/**
	 * 
	 */
	getUseCells(): boolean;

	/**
	 * 
	 * @param {Vector3} p1 
	 * @param {Vector3} p2 
	 * @param {Number} tol 
	 * @param {vtkMapper} mapper 
	 */
	intersectWithLine(p1: Vector3, p2: Vector3, tol: number, mapper: vtkMapper): number;

	/**
	 * 
	 * @param {Vector3} p1 
	 * @param {Vector3} p2 
	 * @param {Number} tol 
	 * @param {vtkMapper} mapper 
	 */
	intersectActorWithLine(p1: Vector3, p2: Vector3, tol: number, mapper: vtkMapper): number;

	/**
	 * Specify whether the point search should be based on cell points or directly on the point list.
	 * @param useCells 
	 */
	setUseCells(useCells: boolean): boolean;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkPointPicker characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IPointPickerInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IPointPickerInitialValues): void;

/**
 * Method use to create a new instance of vtkPointPicker
 * @param {IPointPickerInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IPointPickerInitialValues): vtkPointPicker;

/** 
 * vtkPointPicker is used to select a point by shooting a ray into a graphics window 
 * and intersecting with actor's defining geometry - specifically its points. 
 * Beside returning coordinates, actor, and mapper, vtkPointPicker returns the id of the point
 * projecting closest onto the ray (within the specified tolerance). 
 * Ties are broken (i.e., multiple points all projecting within the tolerance along 
 * the pick ray) by choosing the point closest to the ray origin (i.e., closest to the eye).
 * 
 * @see [vtkPicker](./Rendering_Core_Picker.html)
 * @see [vtkCellPicker](./Rendering_Core_CellPicker.html)
 */
 export declare const vtkPointPicker: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkPointPicker;
