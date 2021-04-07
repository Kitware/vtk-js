import { VtkProperty } from "vtk.js/Sources/macro";
import vtkMapper from "vtk.js/Sources/Rendering/Core/Mapper";
import vtkProp3D from "vtk.js/Sources/Rendering/Core/Prop3D";

interface IImageSliceInitialValues{
	/**
	 * 
	 */
	mapper: null | vtkMapper;

	/**
	 * 
	 */
	property: null| VtkProperty;

	/**
	 * 
	 */
	bounds: number[];
}


export interface vtkImageSlice extends vtkProp3D {
	/**
	 * 
	 * @return  
	 */
	getActors(): any;

	/**
	 * Get the bounds as [xmin, xmax, ymin, ymax, zmin, zmax].
	 */
	getBounds(): number[];

	/**
	 * 
	 * @param slice 
	 * @param thickness 
	 * @return  
	 */
	getBoundsForSlice(slice: number, thickness: number): number[];

	/**
	 * 
	 * @return  
	 */
	getImages(): any;

	/**
	 * 
	 * @return  
	 */
	getIsOpaque(): boolean;

	/**
	 * 
	 */
	getProperty(): VtkProperty;

	/**
	 * 
	 */
	getMapper(): vtkMapper;
	
	/**
	 * Get the minimum X bound
	 * @return  
	 */
	getMinXBound(): number;

	/**
	 * Get the maximum X bound
	 * @return  
	 */
	getMaxXBound(): number;

	/**
	 * Get the minimum Y bound
	 * @return  
	 */
	getMinYBound(): number;

	/**
	 * Get the maximum Y bound
	 * @return  
	 */
	getMaxYBound(): number;

	/**
	 * Get the minimum Z bound
	 * @return  
	 */
	getMinZBound(): number;

	/**
	 * Get the maximum Z bound
	 * @return  
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
	 * @returns the global modified time
	 */
	getMTime(): number;

	/**
	 * 
	 */
	getRedrawMTime(): number;

	/**
	 * 
	 * @return  
	 */
	getSupportsSelection(): boolean;

	/**
	 * Always render during opaque pass, to keep the behavior
	 * predictable and because depth-peeling kills alpha-blending.
	 * In the future, the Renderer should render images in layers,
	 * i.e. where each image will have a layer number assigned to it,
	 * and the Renderer will do the images in their own pass.
	 * @return  
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
 * @param initialValues for pre-setting some of its content
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
