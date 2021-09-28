import { vtkObject } from "../../../interfaces" ;
import { Vector3 } from "../../../types";
import vtkActor from '../Actor';
import vtkRenderer from '../Renderer'

/**
 * 
 */
export interface IAbstractPickerInitialValues {
	renderer?: vtkRenderer,
	selectionPoint?: Vector3,
	pickPosition?: Vector3,
	pickFromList?: number,
	pickList?: vtkActor[],
}

/**
 * 
 */
export interface vtkAbstractPicker extends vtkObject {

	/**
	 * 
	 * @param {vtkActor} actor 
	 */
	addPickList(actor : vtkActor): void;

	/**
	 * 
	 * @param {vtkActor} actor 
	 */
	deletePickList(actor : vtkActor): void;

	/**
	 * 
	 */
	getPickFromList(): boolean;

	/**
	 *
	 */
	getPickList(): boolean;

	/**
	 * Get the picked position
	 * @default [0.0, 0.0, 0.0]
	 */
	getPickPosition(): Vector3;

	/**
	 * 
	 * Get the picked position
	 * @default [0.0, 0.0, 0.0]
	 */
	getPickPositionByReference(): Vector3;
	
	/**
	 * 
	 */
	getRenderer(): vtkRenderer;

	/**
	 * 
	 * @default [0.0, 0.0, 0.0]
	 */
	getSelectionPoint(): Vector3;

	/**
	 * 
	 * @default [0.0, 0.0, 0.0]
	 */
	getSelectionPointByReference(): Vector3;

	/**
	 * 
	 */
	initialize(): void;

	/**
	 * Set pickList to empty array.
	 */
	initializePickList(): void;

	/**
	 * 
	 * @param {Number}  pickFromList 
	 * @default 0
	 */
	setPickFromList(pickFromList: number): boolean;

	/**
	 * 
	 * @param {vtkActor[]} pickList 
	 * @default []
	 */
	setPickList(pickList: vtkActor[]): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkAbstractPicker characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IAbstractPickerInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: IAbstractPickerInitialValues, model: object, initialValues?: object): void;

/**
 * vtkAbstractPicker is an abstract superclass that defines a minimal API for its concrete subclasses.
 * The minimum functionality of a picker is to return the x-y-z global coordinate position of a pick (the pick itself is defined in display coordinates).
 * 
 * The API to this class is to invoke the Pick() method with a selection point (in display coordinates - pixels)
 * and a renderer. Then get the resulting pick position in global coordinates with the GetPickPosition() method.
 * @see [vtkPointPicker](./Rendering_Core_PointPicker.html)
 */
export declare const vtkAbstractPicker: {
    extend: typeof extend,
};
export default vtkAbstractPicker;
