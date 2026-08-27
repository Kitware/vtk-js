import {
  IOpenGLPolyDataMapperInitialValues,
  vtkOpenGLPolyDataMapper,
} from '../PolyDataMapper';

/**
 * Initial values for creating a new instance of vtkOpenGLSphereMapper.
 */
export interface IOpenGLSphereMapperInitialValues extends IOpenGLPolyDataMapperInitialValues {}

/**
 * The sphere mapper draws imposter quads that are raycast into spheres in the
 * fragment shader, so it replaces the shader and buffer object hooks of
 * vtkOpenGLPolyDataMapper.
 */
export interface vtkOpenGLSphereMapper extends vtkOpenGLPolyDataMapper {
  /**
   * The primitive mode the imposter geometry is drawn with, always triangles
   * whatever representation or primitive type is asked for.
   * @param rep the representation of the actor property
   * @param type the primitive type
   */
  getOpenGLMode(rep: number, type: number): number;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkOpenGLSphereMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IOpenGLSphereMapperInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IOpenGLSphereMapperInitialValues
): void;

/**
 * Method used to create a new instance of vtkOpenGLSphereMapper.
 * @param {IOpenGLSphereMapperInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IOpenGLSphereMapperInitialValues
): vtkOpenGLSphereMapper;

/**
 * The OpenGL backend view node for vtkSphereMapper.
 */
export declare const vtkOpenGLSphereMapper: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkOpenGLSphereMapper;
