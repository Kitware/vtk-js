import vtkWebGPUCellArrayMapper, {
  IWebGPUCellArrayMapperInitialValues,
} from '../CellArrayMapper';

export interface IWebGPUSphereMapperInitialValues extends IWebGPUCellArrayMapperInitialValues {}

export interface vtkWebGPUSphereMapper extends vtkWebGPUCellArrayMapper {
  /**
   * Update the renderable and take its points as the cell array this mapper
   * draws, then run the cell array mapper build pass.
   * @param prepass
   */
  buildPass(prepass: boolean): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUSphereMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUSphereMapperInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUSphereMapperInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUSphereMapper.
 * @param {IWebGPUSphereMapperInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUSphereMapperInitialValues
): vtkWebGPUSphereMapper;

/**
 * The WebGPU view node of vtkSphereMapper. It draws one impostor quad per
 * point and ray casts a sphere in the fragment shader.
 */
export declare const vtkWebGPUSphereMapper: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUSphereMapper;
