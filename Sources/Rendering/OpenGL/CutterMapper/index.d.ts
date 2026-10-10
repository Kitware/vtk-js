import { Nullable, Vector3 } from '../../../types';
import {
  IOpenGLPolyDataMapperInitialValues,
  vtkOpenGLPolyDataMapper,
} from '../PolyDataMapper';

/**
 * Initial values for creating a new instance of vtkOpenGLCutterMapper.
 */
export interface IOpenGLCutterMapperInitialValues extends IOpenGLPolyDataMapperInitialValues {
  tmpVec3A?: Nullable<Vector3>;
  tmpVec3B?: Nullable<Vector3>;
}

/**
 * The cutter mapper adds the cut plane clipping to the shaders of
 * vtkOpenGLPolyDataMapper. The public surface is unchanged.
 */
export interface vtkOpenGLCutterMapper extends vtkOpenGLPolyDataMapper {}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkOpenGLCutterMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IOpenGLCutterMapperInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IOpenGLCutterMapperInitialValues
): void;

/**
 * Method used to create a new instance of vtkOpenGLCutterMapper.
 * @param {IOpenGLCutterMapperInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IOpenGLCutterMapperInitialValues
): vtkOpenGLCutterMapper;

/**
 * The OpenGL backend view node for vtkCutterMapper.
 */
export declare const vtkOpenGLCutterMapper: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkOpenGLCutterMapper;
