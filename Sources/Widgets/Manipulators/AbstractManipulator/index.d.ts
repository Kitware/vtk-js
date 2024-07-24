import { vtkObject } from '../../../interfaces';
import { vtkOpenGLRenderWindow } from '../../../Rendering/OpenGL/RenderWindow';
import { Matrix3x3, Nullable, Vector3 } from '../../../types';

/**
 *
 */
export interface IAbstractManipulatorInitialValues {
  userOrigin?: Vector3;
  handleOrigin?: Vector3;
  widgetOrigin?: Vector3;
  userNormal?: Vector3;
  handleNormal?: Vector3;
  widgetNormal?: Vector3;
}

export interface vtkAbstractManipulator extends vtkObject {
  /**
   * Get the normal of the line
   */
  getNormal(callData: any): Vector3;

  /**
   * Get the origin of the line
   */
  getOrigin(callData: any): Vector3;

  /**
   * Get the value of useCameraFocalPoint
   */
  getUseCameraFocalPoint(): boolean;

  /**
   * Set the value of useCameraFocalPoint
   * @param useCameraFocalPoint if true, the focal point of the camera will be used if userOrigin is not set.
   */
  setUseCameraFocalPoint(useCameraFocalPoint: boolean): boolean;

  /**
   * Get the value of useCameraNormal
   */
  getUseCameraNormal(): boolean;

  /**
   * Set the value of useCameraNormal
   * @param useCameraNormal if true, the normal of the camera will be used if userNormal is not set.
   */
  setUseCameraNormal(useCameraNormal: boolean): boolean;

  /**
   * Processes a vtkRenderWindowInteractor event into 3D world positional info.
   *
   * Returns an object containing:
   * - worldCoords: a 3D coordinate corresponding to the 2D event.
   * - worldDelta: a 3D position delta between the current and the previous call to handleEvent.
   * - worldDirection: a 3D directional vector. Only on select manipulators.
   *
   * worldCoords can be null if the pointer event enters an invalid manipulator region. For example,
   * the PickerManipulator returns null when the pointer event is off of the picked geometry.
   *
   * worldDelta only makes sense between two calls of `handleEvent`. In a queue of `handleEvent` calls,
   * the i-th call returns the delta between the i-th worldCoords and the (i-1)-th worldCoords.
   * Thus, calling `handleEvent` is necessary for maintaining a valid worldDelta even when the return
   * value is ignored.
   *
   * There are three cases where worldDelta needs to handle null events:
   * 1. the first call to `handleEvent`, since there is no previously cached event position.
   *    worldDelta is set to [0, 0, 0].
   * 2. if the current `handleEvent` call returns a null worldCoords. worldDelta is set to [0, 0, 0].
   * 3. if the previous `handleEvent` call returned a null worldCoords. In this case, worldDelta is the
   *     delta between the current worldCoords and the previous non-null worldCoords, referring to the
   *     previous 2 cases when applicable.
   *
   * @param callData
   * @param glRenderWindow
   */
  handleEvent(
    callData: any,
    glRenderWindow: vtkOpenGLRenderWindow
  ): {
    worldCoords: Nullable<Vector3>;
    worldDelta: Vector3;
    worldDirection?: Matrix3x3;
  };

  /* ------------------------------------------------------------------- */

  /**
   * Set the user normal.
   * This normal take precedence on the handleNormal and the widgetNormal.
   * This normal should not be set within the widget internal code.
   * @param {Vector3} normal The normal coordinate.
   */
  setUserNormal(normal: Vector3): boolean;

  /**
   * Set the user normal (see setUserNormal).
   * @param {Number} x The x coordinate.
   * @param {Number} y The y coordinate.
   * @param {Number} z The z coordinate.
   */
  setUserNormal(x: number, y: number, z: number): boolean;

  /**
   * Set the user normal (see setUserNormal).
   * @param {Vector3} normal The normal coordinate.
   */
  setUserNormalFrom(normal: Vector3): boolean;

  /**
   * Set the user origin.
   * This origin take precedence on the handleOrigin and the widgetOrigin.
   * This origin should not be set within the widget internal code.
   * @param {Vector3} origin The coordinate of the origin point.
   */
  setUserOrigin(origin: Vector3): boolean;

  /**
   * Set the user origin (see setUserOrigin).
   * @param {Number} x The x coordinate of the origin point.
   * @param {Number} y The y coordinate of the origin point.
   * @param {Number} z The z coordinate of the origin point.
   */
  setUserOrigin(x: number, y: number, z: number): boolean;

  /**
   * Set the user origin (see setUserOrigin).
   * @param {Vector3} origin The coordinate of the origin point.
   */
  setUserOriginFrom(origin: Vector3): boolean;

  /* ------------------------------------------------------------------- */

  /**
   * Set the handle normal.
   * This normal is used after the userNormal and before the widgetNormal.
   * This normal is automatically set by any state having a manipulatorMixin,
   * and can be overridden in the widget code.
   * @param {Vector3} normal The normal coordinate.
   */
  setHandleNormal(normal: Vector3): boolean;

  /**
   * Set the handle normal (see setHandleNormal).
   * @param {Number} x The x coordinate.
   * @param {Number} y The y coordinate.
   * @param {Number} z The z coordinate.
   */
  setHandleNormal(x: number, y: number, z: number): boolean;

  /**
   * Set the handle normal (see setHandleNormal).
   * @param {Vector3} normal The normal coordinate.
   */
  setHandleNormalFrom(normal: Vector3): boolean;

  /**
   * Set the handle origin.
   * This origin is used after the userOrigin and before the widgetOrigin.
   * This origin is automatically set by any state having a manipulatorMixin,
   * and can be overridden in the widget code.
   * @param {Vector3} origin The coordinate of the origin point.
   */
  setHandleOrigin(origin: Vector3): boolean;

  /**
   * Set the handle origin (see setHandleOrigin).
   * @param {Number} x The x coordinate of the origin point.
   * @param {Number} y The y coordinate of the origin point.
   * @param {Number} z The z coordinate of the origin point.
   */
  setHandleOrigin(x: number, y: number, z: number): boolean;

  /**
   * Set the handle origin (see setHandleOrigin).
   * @param {Vector3} origin The coordinate of the origin point.
   */
  setHandleOriginFrom(origin: Vector3): boolean;

  /* ------------------------------------------------------------------- */

  /**
   * Set the widget normal.
   * This normal is used if no other normals are set.
   * It can be used to define a normal global to the whole widget.
   * @param {Vector3} normal The normal coordinate.
   */
  setWidgetNormal(normal: Vector3): boolean;

  /**
   * Set the widget normal (see setWidgetNormal).
   * @param {Number} x The x coordinate.
   * @param {Number} y The y coordinate.
   * @param {Number} z The z coordinate.
   */
  setWidgetNormal(x: number, y: number, z: number): boolean;

  /**
   * Set the widget normal (see setWidgetNormal).
   * @param {Vector3} normal The normal coordinate.
   */
  setWidgetNormalFrom(normal: Vector3): boolean;

  /**
   * Set the widget origin.
   * This origin is used if no other origins are set.
   * It can be used to define an origin global to the whole widget.
   * @param {Vector3} origin The coordinate of the origin point.
   */
  setWidgetOrigin(origin: Vector3): boolean;

  /**
   * Set the widget origin (see setWidgetOrigin).
   * @param {Number} x The x coordinate of the origin point.
   * @param {Number} y The y coordinate of the origin point.
   * @param {Number} z The z coordinate of the origin point.
   */
  setWidgetOrigin(x: number, y: number, z: number): boolean;

  /**
   * Set the widget origin (see setWidgetOrigin).
   * @param {Vector3} origin The coordinate of the origin point.
   */
  setWidgetOriginFrom(origin: Vector3): boolean;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkAbstractManipulator characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IAbstractManipulatorInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IAbstractManipulatorInitialValues
): void;

/**
 * Method use to create a new instance of vtkAbstractManipulator
 */
export function newInstance(
  initialValues?: IAbstractManipulatorInitialValues
): vtkAbstractManipulator;

/**
 * vtkAbstractManipulator.
 */
export declare const vtkAbstractManipulator: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkAbstractManipulator;
