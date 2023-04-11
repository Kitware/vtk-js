import vtkAbstractMapper3D, { IAbstractMapper3DInitialValues } from "../AbstractMapper3D";
import vtkImageData from "../../../Common/DataModel/ImageData";
import { Nullable } from "../../../types";


export interface IAbstractImageMapperInitialValues extends IAbstractMapper3DInitialValues {
	customDisplayExtent?: number[];
	useCustomExtents?: boolean;
	slice?: number;
}

export interface vtkAbstractImageMapper extends vtkAbstractMapper3D {

	/**
	 *
	 */
	getIsOpaque(): boolean;

	/**
  	 * Return currently active image for the mapper. Overridden by deriving classes.
	 */
	getCurrentImage(): Nullable<vtkImageData>;

	/**
	 * Get the slice index.
	 */
	getSlice(): number;

	/**
	 *
	 * @param {Number} slice The slice index.
	 */
	setSlice(slice: number): boolean;

	/**
	 *
	 */
	getUseCustomExtents(): boolean;

	/**
	 *
	 * @param {Boolean} useCustomExtents
	 */
	setUseCustomExtents(useCustomExtents: boolean): boolean;

	/**
	 *
	 * @param {Number} x1 The x coordinate of the first point.
	 * @param {Number} x2 The x coordinate of the second point.
	 * @param {Number} y1 The y coordinate of the first point.
	 * @param {Number} y2 The y coordinate of the second point.
	 * @param {Number} z1 The z coordinate of the first point.
	 * @param {Number} z2 The z coordinate of the second point.
	 */
	setCustomDisplayExtent(x1: number, x2: number, y1: number, y2: number, z1: number, z2: number): boolean;

	/**
	 *
	 * @param customDisplayExtent
	 */
	setCustomDisplayExtentFrom(customDisplayExtent: number[]): boolean;
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
