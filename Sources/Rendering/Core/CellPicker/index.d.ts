import vtkMapper  from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPicker from 'vtk.js/Sources/Rendering/Core/Picker';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';

/**
 * 
 */
interface ICellPickerInitialValues {
	cellId?: number;
	pCoords?: number[];
	cellIJK?: number[];
	pickNormal?: number[];
	mapperNormal?: number[];
}

export interface vtkCellPicker extends vtkPicker {

	/**
	 * Get the structured coordinates of the cell at the PickPosition.
	 */
	getCellIJK(): number[];

	/**
	 * 
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
	 * @param cell 
	 * @param weights 
	 * @param normal 
	 */
	computeSurfaceNormal(data: any, cell: any, weights: number[], normal: number[]): boolean;

	/**
	 * 
	 * @param selection 
	 * @param renderer 
	 */
	pick(selection: any, renderer: vtkRenderer): void;

	/**
	 * 
	 * @param p1 
	 * @param p2 
	 * @param tol 
	 * @param mapper 
	 */
	intersectWithLine(p1: number[], p2: number[], tol: number, mapper: vtkMapper): number;

	/**
	 * 
	 * @param p1 
	 * @param p2 
	 * @param t1 
	 * @param t2 
	 * @param tol 
	 * @param mapper 
	 */
	intersectActorWithLine(p1:  number[], p2:  number[], t1: number, t2: number, tol: number, mapper: vtkMapper): number;
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
