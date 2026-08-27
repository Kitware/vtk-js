import vtkWebGPUPipeline from '../Pipeline';
import vtkWebGPUSimpleMapper, {
  IWebGPUSimpleMapperInitialValues,
} from '../SimpleMapper';
import vtkWebGPUVertexInput from '../VertexInput';

export interface IWebGPUFullScreenQuadInitialValues extends IWebGPUSimpleMapperInitialValues {}

export interface vtkWebGPUFullScreenQuad extends vtkWebGPUSimpleMapper {
  /**
   * Shader replacement, registered under `replaceShaderPosition`, emitting the
   * clip space position and texture coordinates of the quad.
   * @param {String} hash the pipeline hash
   * @param {vtkWebGPUPipeline} pipeline
   * @param {vtkWebGPUVertexInput} vertexInput
   */
  replaceShaderPosition(
    hash: string,
    pipeline: vtkWebGPUPipeline,
    vertexInput: vtkWebGPUVertexInput
  ): void;

  /**
   * Bind the shared full screen quad buffer of the device as this mapper's
   * vertex input.
   */
  updateBuffers(): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUFullScreenQuad characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUFullScreenQuadInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUFullScreenQuadInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUFullScreenQuad.
 * @param {IWebGPUFullScreenQuadInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUFullScreenQuadInitialValues
): vtkWebGPUFullScreenQuad;

/**
 * A mapper drawing two triangles covering the whole render target, used by the
 * passes that run a fragment shader over the framebuffer.
 */
export declare const vtkWebGPUFullScreenQuad: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUFullScreenQuad;
