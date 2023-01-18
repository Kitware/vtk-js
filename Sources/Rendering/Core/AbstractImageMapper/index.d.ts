import vtkAbstractMapper, { IAbstractMapperInitialValues } from "../AbstractMapper";
import vtkImageData from "../../../Common/DataModel/ImageData";


export interface IAbstractImageMapperInitialValues extends IAbstractMapperInitialValues {
	slice?: number;
}

export interface vtkAbstractImageMapper extends vtkAbstractMapper {

	/**
	 *
	 */
	getIsOpaque(): boolean;

	/**
  	 * Return currently active image for the mapper. Overridden by deriving classes.
	 */
	getCurrentImage(): vtkImageData | null;

	/**
	 * Get the slice index.
	 */
	getSlice(): number;

	/**
	 *
	 * @param {Number} slice The slice index.
	 */
	setSlice(slice: number): boolean;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkAbstractImageMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IAbstractImageMapperInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IAbstractImageMapperInitialValues): void;

/**
 * vtkImageMapper provides 2D image display support for vtk.
 * It can be associated with a vtkImageSlice prop and placed within a Renderer.
 *
 * This class resolves coincident topology with the same methods as vtkMapper.
 */
export declare const vtkAbstractImageMapper: {
	extend: typeof extend;
}
export default vtkAbstractImageMapper;
