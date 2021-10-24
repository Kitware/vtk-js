import { Vector3 } from "../../../types";
import vtkAbstractPicker, { IAbstractPickerInitialValues } from "../AbstractPicker";
import vtkActor from "../Actor";
import vtkMapper from '../Mapper';
import vtkRenderer from '../Renderer';


export interface IPickerInitialValues extends IAbstractPickerInitialValues {
	tolerance?: number;
	mapperPosition?: number[];
	actors?: vtkActor[];
	pickedPositions?: Array<any>;
	globalTMin?: number;
}

export interface vtkPicker extends vtkAbstractPicker {

	/**
	 * Get a collection of all the actors that were intersected.
	 */
	getActors(): vtkActor[];

	/**
	 * Get a pointer to the dataset that was picked (if any).
	 */
	getDataSet(): any;

	/**
	 * Get mapper that was picked (if any)
	 */
	getMapper(): null | vtkMapper;

	/**
	 * Get position in mapper (i.e., non-transformed) coordinates of pick point.
	 */
	getMapperPosition(): number[];

	/**
	 * 
	 */
	getMapperPositionByReference(): number[];

	/**
	 * Get a list of the points the actors returned by GetProp3Ds were intersected at.
	 */
	getPickedPositions(): number[];

	/**
	 * Get tolerance for performing pick operation.
	 */
	getTolerance(): number;

	/**
	 * FIXME: this needs to be check again
	 */
	//invokePickChange(pickedPositions: number[]): any;

	/**
	 * FIXME: this needs to be check again
	 */
	//onPickChange(pickedPositions: number[]): any;

	/**
	 * Intersect data with specified ray.
	 * Project the center point of the mapper onto the ray and determine its parametric value
	 * @param {Vector3} p1 
	 * @param {Vector3} p2 
	 * @param {Number} tol 
	 * @param {vtkMapper} mapper 
	 */
	intersectWithLine(p1: Vector3, p2: Vector3, tol: number, mapper: vtkMapper): number;

	/**
	 * Perform pick operation with selection point provided.
	 * @param selection 
	 * @param {vtkRenderer} renderer 
	 */
	pick(selection: any, renderer: vtkRenderer): any;

	/**
	 * Set position in mapper coordinates of pick point.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setMapperPosition(x: number, y: number, z: number): boolean;

	/**
	 * Set position in mapper coordinates of pick point.
	 * @param {Vector3} mapperPosition The mapper coordinates of pick point.
	 */
	setMapperPositionFrom(mapperPosition: Vector3): boolean;

	/**
	 * Specify tolerance for performing pick operation.
	 * @param {Number} tolerance The tolerance value.
	 */
	setTolerance(tolerance: number): boolean;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkRenderer characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IPickerInitialValues} [initialValues] 
 */
export function extend(publicAPI: object, model: object, initialValues?: IPickerInitialValues): void;

/**
 * Method use to create a new instance of vtkPicker with its focal point at the origin, 
 * and position=(0,0,1). The view up is along the y-axis, view angle is 30 degrees, 
 * and the clipping range is (.1,1000).
 * @param {IPickerInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IPickerInitialValues): vtkPicker;

/**
 * vtkPicker is used to select instances of vtkProp3D by shooting 
 * a ray into a graphics window and intersecting with the actor's bounding box.
 * The ray is defined from a point defined in window (or pixel) coordinates, 
 * and a point located from the camera's position.
 * 
 * vtkPicker may return more than one vtkProp3D, since more than one bounding box may be intersected.
 * vtkPicker returns an unsorted list of props that were hit, and a list of the corresponding world points of the hits.
 * For the vtkProp3D that is closest to the camera, vtkPicker returns the pick coordinates in world and untransformed mapper space,
 * the prop itself, the data set, and the mapper. 
 * For vtkPicker the closest prop is the one whose center point (i.e., center of bounding box) projected on the view ray is closest
 * to the camera. Subclasses of vtkPicker use other methods for computing the pick point.
 */
export declare const vtkPicker: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkPicker;
