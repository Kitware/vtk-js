import {
  IOpenGLPolyDataMapperInitialValues,
  vtkOpenGLPolyDataMapper,
} from '../PolyDataMapper';

/**
 * Initial values for creating a new instance of vtkOpenGLGlyph3DMapper.
 */
export interface IOpenGLGlyph3DMapperInitialValues extends IOpenGLPolyDataMapperInitialValues {}

/**
 * The glyph mapper renders the source polydata once per glyph point, so it
 * replaces the buffer object and shader hooks of vtkOpenGLPolyDataMapper with
 * instanced equivalents. The public surface is unchanged.
 */
export interface vtkOpenGLGlyph3DMapper extends vtkOpenGLPolyDataMapper {}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkOpenGLGlyph3DMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IOpenGLGlyph3DMapperInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IOpenGLGlyph3DMapperInitialValues
): void;

/**
 * Method used to create a new instance of vtkOpenGLGlyph3DMapper.
 * @param {IOpenGLGlyph3DMapperInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IOpenGLGlyph3DMapperInitialValues
): vtkOpenGLGlyph3DMapper;

/**
 * The OpenGL backend view node for vtkGlyph3DMapper.
 */
export declare const vtkOpenGLGlyph3DMapper: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkOpenGLGlyph3DMapper;
