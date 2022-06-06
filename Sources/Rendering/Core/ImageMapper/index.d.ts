import vtkCamera from "../Camera";
import vtkAbstractMapper, { IAbstractMapperInitialValues } from "../AbstractMapper";
import { Bounds, Vector3 } from "../../../types";
import { SlicingMode } from "./Constants";


interface IClosestIJKAxis {
	ijkMode: SlicingMode,
	flip: boolean
}

interface ICoincidentTopology {
	factor: number;
	offset: number;
}

export interface IImageMapperInitialValues extends IAbstractMapperInitialValues {
	displayExtent?: number[];
	customDisplayExtent?: number[];
	useCustomExtents?: boolean;
	slice?: number;
	closestIJKAxis?: IClosestIJKAxis;
	renderToRectangle?: boolean;
	sliceAtFocalPoint?: boolean;
}

export interface vtkImageMapper extends vtkAbstractMapper {

  /**
   * Returns the IJK slice value from a world position or XYZ slice value
   * @param {Vector3 | number} [pos] World point or XYZ slice value
   */
	getSliceAtPosition(pos: Vector3 | number): number;

	/**
	 * Get the closest IJK axis
	 * @return {IClosestIJKAxis} The axis object.
	 */
	getClosestIJKAxis(): IClosestIJKAxis;

	/**
     * Get the bounds for this mapper as [xmin, xmax, ymin, ymax,zmin, zmax].
	 * @return {Bounds} The bounds for the mapper.
	 */
	getBounds(): Bounds;

	/**
	 * Get the bounds for a given slice as [xmin, xmax, ymin, ymax,zmin, zmax].
	 * @param {Number} [slice] The slice index.
	 * @param {Number} [halfThickness] Half the slice thickness in index space (unit voxel spacing).
	 * @return {Number[]} The bounds for a given slice.
	 */
	getBoundsForSlice(slice?: number, halfThickness?: number): number[];

	/**
	 *
	 */
	getIsOpaque(): boolean;


	/**
	 *
	 */
	getRenderToRectangle(): boolean;

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
	 * Get the slice index.
	 */
	getSlice(): number;

	/**
	 * Get the slice number at a focal point.
	 */
	getSliceAtFocalPoint(): boolean;

	/**
	 *
	 */
	getUseCustomExtents(): boolean;

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

	/**
	 * Set the closest IJK axis
	 * @param {IClosestIJKAxis} closestIJKAxis The axis object.
	 */
	setClosestIJKAxis(closestIJKAxis: IClosestIJKAxis): boolean;

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
	setResolveCoincidentTopologyPolygonOffsetParameters(factor: number, offset: number)

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
	 *
	 * @param {Boolean} renderToRectangle 
	 */
	setRenderToRectangle(renderToRectangle: boolean): boolean;

	/**
	 *
	 * @param {Number} slice The slice index.
	 */
	setSlice(slice: number): boolean;

	/**
	 * Set the slice from a given camera. 
	 * @param {vtkCamera} cam The camera object.
	 */
	setSliceFromCamera(cam: vtkCamera): boolean;

	/**
	 * Set the slice from a given focal point. 
	 * @param {Boolean} sliceAtFocalPoint
	 */
	sliceAtFocalPoint(sliceAtFocalPoint: boolean): boolean;

	/**
	 * 
	 * @param {Boolean} useCustomExtents 
	 */
	setUseCustomExtents(useCustomExtents: boolean): boolean;

	/**
	 * Set the slice for the X axis. 
	 * @param {Number} id The slice index.
	 */
	setXSlice(id: number): boolean;

	/**
	 * Set the slice for the Y axis. 
	 * @param {Number} id The slice index.
	 */
	setYSlice(id: number): boolean;

	/**
	 * Set the slice for the Z axis. 
	 * @param {Number} id The slice index.
	 */
	setZSlice(id: number): boolean;

	/**
	 * Set the slice for the I axis. 
	 * @param {Number} id The slice index.
	 */
	setISlice(id: number): boolean;

	/**
	 * Set the slice for the J axis. 
	 * @param {Number} id The slice index.
	 */
	setJSlice(id: number): boolean;

	/**
	 * Set the slice for the K axis. 
	 * @param {Number} id The slice index.
	 */
	setKSlice(id: number): boolean;

	/**
	 *
	 */
	getSlicingModeNormal(): number[];

	/**
	 * Set the slicing mode. 
	 * @param {Number} mode The slicing mode.
	 */
	setSlicingMode(mode: number): boolean;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkImageMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IImageMapperInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IImageMapperInitialValues): void;

/**
 * Method use to create a new instance of vtkImageMapper
 * @param {IImageMapperInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IImageMapperInitialValues): vtkImageMapper;

/**
 * vtkImageMapper provides 2D image display support for vtk.
 * It can be associated with a vtkImageSlice prop and placed within a Renderer.
 *
 * This class resolves coincident topology with the same methods as vtkMapper.
 */
export declare const vtkImageMapper: {
	newInstance: typeof newInstance;
	extend: typeof extend;
	SlicingMode: typeof SlicingMode;
}
export default vtkImageMapper;
