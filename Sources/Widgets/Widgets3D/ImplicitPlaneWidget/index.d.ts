import vtkAbstractWidget from '../../Core/AbstractWidget';
import {
  IAbstractWidgetFactoryInitialValues,
  vtkAbstractWidgetFactory,
} from '../../Core/AbstractWidgetFactory';
import { ViewTypes } from '../../Core/WidgetManager/Constants';
import { Nullable, Vector3 } from '../../../types';
import { vtkProp } from '../../../Rendering/Core/Prop';
import { vtkWidgetState } from '../../Core/WidgetState';
import { vtkBoundsMixinState } from '../../Core/StateBuilder/boundsMixin';

/**
 * The name of the interaction method the active handle dispatches to.
 */
export type ImplicitPlaneWidgetUpdateMethod =
  | 'updateFromOrigin'
  | 'updateFromPlane'
  | 'updateFromNormal';

// The internal state of the widget, built by
// vtkImplicitPlaneRepresentation.generateState().
export interface vtkImplicitPlaneWidgetState
  extends vtkWidgetState, vtkBoundsMixinState {
  getOrigin(): Vector3;
  getOriginByReference(): Vector3;
  setOrigin(origin: Vector3): boolean;
  setOrigin(x: number, y: number, z: number): boolean;
  setOriginFrom(origin: Vector3): void;

  getNormal(): Vector3;
  getNormalByReference(): Vector3;
  setNormal(normal: Vector3): boolean;
  setNormal(x: number, y: number, z: number): boolean;
  setNormalFrom(normal: Vector3): void;

  /**
   * The actor of the representation pipeline that is currently picked.
   */
  getActiveHandle(): Nullable<vtkProp>;
  setActiveHandle(activeHandle: Nullable<vtkProp>): boolean;

  getUpdateMethodName(): ImplicitPlaneWidgetUpdateMethod;
  setUpdateMethodName(
    updateMethodName: ImplicitPlaneWidgetUpdateMethod
  ): boolean;
}

// The type of object returned by vtkWidgetManager.addWidget().
export interface vtkImplicitPlaneWidgetHandle extends vtkAbstractWidget {
  setDisplayCallback(callback: (coords: any) => void): void;

  /**
   * Set the view cursor to the one matching the currently active handle.
   */
  updateCursor(): void;

  /**
   * Drag the plane origin inside the plane.
   */
  updateFromOrigin(callData: any): void;

  /**
   * Drag the plane along its normal.
   */
  updateFromPlane(callData: any): void;

  /**
   * Rotate the plane normal with a trackball manipulator.
   */
  updateFromNormal(callData: any): void;
}

export interface vtkImplicitPlaneWidget extends vtkAbstractWidgetFactory<vtkImplicitPlaneWidgetHandle> {
  getWidgetState(): vtkImplicitPlaneWidgetState;

  /**
   * The representation builders the widget uses in the given view type.
   */
  getRepresentationsForViewType(viewType: ViewTypes): unknown;
}

export interface IImplicitPlaneWidgetInitialValues extends IAbstractWidgetFactoryInitialValues<vtkImplicitPlaneWidgetHandle> {}

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IImplicitPlaneWidgetInitialValues
): void;

export function newInstance(
  props?: IImplicitPlaneWidgetInitialValues
): vtkImplicitPlaneWidget;

/**
 * vtkImplicitPlaneWidget manipulates an infinite plane: its origin can be
 * dragged inside the plane or along the normal, and the normal can be rotated.
 */
export declare const vtkImplicitPlaneWidget: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkImplicitPlaneWidget;
