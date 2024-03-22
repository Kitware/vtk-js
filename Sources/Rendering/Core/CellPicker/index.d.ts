import vtkCell from '../../../Common/DataModel/Cell';
import { Vector3 } from '../../../types';
import vtkMapper from '../Mapper';
import vtkPicker, { IPickerInitialValues } from '../Picker';
import vtkProp3D from '../Prop3D';
import vtkRenderer from '../Renderer';
import { Nullable } from "../../../types";

/**
 * 
 */
export interface ICellPickerInitialValues extends IPickerInitialValues {
	cellId?: number;
	pCoords?: Vector3;
	cellIJK?: number[];
	pickNormal?: number[];
	mapperNormal?: number[];
	opacityThreshold?:number;
}

export interface vtkCellPicker extends vtkPicker {

	/**
	 * Get the structured coordinates of the cell at the PickPosition.
	 */
	getCellIJK(): number[];

	/**
	 * Get the structured coordinates of the cell at the PickPosition.
	 */
	getCellIJKByReference(): number[];

	/**
	 * Get the id of the picked cell.
	 */
	getCellId(): number;

	/**
	 * 
	 */
	getMapperNormal(): number[];

	/**
	 * 
	 */
	getMapperNormalByReference(): number[];

	/**
	 * Get the opacity threshold for volume picking
	 */
	getOpacityThreshold(): number;

	/**
	 * Get the opacity threshold for volume picking
	 */
	setOpacityThreshold(value: number);

	/**
	 * Get the parametric coordinates of the picked cell.
	 */
	getPCoords(): number[];

	/**
	 * 
	 */
	getPCoordsByReference(): number[];

	/**
	 * 
	 */
	initialize(): void;

	/**
	 * 
	 * @param data 
	 * @param {vtkCell} cell 
	 * @param {Number[]} weights 
	 * @param {Number[]} normal 
	 */
	computeSurfaceNormal(data: any, cell: vtkCell, weights: number[], normal: number[]): boolean;

	/**
	 * 
	 * @param selection 
	 * @param {vtkRenderer} renderer The vtkRenderer instance.
	 */
	pick(selection: any, renderer: vtkRenderer): void;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkCellPicker characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ICellPickerInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ICellPickerInitialValues): void;

/**
 * Method use to create a new instance of vtkCellPicker
 * @param {ICellPickerInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ICellPickerInitialValues): vtkCellPicker;

export declare const vtkCellPicker: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkCellPicker;
