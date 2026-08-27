import { vtkActor } from '../../../Rendering/Core/Actor';
import { vtkAbstractRepresentationProxy } from '../AbstractRepresentationProxy';
import { Vector3, Vector4 } from '../../../types';
import { vtkCamera } from '../../../Rendering/Core/Camera';
import { vtkRenderWindowInteractor } from '../../../Rendering/Core/RenderWindowInteractor';
import { vtkInteractorStyle } from '../../../Rendering/Core/InteractorStyle';
import { vtkSubscription, vtkObject } from '../../../interfaces';
import { vtkRenderer } from '../../../Rendering/Core/Renderer';
import { vtkRenderWindow } from '../../../Rendering/Core/RenderWindow';
import { vtkOpenGLRenderWindow } from '../../../Rendering/OpenGL/RenderWindow';
import { vtkWebGPURenderWindow } from '../../../Rendering/WebGPU/RenderWindow';
import { VtkProxy } from '../../../macros';

export interface vtkViewProxy extends VtkProxy {
  setPresetToInteractor3D(nameOrDefinitions: string | object): boolean;
  setPresetToInteractor2D(nameOrDefinitions: string | object): boolean;

  setOrientationAxesType(type: string): void;
  setOrientationAxesVisibility(visible: boolean): boolean;
  registerOrientationAxis(name: string, actor: vtkActor): void;
  unregisterOrientationAxis(name: string): void;
  listOrientationAxis(): string[];
  setPresetToOrientationAxes(nameOrDefinitions: string | object): boolean;

  setContainer(container: HTMLElement | null): void;
  resize(): void;
  renderLater(): void;
  render(blocking?: boolean): void;
  resetCamera(): void;

  addRepresentation(representation: vtkAbstractRepresentationProxy): void;
  removeRepresentation(representation: vtkAbstractRepresentationProxy): void;

  captureImage(opts?: { format?: string } & object): Promise<string>;
  openCaptureImage(target?: string): Promise<void>;

  // TODO corner annotations

  setBackground(color: Vector3 | Vector4): boolean;
  getBackground(): Vector3 | Vector4;

  setAnimation(enable: boolean, requester?: vtkObject);

  updateOrientation(
    axisIndex: 0 | 1 | 2,
    orientation: -1 | 1,
    viewUp: Vector3,
    animateSteps?: number
  ): Promise<void>;
  moveCamera(
    focalPoint: Vector3,
    position: Vector3,
    viewUp: Vector3,
    animateSteps?: number
  ): Promise<void>;

  resetOrientation(animateSteps?: number): void;
  rotate(angle): void;

  focusTo(focalPoint: Vector3): void;

  getCamera(): vtkCamera;
  getAnnotationOpacity(): number;
  getContainer(): HTMLElement | null | undefined;
  // getCornerAnnotation
  getInteractor(): vtkRenderWindowInteractor;
  getInteractorStyle2D(): vtkInteractorStyle;
  getInteractorStyle3D(): vtkInteractorStyle;
  getApiSpecificRenderWindow(): vtkOpenGLRenderWindow | vtkWebGPURenderWindow;
  getOrientationAxesType(): string;
  getPresetToOrientationAxes(): string;
  getRenderer(): vtkRenderer;
  getRenderWindow(): vtkRenderWindow;
  getRepresentations(): vtkAbstractRepresentationProxy[];
  getUseParallelRendering(): boolean;
  getDisableAnimation(): boolean;
  setDisableAnimation(disabled: boolean): boolean;
  getResetCameraOnFirstRender(): boolean;

  onResize(
    cb: (size: { width: number; height: number }) => void
  ): vtkSubscription;
  invokeResize(size: { width: number; height: number }): void;

  // TODO proxy property mappings
}

export interface IViewProxyInitialValues {
  annotationOpacity?: number;
  disableAnimation?: boolean;
  orientationAxesType?: string;
  presetToOrientationAxes?: any;
  resetCameraOnFirstRender?: boolean;
}

export function newInstance(
  initialValues?: IViewProxyInitialValues
): vtkViewProxy;

declare const vtkViewProxy: {
  newInstance: typeof newInstance;
  extend: (
    publicAPI: object,
    model: object,
    initialValues?: IViewProxyInitialValues
  ) => void;
};

export default vtkViewProxy;
