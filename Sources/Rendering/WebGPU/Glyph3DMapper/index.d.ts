import vtkWebGPUCellArrayMapper, {
  IWebGPUCellArrayMapperInitialValues,
} from '../CellArrayMapper';
import vtkWebGPUPolyDataMapper, {
  IWebGPUPolyDataMapperInitialValues,
} from '../PolyDataMapper';

/**
 * The cell array mapper of a glyph, drawing one instance per glyph transform
 * held in the storage buffer of the glyph mapper.
 */
export interface vtkWebGPUGlyph3DCellArrayMapper extends vtkWebGPUCellArrayMapper {
  /**
   * Set the number of glyph instances to draw.
   * @param {Number} val
   */
  setGlyphInstances(val: number): void;
}

export interface IWebGPUGlyph3DMapperInitialValues extends IWebGPUPolyDataMapperInitialValues {}

export interface vtkWebGPUGlyph3DMapper extends vtkWebGPUPolyDataMapper {
  /**
   * Create a glyph cell array mapper sharing the storage buffer and the
   * renderable of this mapper.
   */
  createCellArrayMapper(): vtkWebGPUGlyph3DCellArrayMapper;

  /**
   * Update the renderable, refill the glyph storage buffer and rebuild the
   * cell array mappers of the glyph source.
   * @param prepass
   */
  buildPass(prepass: boolean): void;

  /**
   * Fill the storage buffer with the per instance matrix, normal matrix and
   * color of every glyph, and send it when the renderable rebuilt its arrays.
   */
  updateSSBO(): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUGlyph3DCellArrayMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUCellArrayMapperInitialValues} [initialValues] (default: {})
 */
export function caExtend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUCellArrayMapperInitialValues
): void;

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUGlyph3DMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUGlyph3DMapperInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUGlyph3DMapperInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUGlyph3DMapper.
 * @param {IWebGPUGlyph3DMapperInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUGlyph3DMapperInitialValues
): vtkWebGPUGlyph3DMapper;

/**
 * The WebGPU view node of vtkGlyph3DMapper. It draws the glyph source once per
 * glyph as instances, reading the per instance transforms from a storage
 * buffer.
 */
export declare const vtkWebGPUGlyph3DMapper: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUGlyph3DMapper;
