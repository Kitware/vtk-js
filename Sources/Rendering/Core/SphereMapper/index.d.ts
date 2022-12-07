import vtkMapper, { IMapperInitialValues } from "../Mapper";

export interface ISphereInitialValues extends IMapperInitialValues {
	radius?: number;
}

export interface vtkSphereMapper extends vtkMapper {

	/**
	 * 
	 */
	getRadius(): number;

	/**
	 * 
	 */
	getScaleArray(): any;

	/**
	 * 
	 */
	getScaleFactor(): number;

	/**
	 * 
	 * @param {Number} radius 
	 */
	setRadius(radius: number): boolean;

	/**
	 * 
	 * @param scaleArray 
	 */
	setScaleArray(scaleArray: any): boolean;

/**
	 * Factor multiplied with scale array elements. Radius is used when no scale array is given.
	 * @param scaleFactor number to multiply with when a scale array is provided. 1 by default.
	 * @see getScaleFactor(), setScaleArray(), setRadius()
	 */ 
	setScaleFactor(scaleFactor: number): boolean;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkSphereMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ISphereInitialValues} [initialValues] (default: {})
 */
 export function extend(publicAPI: object, model: object, initialValues?: ISphereInitialValues): void;

 /**
  * Method use to create a new instance of vtkSphereMapper 
  */
 export function newInstance(initialValues?: ISphereInitialValues): vtkSphereMapper;
 
 /** 
  * vtkSphereMapper inherits from vtkMapper.
  */
 export declare const vtkSphereMapper: {
	 newInstance: typeof newInstance,
	 extend: typeof extend,
 };
 export default vtkSphereMapper;