import { Nullable } from '../../../types';
import vtkMapper, { IMapperInitialValues } from '../Mapper';
import vtkSurfaceLICInterface from '../SurfaceLICInterface';

export interface ISurfaceLICMapperInitialValues extends IMapperInitialValues {
  licInterface?: Nullable<vtkSurfaceLICInterface>;
}

export interface vtkSurfaceLICMapper extends vtkMapper {
  /**
   * Get the LIC parameter holder, creating it on first access.
   */
  getLicInterface(): vtkSurfaceLICInterface;

  setLicInterface(licInterface: vtkSurfaceLICInterface): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with
 * vtkSurfaceLICMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ISurfaceLICMapperInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ISurfaceLICMapperInitialValues
): void;

/**
 * Method used to create a new instance of vtkSurfaceLICMapper.
 * @param {ISurfaceLICMapperInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: ISurfaceLICMapperInitialValues
): vtkSurfaceLICMapper;

/**
 * vtkSurfaceLICMapper is a vtkMapper that carries a vtkSurfaceLICInterface,
 * holding the Line Integral Convolution parameters used by the API specific
 * mapper implementations.
 * @see [vtkSurfaceLICInterface](./Rendering_Core_SurfaceLICInterface.html)
 */
export declare const vtkSurfaceLICMapper: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkSurfaceLICMapper;
