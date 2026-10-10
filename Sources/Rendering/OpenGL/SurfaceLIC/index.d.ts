import type { IViewNodeInitialValues } from '../../SceneGraph/ViewNode';

/**
 * The factory shape shared by the two surface-LIC scene graph classes. Neither
 * of them has a declaration of its own yet, so their instances are untyped.
 */
export interface ISurfaceLICFactory {
  newInstance(initialValues?: IViewNodeInitialValues): any;
  extend(
    publicAPI: object,
    model: object,
    initialValues?: IViewNodeInitialValues
  ): void;
}

/**
 * Barrel of the OpenGL surface line-integral-convolution classes. Importing it
 * pulls in the mapper submodule, whose `registerOverride` call makes the OpenGL
 * view node factory build it for a `vtkSurfaceLICMapper` renderable.
 */
declare const vtkOpenGLSurfaceLIC: {
  vtkOpenGLSurfaceLICMapper: ISurfaceLICFactory;
  vtkOpenGLSurfaceLICInterface: ISurfaceLICFactory;
};
export default vtkOpenGLSurfaceLIC;
