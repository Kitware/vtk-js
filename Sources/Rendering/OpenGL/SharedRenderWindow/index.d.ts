import vtkOpenGLRenderWindow, {
  IOpenGLRenderWindowInitialValues,
} from '../RenderWindow';

export interface ISharedRenderWindowInitialValues
  extends IOpenGLRenderWindowInitialValues {
  autoClear?: boolean;
  autoClearColor?: boolean;
  autoClearDepth?: boolean;
}

export type SharedRenderCallback = () => void;

export interface ISharedRenderOptions {
  drawBuffers?: number[];
}

export interface vtkSharedRenderWindow extends vtkOpenGLRenderWindow {
  /** Reset vtk.js render state and render into a host-owned WebGL2 context. */
  renderShared(options?: ISharedRenderOptions): void;

  /** Reset vtk.js GL state and sync size before shared-context rendering. */
  prepareSharedRender(options?: ISharedRenderOptions): void;

  syncSizeFromCanvas(): boolean;

  setRenderCallback(callback?: SharedRenderCallback | null): void;

  setAutoClear(autoClear: boolean): boolean;
  getAutoClear(): boolean;

  setAutoClearColor(autoClearColor: boolean): boolean;
  getAutoClearColor(): boolean;

  setAutoClearDepth(autoClearDepth: boolean): boolean;
  getAutoClearDepth(): boolean;
}

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ISharedRenderWindowInitialValues
): void;

export function newInstance(
  initialValues?: ISharedRenderWindowInitialValues
): vtkSharedRenderWindow;

export function createFromContext(
  canvas: HTMLCanvasElement,
  gl: WebGL2RenderingContext,
  options?: ISharedRenderWindowInitialValues
): vtkSharedRenderWindow;

export declare const vtkSharedRenderWindow: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  createFromContext: typeof createFromContext;
};
export default vtkSharedRenderWindow;
