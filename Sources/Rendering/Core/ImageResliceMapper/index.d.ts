import vtkAbstractImageMapper, {
  IAbstractImageMapperInitialValues,
} from '../AbstractImageMapper';
import vtkPlane from '../../../Common/DataModel/Plane';
import vtkPolyData from '../../../Common/DataModel/PolyData';
import { Bounds, Extent } from '../../../types';
import { SlabTypes } from './Constants';

interface ICoincidentTopology {
  factor: number;
  offset: number;
}

export interface IImageResliceMapperInitialValues
  extends IAbstractImageMapperInitialValues {
  slabThickness?: number;
  slabTrapezoidIntegration?: number;
  slabType?: SlabTypes;
  slicePlane?: vtkPlane;
  slicePolyData?: vtkPolyData;
}

export interface vtkImageResliceMapper extends vtkAbstractImageMapper {
  /**
   * Get the bounds for this mapper as [xmin, xmax, ymin, ymax,zmin, zmax].
   * @return {Bounds} The bounds for the mapper.
   */
  getBounds(): Bounds;

  /**
   *
   */
  getIsOpaque(): boolean;

  /**
   *
   */
  getResolveCoincidentTopology(): ICoincidentTopology;

  /**
   *
   */
  getResolveCoincidentTopologyAsString(): ICoincidentTopology;

  /**
   *
   */
  getResolveCoincidentTopologyLineOffsetParameters(): ICoincidentTopology;

  /**
   *
   */
  getResolveCoincidentTopologyPointOffsetParameters(): ICoincidentTopology;

  /**
   *
   */
  getResolveCoincidentTopologyPolygonOffsetFaces(): ICoincidentTopology;

  /**
   *
   */
  getResolveCoincidentTopologyPolygonOffsetParameters(): ICoincidentTopology;

  /**
   *
   * Get the slab thickness in world space (mm).
   */
  getSlabThickness(): number;

  /**
   *
   * Get whether slab trapezoid integration is enabled.
   */
  getSlabTrapezoidIntegration(): number;

  /**
   *
   * Get the slab composite function.
   */
  getSlabType(): SlabTypes;

  /**
   *
   * Get the implicit plane used to slice the volume with.
   */
  getSlicePlane(): vtkPlane;

  /**
   *
   * Get the custom polydata used to slice the volume with.
   */
  getSlicePolyData(): vtkPolyData;

  /**
   *
   * @param {Number} factor
   * @param {Number} offset
   */
  setRelativeCoincidentTopologyLineOffsetParameters(
    factor: number,
    offset: number
  ): boolean;

  /**
   *
   * @param {Number} factor
   * @param {Number} offset
   */
  setRelativeCoincidentTopologyPointOffsetParameters(
    factor: number,
    offset: number
  ): boolean;

  /**
   *
   * @param {Number} factor
   * @param {Number} offset
   */
  setRelativeCoincidentTopologyPolygonOffsetParameters(
    factor: number,
    offset: number
  ): boolean;

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
  setResolveCoincidentTopologyLineOffsetParameters(
    factor: number,
    offset: number
  ): boolean;

  /**
   *
   * @param {Number} factor
   * @param {Number} offset
   */
  setResolveCoincidentTopologyPointOffsetParameters(
    factor: number,
    offset: number
  ): boolean;

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
  setResolveCoincidentTopologyPolygonOffsetParameters(
    factor: number,
    offset: number
  ): boolean;

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
   * Enable slab slicing mode and set the slab thickness in world space (mm).
   * @param {Number} slabThickness The slab thickness in world space (mm). Default: 0.
   */
  setSlabThickness(slabThickness: number): boolean;

  /**
   *
   * When a slab thickness larger than 0 is provided, the mapper will composite multile slices
   * together using different composite functions based on the slabType. When
   * slabTrapezoidIntegration is enabled, the first and the last slices in the slab are weighted at
   * half their original intensity for sum and mean slab types.
   * @param {Number} slabTrapezoidIntegration Enable/disable trapezoid integration for slab slicing.
   * Default: 0
   */
  setSlabTrapezoidIntegration(slabTrapezoidIntegration: number): boolean;

  /**
   *
   * When a slab thickness larger than 0 is provided, the mapper will composite multile slices
   * together using different composite functions based on the slabType. Available options are max,
   * min, mean and sum.
   * @param {SlabTypes} slabType The blend function used to composite slab slices.
   * Default: SlabTypes.MEAN
   */
  setSlabType(slabType: SlabTypes): boolean;

  /**
   *
   * The vtkImageResliceMapper provides flexibility in how the reslice source is provided. The user
   * can either provide an implicit vtkPlane (defined with its origin and normal), or a custom
   * vtkPolyData. When both sources are provided, the mapper chooses the custom polydata over the
   * implicit plane. When providing custom polydata as the source, it is required that the polydata
   * has point normals for slab slicing. When neither sources are provided, the mapper creates a
   * default implicit plane with normal (0, 0, 1) and origin at the mid-point of the volume's Z
   * bounds.
   * @param {vtkPlane} slicePlane The implicit plane to slice the volume with. Default: null
   */
  setSlicePlane(slicePlane: vtkPlane): boolean;

  /**
   *
   * The vtkImageResliceMapper provides flexibility in how the reslice source is provided. The user
   * can either provide an implicit vtkPlane (defined with its origin and normal), or a custom
   * vtkPolyData. When both sources are provided, the mapper chooses the custom polydata over the
   * implicit plane. When providing custom polydata as the source, it is required that the polydata
   * has point normals for slab slicing. When neither sources are provided, the mapper creates a
   * default implicit plane with normal (0, 0, 1) and origin at the mid-point of the volume's Z
   * bounds.
   * @param {vtkPolyData} slicePolyData The polydata to slice the volume with. Default: null
   */
  setSlicePolyData(slicePolyData: vtkPolyData): boolean;

  /**
   * Tells the mapper to only update the specified extents.
   *
   * If there are zero extents, the mapper updates the entire volume texture.
   * Otherwise, the mapper will only update the texture by the specified extents
   * during the next render call.
   *
   * This array is cleared after a successful render.
   * @param extents
   */
  setUpdatedExtents(extents: Extent[]): boolean;

  /**
   * Retrieves the updated extents.
   *
   * This array is cleared after every successful render.
   */
  getUpdatedExtents(): Extent[];
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkImageResliceMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IImageResliceMapperInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IImageResliceMapperInitialValues
): void;

/**
 * Method use to create a new instance of vtkImageResliceMapper
 * @param {IImageResliceMapperInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IImageResliceMapperInitialValues
): vtkImageResliceMapper;

/**
 * vtkImageResliceMapper provides hardware accelerated slicing of 3D image data / volumes.
 * It can be associated with a vtkImageSlice prop and placed within a Renderer.
 *
 * This class resolves coincident topology with the same methods as vtkMapper.
 */
export declare const vtkImageResliceMapper: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkImageResliceMapper;
