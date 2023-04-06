import { Vector2, Vector3 } from '../../../types';
import vtkRenderer from '../../../Rendering/Core/Renderer';
import vtkImageProperty from '../../../Rendering/Core/ImageProperty';
import vtkInteractorStyleTrackballCamera from '../../../Interaction/Style/InteractorStyleTrackballCamera';

export interface vtkInteractorStyleImage extends vtkInteractorStyleTrackballCamera {
  /**
   * Handles a mouse move.
   * @param callData event data
   */
  handleMouseMove(callData: unknown): void;

  /**
   * Handles a left button press event.
   * @param callData event data
   */
  handleLeftButtonPress(callData: unknown): void;

  /**
   * Handles a left button release event.
   * @param callData event data
   */
  handleLeftButtonRelease(callData: unknown): void;

  /**
   * Handles the start of a wheel event.
   * @param callData event data
   */
  handleStartMouseWheel(callData: unknown): void;

  /**
   * Handles the end of a wheel event.
   * @param callData event data
   */
  handleEndMouseWheel(callData: unknown): void;

  /**
   * Handles a wheel event.
   * @param callData event data
   */
  handleMouseWheel(callData: unknown): void;

  /**
   * Set window level from position.
   * @param renderer the renderer
   * @param position the display position
   */
  windowLevel(renderer: vtkRenderer, position: { x: number, y: number }): void;

  /**
   * Set slice from position.
   * @param renderer the renderer
   * @param position the display position
   */
  slice(renderer: vtkRenderer, position: { x: number, y: number }): void;

  /**
   * Sets the current image property.
   * 
   * This is a way of dealing with images as if they were layers.
   * It looks through the renderer's list of props and sets the
   * interactor ivars from the Nth image that it finds.  You can
   * also use negative numbers, i.e. -1 will return the last image,
   * -2 will return the second-to-last image, etc.
   * @param i image number
   */
  setCurrentImageNumber(i: number): boolean;

  /**
   * Sets the current image property.
   * @param imageProperty image property
   */
  setCurrentImageProperty(imageProperty: vtkImageProperty): boolean;
}

export interface IInteractorStyleImageInitialValues {
  windowLevelStartPosition: Vector2;
  windowLevelCurrentPosition: Vector2;
  lastSlicePosition: number;
  windowLevelInitial: Vector2;
  // currentImageProperty: null;
  currentImageNumber: number;
  interactionMode: 'IMAGE2D' | 'IMAGE3D' | 'IMAGE_SLICING';
  xViewRightVector: Vector3;
  xViewUpVector: Vector3;
  yViewRightVector: Vector3;
  yViewUpVector: Vector3;
  zViewRightVector: Vector3;
  zViewUpVector: Vector3;
}

export function newInstance(
  initialValues?: IInteractorStyleImageInitialValues
): vtkInteractorStyleImage;

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IInteractorStyleImageInitialValues
): void;

export const vtkInteractorStyleImage: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkInteractorStyleImage;
