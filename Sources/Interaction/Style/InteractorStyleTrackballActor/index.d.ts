import vtkInteractorStyle from '../../../Rendering/Core/InteractorStyle';
import vtkCellPicker from '../../../Rendering/Core/CellPicker';
import vtkProp3D from '../../../Rendering/Core/Prop3D';
import vtkRenderer from '../../../Rendering/Core/Renderer';
import { Nullable } from '../../../types';
import { IRenderWindowInteractorEvent } from '../../../Rendering/Core/RenderWindowInteractor';

export interface IInteractorStyleTrackballActorInitialValues {
  motionFactor?: number;
  interactionProp?: Nullable<vtkProp3D>;
  interactionPicker?: Nullable<vtkCellPicker>;
}

export interface vtkInteractorStyleTrackballActor extends vtkInteractorStyle {
  /**
   * Find the picked actor and pick position.
   * @param {vtkRenderer} renderer
   * @param position
   */
  findPickedActor(
    renderer: vtkRenderer,
    position: { x: number; y: number }
  ): void;

  /**
   * Handle mouse move event.
   * @param {IRenderWindowInteractorEvent} callData
   */
  handleMouseMove(callData: IRenderWindowInteractorEvent): void;

  /**
   * Handle left mouse button press event.
   * @param {IRenderWindowInteractorEvent} callData
   */
  handleLeftButtonPress(callData: IRenderWindowInteractorEvent): void;

  /**
   * Handle left mouse button release event.
   * @param {IRenderWindowInteractorEvent} callData
   */
  handleLeftButtonRelease(callData: IRenderWindowInteractorEvent): void;

  /**
   * Handle middle mouse button press event.
   * @param {IRenderWindowInteractorEvent} callData
   */
  handleMiddleButtonPress(callData: IRenderWindowInteractorEvent): void;

  /**
   * Handle middle mouse button release event.
   * @param {IRenderWindowInteractorEvent} callData
   */
  handleMiddleButtonRelease(callData: IRenderWindowInteractorEvent): void;

  /**
   * Handle right mouse button press event.
   * @param {IRenderWindowInteractorEvent} callData
   */
  handleRightButtonPress(callData: IRenderWindowInteractorEvent): void;

  /**
   * Handle right mouse button release event.
   * @param {IRenderWindowInteractorEvent} callData
   */
  handleRightButtonRelease(callData: IRenderWindowInteractorEvent): void;

  /**
   * Handle mouse rotate event.
   * @param {vtkRenderer} renderer
   * @param position
   */
  handleMouseRotate(
    renderer: vtkRenderer,
    position: { x: number; y: number }
  ): void;

  /**
   * Handle mouse spin event.
   * @param {vtkRenderer} renderer
   * @param position
   */
  handleMouseSpin(
    renderer: vtkRenderer,
    position: { x: number; y: number }
  ): void;

  /**
   * Handle mouse pan event.
   * @param {vtkRenderer} renderer
   * @param position
   */
  handleMousePan(
    renderer: vtkRenderer,
    position: { x: number; y: number }
  ): void;

  /**
   * Handle mouse dolly event.
   * @param {vtkRenderer} renderer
   * @param position
   */
  handleMouseDolly(
    renderer: vtkRenderer,
    position: { x: number; y: number }
  ): void;

  /**
   * Handle mouse uniform scale event.
   * @param {vtkRenderer} renderer
   * @param position
   */
  handleMouseUniformScale(
    renderer: vtkRenderer,
    position: { x: number; y: number }
  ): void;

  /**
   * Start uniform scale interaction.
   */
  startUniformScale(): void;

  /**
   * End uniform scale interaction.
   */
  endUniformScale(): void;

  /**
   * Get the interaction picker.
   */
  getInteractionPicker(): Nullable<vtkCellPicker>;

  /**
   * Get the interaction prop.
   */
  getInteractionProp(): Nullable<vtkProp3D>;

  /**
   * Set the interaction prop.
   * @param {vtkProp3D | null} prop
   */
  setInteractionProp(prop: Nullable<vtkProp3D>): boolean;

  /**
   * Get the motion factor.
   */
  getMotionFactor(): number;

  /**
   * Set the motion factor.
   * @param {Number} factor
   */
  setMotionFactor(factor: number): boolean;
}

export function newInstance(
  initialValues?: IInteractorStyleTrackballActorInitialValues
): vtkInteractorStyleTrackballActor;

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IInteractorStyleTrackballActorInitialValues
): void;

/**
 * vtkInteractorStyleTrackballActor allows the user to interact with (rotate, pan, etc.) objects in the scene independent of each other.
 * In trackball interaction, the magnitude of the mouse motion is proportional to the actor motion associated with a particular mouse binding.
 * For example, small left-button motions cause small changes in the rotation of the actor around its center point.
 */
export const vtkInteractorStyleTrackballActor: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkInteractorStyleTrackballActor;
