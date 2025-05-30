import { vtkObject } from '../../../interfaces';
import { Vector3 } from '../../../types';
import vtkProp3D from '../Prop3D';
import vtkRenderer from '../Renderer';

/**
 *
 */
export interface IAbstractPickerInitialValues {
  renderer?: vtkRenderer;
  selectionPoint?: Vector3;
  pickPosition?: Vector3;
  pickFromList?: boolean;
  pickList?: vtkProp3D[];
}

/**
 *
 */
export interface vtkAbstractPicker extends vtkObject {
  /**
   *
   * @param {vtkProp3D} prop
   */
  addPickList(prop: vtkProp3D): void;

  /**
   *
   * @param {vtkProp3D} prop
   */
  deletePickList(prop: vtkProp3D): void;

  /**
   *
   */
  getPickFromList(): boolean;

  /**
   *
   */
  getPickList(): vtkProp3D[];

  /**
   * Get the picked position
   * @default [0.0, 0.0, 0.0]
   */
  getPickPosition(): Vector3;

  /**
   *
   * Get the picked position
   * @default [0.0, 0.0, 0.0]
   */
  getPickPositionByReference(): Vector3;

  /**
   *
   */
  getRenderer(): vtkRenderer;

  /**
   *
   * @default [0.0, 0.0, 0.0]
   */
  getSelectionPoint(): Vector3;

  /**
   *
   * @default [0.0, 0.0, 0.0]
   */
  getSelectionPointByReference(): Vector3;

  /**
   *
   */
  initialize(): void;

  /**
   * Set pickList to empty array.
   */
  initializePickList(): void;

  /**
   *
   * @param {Boolean}  pickFromList
   * @default false
   */
  setPickFromList(pickFromList: boolean): boolean;

  /**
   *
   * @param {vtkProp3D[]} pickList
   * @default []
   */
  setPickList(pickList: vtkProp3D[]): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkAbstractPicker characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IAbstractPickerInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: IAbstractPickerInitialValues,
  model: object,
  initialValues?: object
): void;

/**
 * vtkAbstractPicker is an abstract superclass that defines a minimal API for its concrete subclasses.
 * The minimum functionality of a picker is to return the x-y-z global coordinate position of a pick (the pick itself is defined in display coordinates).
 *
 * The API to this class is to invoke the Pick() method with a selection point (in display coordinates - pixels)
 * and a renderer. Then get the resulting pick position in global coordinates with the GetPickPosition() method.
 * @see [vtkPointPicker](./Rendering_Core_PointPicker.html)
 */
export declare const vtkAbstractPicker: {
  extend: typeof extend;
};
export default vtkAbstractPicker;
