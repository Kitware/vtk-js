import vtkAbstractImageMapper, { IAbstractImageMapperInitialValues } from "../AbstractImageMapper";
import IClosestIJKAxis from "../ImageMapper";
import { Bounds, Nullable } from "../../../types";
import { SlicingMode } from "../ImageMapper/Constants";
import vtkImageData from "../../../Common/DataModel/ImageData";
import vtkCollection from "../../../Common/DataModel/Collection";


interface ICoincidentTopology {
	factor: number;
	offset: number;
}

interface ISliceToSubSlice {
	imageIndex: number;
	subSlice: number;
}

export interface IImageArrayMapperInitialValues extends IAbstractImageMapperInitialValues {
  	slicingMode: SlicingMode.K,
  	sliceToSubSliceMap: ISliceToSubSlice[],
}

export interface vtkImageArrayMapper extends vtkAbstractImageMapper {

	/**
	 * 
	 * @param inputData set input as a vtkCollection of vtkImageData objects.
	 */
	setInputData(inputData: vtkCollection): void;

	/**
	 *  Get vtkImageData corresponding to the provided (global) slice number.
	 * @param slice (global) slice number. If a slice number is not provided,
	 * the function uses the current slice number (i.e. the output of getSlice()).
	 */
	getImage(slice?: number): Nullable<vtkImageData>;

	/**
  	 * Return currently active image. This depends on the currently active slice number.
	 */
	getCurrentImage(): Nullable<vtkImageData>;

	/**
     * Get the bounds for this mapper as [xmin, xmax, ymin, ymax,zmin, zmax].
	 * @return {Bounds} The bounds for the mapper.
	 */
	getBounds(): Bounds;

	/**
	 * Get the bounds for a given slice as [xmin, xmax, ymin, ymax,zmin, zmax].
	 * @param {Number} [slice] The slice index. If undefined, the current slice is considered.
	 * @param {Number} [halfThickness] Half the slice thickness in index space (unit voxel
	 * spacing). If undefined, 0 is considered.
	 * @return {Number[]} The bounds for a given slice.
	 */
	getBoundsForSlice(slice?: number, halfThickness?: number): number[];

	/**
	 * Get the closest IJK axis
	 * @return {IClosestIJKAxis} The axis object.
	 */
	getClosestIJKAxis(): IClosestIJKAxis;

	/**
	 * Calculate the total number of slices in the input collection.
	 */
	computeTotalSlices(): number;

	/**
	 * Fetch the pre-calculated total number of slices in the input collection.
	 */
	getTotalSlices(): number;

	/**
	 *
	 * @param {Number} slice The slice index.
	 */
	setSlice(slice: number): boolean;

	/**
	 * Calculate the global slice number that corresponds to the provided image and subSlice number.
	 * The global slice number corresponds to the total number of 2D image frames that a collection has.
	 * @param imageIndex The image number is the index of the vtkImageData object in the input collection.
	 * @param subSlice The subSlice number is the k-index of a slice within a vtkImageData object in the input collection.
	 */
	computeSlice(imageIndex: number, subSlice: number): number;

	/**
	 * Get the vtkImageData index corresponding to the provided global slice number.
	 * @param slice global slice number. If a slice number is not provided,
	 * the function uses the current slice number (i.e. the output of getSlice()).
	 */
	getImageIndex(slice?: number): number;

	/**
	 * Given a global slice number, identify the subSlice number (slice k-index within a vtkImageData).
	 * @param slice global slice number. If a slice number is not provided,
	 * the function uses the current slice number (i.e. the output of getSlice()).
	 */
	getSubSlice(slice?: number): number;


	/**
	 *
	 */
	getResolveCoincidentTopology(): ICoincidentTopology

	/**
	 *
	 */
	getResolveCoincidentTopologyAsString(): ICoincidentTopology

	/**
	 *
	 */
	getResolveCoincidentTopologyLineOffsetParameters(): ICoincidentTopology

	/**
	 *
	 */
	getResolveCoincidentTopologyPointOffsetParameters(): ICoincidentTopology

	/**
	 *
	 */
	getResolveCoincidentTopologyPolygonOffsetFaces(): ICoincidentTopology

	/**
	 *
	 */
	getResolveCoincidentTopologyPolygonOffsetParameters(): ICoincidentTopology;

	/**
	 *
	 * @param {Number} factor 
	 * @param {Number} offset 
	 */
	setRelativeCoincidentTopologyLineOffsetParameters(factor: number, offset: number): boolean;

	/**
	 *
	 * @param {Number} factor 
	 * @param {Number} offset 
	 */
	setRelativeCoincidentTopologyPointOffsetParameters(factor: number, offset: number): boolean;

	/**
	 *
	 * @param {Number} factor 
	 * @param {Number} offset 
	 */
	setRelativeCoincidentTopologyPolygonOffsetParameters(factor: number, offset: number): boolean;

	/**
	 *
	 * @param resolveCoincidentTopology
	 * @default false
	 */
	setResolveCoincidentTopology(resolveCoincidentTopology: boolean): boolean;

	/**
	 *
	 * @param {Number} factor 
	 * @param {Number} offset 
	 */
	setResolveCoincidentTopologyLineOffsetParameters(factor: number, offset: number): boolean;

	/**
	 *
	 * @param {Number} factor 
	 * @param {Number} offset 
	 */
	setResolveCoincidentTopologyPointOffsetParameters(factor: number, offset: number): boolean;

	/**
	 *
	 * @param value
	 */
	setResolveCoincidentTopologyPolygonOffsetFaces(value: number): boolean;

	/**
	 *
	 * @param {Number} factor 
	 * @param {Number} offset 
	 */
	setResolveCoincidentTopologyPolygonOffsetParameters(factor: number, offset: number): boolean;

	/**
	 *
	 */
	setResolveCoincidentTopologyToDefault(): boolean;

	/**
	 *
	 */
	setResolveCoincidentTopologyToOff(): boolean;

	/**
	 *
	 */
	setResolveCoincidentTopologyToPolygonOffset(): boolean;

	/**
	 * Set the slicing mode. 
	 * @param {Number} mode The slicing mode.
	 */
	setSlicingMode(mode: number): boolean;

	/**
	 *
	 * @param {Number[]} p1 The coordinates of the first point.
	 * @param {Number[]} p2 The coordinates of the second point.
	 */
	intersectWithLineForPointPicking(p1: number[], p2: number[]): any;

	/**
	 *
	 * @param {Number[]} p1 The coordinates of the first point.
	 * @param {Number[]} p2 The coordinates of the second point.
	 */
	intersectWithLineForCellPicking(p1: number[], p2: number[]): any;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkImageArrayMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IImageArrayMapperInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IImageArrayMapperInitialValues): void;

/**
 * Method use to create a new instance of vtkImageArrayMapper
 * @param {IImageArrayMapperInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IImageArrayMapperInitialValues): vtkImageArrayMapper;

/**
 * vtkImageArrayMapper provides display support for a collection of single/multi-frame images.
 * Images can have variable dimensions (width, height, depth in pixels), can be mixture of
 * color (RGB) and grayscale images, origin point and direction cosines.
 * It can be associated with a vtkImageSlice prop and placed within a Renderer.
 *
 * This class resolves coincident topology with the same methods as vtkMapper.
 */
export declare const vtkImageArrayMapper: {
	newInstance: typeof newInstance;
	extend: typeof extend;
	SlicingMode: typeof SlicingMode;
}
export default vtkImageArrayMapper;
