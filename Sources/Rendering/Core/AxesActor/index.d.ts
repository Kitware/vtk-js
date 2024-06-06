import vtkActor, { IActorInitialValues } from '../Actor';
import { RGBColor } from '../../../types';

/**
 * Represents the initial values for the AxesActor.
 */
export interface IAxesActorInitialValues extends IActorInitialValues {}

/**
 * Represents an actor that displays axes in a 3D scene.
 */
export interface vtkAxesActor extends vtkActor {
  /**
   * Get config object of the actor.
   */
  getConfig(): object;

  /**
   * Get config object of the X axis.
   */
  getXConfig(): object;

  /**
   * Get config object of the Y axis.
   */
  getYConfig(): object;

  /**
   * Get config object of the Z axis.
   */
  getZConfig(): object;

  /**
   * Retrieves the color of the X-axis.
   *
   * @return {RGBColor} The color of the X-axis.
   */
  getXAxisColor(): RGBColor;

  /**
   * Retrieves the color of the Y-axis.
   *
   * @return {RGBColor} The color of the Y-axis.
   */
  getYAxisColor(): RGBColor;

  /**
   * Retrieves the color of the Z-axis.
   *
   * @return {RGBColor} The color of the Z-axis.
   */
  getZAxisColor(): RGBColor;

  /**
   * Set config object of the actor.
   * @param config
   */
  setConfig(config: object): boolean;

  /**
   * Set config object of the X axis.
   * @param config
   */
  setXConfig(config: object): boolean;

  /**
   * Set config object of the Y axis.
   * @param config
   */
  setYConfig(config: object): boolean;

  /**
   * Set config object of the Z axis.
   * @param config
   */
  setZConfig(config: object): boolean;

  /**
   * Set X axis color.
   * @param {RGBColor} rgb An Array of the RGB color.
   */
  setXAxisColor(rgb: RGBColor): boolean;

  /**
   * Set Y axis color.
   * @param {RGBColor} rgb An Array of the RGB color.
   */
  setYAxisColor(rgb: RGBColor): boolean;

  /**
   * Set Z axis color.
   * @param {RGBColor} rgb An Array of the RGB color.
   */
  setZAxisColor(rgb: RGBColor): boolean;

  /**
   * Update the actor.
   */
  update(): void;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkAxesActor characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IAxesActorInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IAxesActorInitialValues
): void;

/**
 * Method use to create a new instance of vtkAxesActor.
 * @param {IAxesActorInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IAxesActorInitialValues
): vtkAxesActor;

/**
 * vtkAxesActor is a hybrid 2D/3D actor used to represent 3D axes in a scene.
 * The user can define the geometry to use for the shaft or the tip,
 * and the user can set the text for the three axes. The text will appear
 * to follow the camera since it is implemented by means of vtkCaptionActor2D.
 * All of the functionality of the underlying vtkCaptionActor2D objects are accessible so that,
 * for instance, the font attributes of the axes text can be manipulated through vtkTextProperty.
 * Since this class inherits from vtkProp3D, one can apply a user transform to the underlying
 * geometry and the positioning of the labels. For example, a rotation transform could be used to
 * generate a left-handed axes representation.
 * @see [vtkAnnotatedCubeActor](./Rendering_Core_AnnotatedCubeActor.html)
 * @see [vtkOrientationMarkerWidget](./Interaction_Widgets_OrientationMarkerWidget.html)
 */
export declare const vtkAxesActor: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkAxesActor;
