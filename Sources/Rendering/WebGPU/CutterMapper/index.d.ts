import vtkWebGPUCellArrayMapper from '../CellArrayMapper';
import vtkWebGPUPolyDataMapper, {
  IWebGPUPolyDataMapperInitialValues,
} from '../PolyDataMapper';

export interface IWebGPUCutterMapperInitialValues extends IWebGPUPolyDataMapperInitialValues {}

export interface vtkWebGPUCutterMapper extends vtkWebGPUPolyDataMapper {
  /**
   * Create a cell array mapper whose shaders cut the geometry against the
   * implicit function of the renderable's cut function.
   */
  createCellArrayMapper(): vtkWebGPUCellArrayMapper;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUCutterMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUCutterMapperInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUCutterMapperInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUCutterMapper.
 * @param {IWebGPUCutterMapperInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUCutterMapperInitialValues
): vtkWebGPUCutterMapper;

/**
 * The WebGPU view node of vtkCutterMapper. It cuts the input geometry on the
 * GPU, in the vertex shader of its cell array mappers.
 */
export declare const vtkWebGPUCutterMapper: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUCutterMapper;
