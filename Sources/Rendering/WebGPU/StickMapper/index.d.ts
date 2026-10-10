import vtkWebGPUCellArrayMapper, {
  IWebGPUCellArrayMapperInitialValues,
} from '../CellArrayMapper';

export interface IWebGPUStickMapperInitialValues extends IWebGPUCellArrayMapperInitialValues {}

export interface vtkWebGPUStickMapper extends vtkWebGPUCellArrayMapper {
  /**
   * Update the renderable and take its points as the cell array this mapper
   * draws, then run the cell array mapper build pass.
   * @param prepass
   */
  buildPass(prepass: boolean): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUStickMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUStickMapperInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUStickMapperInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUStickMapper.
 * @param {IWebGPUStickMapperInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUStickMapperInitialValues
): vtkWebGPUStickMapper;

/**
 * The WebGPU view node of vtkStickMapper. It draws one impostor box per point
 * and ray casts a cylinder in the fragment shader.
 */
export declare const vtkWebGPUStickMapper: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUStickMapper;
