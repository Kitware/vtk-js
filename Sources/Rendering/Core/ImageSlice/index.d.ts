import { Bounds } from "../../../types";
import vtkImageProperty from "../ImageProperty";
import vtkMapper from "../Mapper";
import vtkProp3D, { IProp3DInitialValues } from "../Prop3D";

interface IImageSliceInitialValues extends IProp3DInitialValues{
	mapper?: vtkMapper;
	property?: vtkImageProperty;
	bounds?: Bounds;
}


export interface vtkImageSlice extends vtkProp3D {

	/**
	 * 
	 */
	getActors(): any;

	/**
	 * Get the bounds for this mapper as [xmin, xmax, ymin, ymax,zmin, zmax].
	 * @return {Bounds} The bounds for the mapper.
	 */
	getBounds(): Bounds;

	/**
	 * Get the bounds for a given slice as [xmin, xmax, ymin, ymax,zmin, zmax].
	 * @param {Number} slice The slice index.
	 * @param {Number} [thickness] The slice thickness.
	 * @return {Bounds} The bounds for a given slice.
	 */
	getBoundsForSlice(slice: number, thickness?: number): Bounds;

	/**
	 * 
	 */
	getImages(): any;

	/**
	 * 
	 */
	getIsOpaque(): boolean;

	/**
	 * 
	 */
	getProperty(): vtkImageProperty;

	/**
	 * 
	 */
	getMapper(): vtkMapper;
	
	/**
	 * Get the minimum X bound
	 */
	getMinXBound(): number;

	/**
	 * Get the maximum X bound
	 */
	getMaxXBound(): number;

	/**
	 * Get the minimum Y bound
	 */
	getMinYBound(): number;

	/**
	 * Get the maximum Y bound
	 */
	getMaxYBound(): number;

	/**
	 * Get the minimum Z bound
	 */
	getMinZBound(): number;

	/**
	 * Get the maximum Z bound
	 */
	getMaxZBound(): number;

	/**
	 * Return the `Modified Time` which is a monotonic increasing integer
	 * global for all vtkObjects.
	 *
	 * This allow to solve a question such as:
	 *  - Is that object created/modified after another one?
	 *  - Do I need to re-execute this filter, or not? ...
	 *
	 * @return {Number} the global modified time.
	 */
	getMTime(): number;

	/**
	 * 
	 */
	getRedrawMTime(): number;

	/**
	 * 
	 */
	getSupportsSelection(): boolean;

	/**
	 * Always render during opaque pass, to keep the behavior
	 * predictable and because depth-peeling kills alpha-blending.
	 * In the future, the Renderer should render images in layers,
	 * i.e. where each image will have a layer number assigned to it,
	 * and the Renderer will do the images in their own pass.
	 */
	hasTranslucentPolygonalGeometry(): boolean;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkImageSlice characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IImageSliceInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IImageSliceInitialValues): void;

/**
 * Method use to create a new instance of vtkImageSlice
 * @param {IImageSliceInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IImageSliceInitialValues): vtkImageSlice;

/**
 * vtkImageSlice provides 2D image display support for vtk.
 * It can be associated with a vtkImageSlice prop and placed within a Renderer.
 * 
 * This class resolves coincident topology with the same methods as vtkMapper.
 */
export declare const vtkImageSlice: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkImageSlice;
