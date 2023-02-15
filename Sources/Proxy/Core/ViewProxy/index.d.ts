import vtkActor from '../../../Rendering/Core/Actor';
import vtkAbstractRepresentationProxy from '../AbstractRepresentationProxy';
import { Vector3, Vector4 } from '../../../types';
import vtkCamera from '../../../Rendering/Core/Camera';
import vtkRenderWindowInteractor from '../../../Rendering/Core/RenderWindowInteractor';
import vtkInteractorStyle from '../../../Rendering/Core/InteractorStyle';
import { vtkSubscription, vtkObject } from '../../../interfaces';
import vtkRenderer from '../../../Rendering/Core/Renderer';
import vtkRenderWindow from '../../../Rendering/Core/RenderWindow';
import vtkOpenGLRenderWindow from '../../../Rendering/OpenGL/RenderWindow';
import { VtkProxy } from '../../../macros';

export interface vtkViewProxy extends VtkProxy {
  setPresetToInteractor3D(nameOrDefinitions: string | Object): boolean;
  setPresetToInteractor2D(nameOrDefinitions: string | Object): boolean;

  setOrientationAxesType(type: string): void;
  setOrientationAxesVisibility(visible: boolean): boolean;
  registerOrientationAxis(name: string, actor: vtkActor): void;
  unregisterOrientationAxis(name: string): void;
  listOrientationAxis(): string[];
  setPresetToOrientationAxes(nameOrDefinitions: string | Object): boolean;

  setContainer(container: HTMLElement | null): void;
  resize(): void;
  renderLater(): void;
  render(blocking?: boolean): void;
  resetCamera(): void;

  addRepresentation(representation: vtkAbstractRepresentationProxy): void;
  removeRepresentation(representation: vtkAbstractRepresentationProxy): void;

  // TODO correct?
  captureImage(opts: { format: string } & Object): Array<Promise<string>>;
  openCaptureImage(target: string): void;

  // TODO corner annotations

  setBackground(color: Vector3 | Vector4): void;
  getBackground(): Vector3 | Vector4;

  setAnimation(enable: boolean, requester?: vtkObject);

  updateOrientation(
    axisIndex: 0 | 1 | 2,
    orientation: -1 | 1,
    viewUp: Vector3,
    animateSteps: number
  ): Promise<void>;
  moveCamera(
    focalPoint: Vector3,
    position: Vector3,
    viewUp: Vector3,
    animateSteps: number
  ): Promise<void>;

  resetOrientation(animateSteps: number): void;
  rotate(angle): void;

  focusTo(focalPoint: Vector3): void;

  getCamera(): vtkCamera;
  // getAnnotationOpacity
  getContainer(): HTMLElement | null;
  // getCornerAnnotation
  getInteractor(): vtkRenderWindowInteractor;
  getInteractorStyle2D(): vtkInteractorStyle;
  getInteractorStyle3D(): vtkInteractorStyle;
  getOpenGLRenderWindow(): vtkOpenGLRenderWindow;
  getOrientationAxesType(): string;
  getPresetToOrientationAxes(): any;
  getRenderer(): vtkRenderer;
  getRenderWindow(): vtkRenderWindow;
  getRepresentations(): vtkAbstractRepresentationProxy[];
  getUseParallelRendering(): boolean;
  getDisableAnimation(): boolean;
  setDisableAnimation(disabled: boolean): boolean;

  onResize(
    cb: (size: { width: number; height: number }) => void
  ): vtkSubscription;

  // TODO proxy property mappings
}

export default vtkViewProxy;
