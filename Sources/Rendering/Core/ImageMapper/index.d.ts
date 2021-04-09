import vtkCamera from "../Camera";
import vtkAbstractMapper from "../AbstractMapper";

export enum SlicingMode {
	NONE,
	I,
	J,
	K,
	X,
	Y,
	Z,
}

interface IClosestIJKAxis {
	/**
	 *
	 */
	ijkMode: SlicingMode,

	/**
	 *
	 */
	flip: boolean
}

interface ICoincidentTopology {
	/**
	 *
	 */
	factor: number;

	/**
	 *
	 */
	offset: number;
}

/**
 *
 */
interface IImageMapperInitialValues {
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
	 *
	 * @param pos
	 */
	getSliceAtPosition(pos: number): number;

	/**
	 *
	 */
	getClosestIJKAxis(): IClosestIJKAxis;

	/**
	 * Get the bounds for this mapper as [Xmin,Xmax,Ymin,Ymax,Zmin,Zmax].
	 * @returns
	 */
	getBounds(): number[];

	/**
	 *
	 * @param slice
	 * @param thickness
	 */
	getBoundsForSlice(slice: number, thickness: number): number[];


	/**
	 *
	 */
	getCoincidentTopologyPolygonOffsetParameters(): ICoincidentTopology;

	/**
	 *
	 */
	getCoincidentTopologyLineOffsetParameters(): ICoincidentTopology;

	/**
	 *
	 */
	getCoincidentTopologyPointOffsetParameter(): ICoincidentTopology;

	/**
	 *
	 */
	getIsOpaque(): boolean;

	/**
	 *
	 */
	getRelativeCoincidentTopologyLineOffsetParameters(): ICoincidentTopology;

	/**
	 *
	 */
	getRelativeCoincidentTopologyPointOffsetParameters(): ICoincidentTopology;

	/**
	 *
	 */
	getRelativeCoincidentTopologyPolygonOffsetParameters(): ICoincidentTopology;

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
	 *
	 */
	getSlice(): number;

	/**
	 *
	 */
	getSliceAtFocalPoint(): boolean;

	/**
	 *
	 */
	getUseCustomExtents(): boolean;

	/**
	 *
	 * @param p1
	 * @param p2
	 */
	intersectWithLineForPointPicking(p1: number[], p2: number[]): any;

	/**
	 *
	 * @param p1
	 * @param p2
	 */
	intersectWithLineForCellPicking(p1: number[], p2: number[]): any;

	/**
	 *
	 * @param closestIJKAxis
	 */
	setClosestIJKAxis(closestIJKAxis: IClosestIJKAxis): boolean;
	/**
	 *
	 * @param x1
	 * @param x2
	 * @param y1
	 * @param y2
	 * @param z1
	 * @param z2
	 */
	setCustomDisplayExtent(x1: number, x2: number, y1: number, y2: number, z1: number, z2: number): boolean;

	/**
	 *
	 * @param customDisplayExtent
	 */
	setCustomDisplayExtentFrom(customDisplayExtent: number[]): boolean;

	/**
	 *
	 * @param factor
	 * @param offset
	 */
	setRelativeCoincidentTopologyLineOffsetParameters(factor: number, offset: number): boolean;

	/**
	 *
	 * @param factor
	 * @param offset
	 */
	setRelativeCoincidentTopologyPointOffsetParameters(factor: number, offset: number): boolean;

	/**
	 *
	 * @param factor
	 * @param offset
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
	 * @param factor
	 * @param offset
	 */
	setResolveCoincidentTopologyLineOffsetParameters(factor: number, offset: number): boolean;

	/**
	 *
	 * @param factor
	 * @param offset
	 */
	setResolveCoincidentTopologyPointOffsetParameters(factor: number, offset: number): boolean;

	/**
	 *
	 * @param value
	 */
	setResolveCoincidentTopologyPolygonOffsetFaces(value: number): boolean;

	/**
	 *
	 * @param factor
	 * @param offset
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
	 * @param renderToRectangle
	 */
	setRenderToRectangle(renderToRectangle: boolean): boolean;

	/**
	 *
	 * @param slice
	 */
	setSlice(slice: number): boolean;

	/**
	 *
	 * @param cam
	 */
	setSliceFromCamera(cam: vtkCamera): boolean;

	/**
	 *
	 * @param sliceAtFocalPoint
	 */
	sliceAtFocalPoint(sliceAtFocalPoint: boolean): boolean;

	/**
	 *
	 */
	setUseCustomExtents(useCustomExtents: boolean): boolean;

	/**
	 *
	 * @param id
	 */
	setXSlice(id: number): boolean;

	/**
	 *
	 * @param id
	 */
	setYSlice(id: number): boolean;

	/**
	 *
	 * @param id
	 */
	setZSlice(id: number): boolean;

	/**
	 *
	 * @param id
	 */
	setISlice(id: number): boolean;

	/**
	 *
	 * @param id
	 */
	setJSlice(id: number): boolean;

	/**
	 *
	 * @param id
	 */
	setKSlice(id: number): boolean;

	/**
	 *
	 * @return
	 */
	getSlicingModeNormal(): number[];

	/**
	 *
	 * @param mode
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
 * @param initialValues for pre-setting some of its content
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
}
export default vtkImageMapper;
