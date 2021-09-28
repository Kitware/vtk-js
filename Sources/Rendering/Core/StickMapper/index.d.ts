import vtkMapper, { IMapperInitialValues } from "../Mapper";

interface IStickMappereInitialValues extends IMapperInitialValues{
	radius?: number;
	length?: number;
	scaleArray?: number[],
	orientationArray?: number[],
}

export interface vtkStickMapper extends vtkMapper {

	/**
	 * 
	 */
	getRadius(): number;

	/**
	 * 
	 */
	getScaleArray(): number[];

	/**
	 * 
	 * @param {Number} radius 
	 */
	setRadius(radius: number): boolean;

	/**
	 * 
	 * @param scaleArray 
	 */
	setScaleArray(scaleArray: number[]): boolean;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkStickMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IStickMappereInitialValues} [initialValues] (default: {})
 */
 export function extend(publicAPI: object, model: object, initialValues?: IStickMappereInitialValues): void;

 /**
  * Method use to create a new instance of vtkStickMapper 
  */
 export function newInstance(initialValues?: IStickMappereInitialValues): vtkStickMapper;
 
 /** 
  * vtkStickMapper inherits from vtkMapper.
  * 
  * @see vtkMapper
  */
 export declare const vtkStickMapper: {
	 newInstance: typeof newInstance,
	 extend: typeof extend,
 };
 export default vtkStickMapper;
