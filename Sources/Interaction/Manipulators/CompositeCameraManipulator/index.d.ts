import vtkInteractorObserver from '../../../Rendering/Core/InteractorObserver';
import vtkRenderer from '../../../Rendering/Core/Renderer';
import { Vector2, Vector3 } from '../../../types';

export interface vtkCompositeCameraManipulator {
  /**
   * Computes the display center.
   * @param observer
   * @param renderer
   */
  computeDisplayCenter(
    observer: vtkInteractorObserver,
    renderer: vtkRenderer
  ): void;

  /**
   * Sets the rotation factor.
   * @param factor
   */
  setRotationFactor(factor: number): boolean;

  /**
   * Gets the rotation factor.
   */
  getRotationFactor(): number;

  /**
   * Sets the display center.
   * @param center
   */
  setDisplayCenter(center: Vector2): boolean;
  setDisplayCenter(x: number, y: number): boolean;

  /**
   * Gets the display center.
   */
  getDisplayCenter(): Vector2;

  /**
   * Sets the center.
   * @param center
   */
  setCenter(center: Vector3): boolean;
  setCenter(x: number, y: number, z: number): boolean;

  /**
   * Gets the center.
   */
  getCenter(): Vector3;
}

export interface ICompositeCameraManipulatorInitialValues {
  center?: Vector3;
  rotationFactor?: number;
  displayCenter?: Vector2;
}

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ICompositeCameraManipulatorInitialValues
): void;

export const vtkCompositeCameraManipulator: {
  extend: typeof extend;
};

export default vtkCompositeCameraManipulator;
