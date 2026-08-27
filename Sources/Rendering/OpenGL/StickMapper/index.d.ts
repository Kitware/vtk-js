import {
  IOpenGLPolyDataMapperInitialValues,
  vtkOpenGLPolyDataMapper,
} from '../PolyDataMapper';

/**
 * Initial values for creating a new instance of vtkOpenGLStickMapper.
 */
export interface IOpenGLStickMapperInitialValues extends IOpenGLPolyDataMapperInitialValues {}

/**
 * The stick mapper draws imposter quads that are raycast into sticks in the
 * fragment shader, so it replaces the shader and buffer object hooks of
 * vtkOpenGLPolyDataMapper.
 */
export interface vtkOpenGLStickMapper extends vtkOpenGLPolyDataMapper {
  /**
   * The primitive mode the imposter geometry is drawn with, always triangles
   * whatever representation or primitive type is asked for.
   * @param rep the representation of the actor property
   * @param type the primitive type
   */
  getOpenGLMode(rep: number, type: number): number;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkOpenGLStickMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IOpenGLStickMapperInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IOpenGLStickMapperInitialValues
): void;

/**
 * Method used to create a new instance of vtkOpenGLStickMapper.
 * @param {IOpenGLStickMapperInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IOpenGLStickMapperInitialValues
): vtkOpenGLStickMapper;

/**
 * The OpenGL backend view node for vtkStickMapper.
 */
export declare const vtkOpenGLStickMapper: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkOpenGLStickMapper;
