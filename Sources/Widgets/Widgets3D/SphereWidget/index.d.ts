import vtkAbstractWidget from '../../Core/AbstractWidget';
import vtkAbstractManipulator from '../../Manipulators/AbstractManipulator';
import {
  IAbstractWidgetFactoryInitialValues,
  vtkAbstractWidgetFactory,
} from '../../Core/AbstractWidgetFactory';
import { ViewTypes } from '../../Core/WidgetManager/Constants';
import { Vector3 } from '../../../types';
import { vtkWidgetState } from '../../Core/WidgetState';
import { vtkBoundsMixinState } from '../../Core/StateBuilder/boundsMixin';
import { vtkColorMixinState } from '../../Core/StateBuilder/colorMixin';
import { vtkManipulatorMixinState } from '../../Core/StateBuilder/manipulatorMixin';
import { vtkOrientationMixinState } from '../../Core/StateBuilder/orientationMixin';
import { vtkOriginMixinState } from '../../Core/StateBuilder/originMixin';
import { vtkScale1MixinState } from '../../Core/StateBuilder/scale1Mixin';
import { vtkVisibleMixinState } from '../../Core/StateBuilder/visibleMixin';

export type ISphereWidgetHandleState = vtkOriginMixinState &
  vtkColorMixinState &
  vtkScale1MixinState &
  vtkVisibleMixinState &
  vtkManipulatorMixinState;

// The internal state of the widget.
export interface vtkSphereWidgetState
  extends vtkWidgetState, vtkBoundsMixinState {
  // The handle used only for during initial placement.
  getMoveHandle(): ISphereWidgetHandleState;
  // A handle that defines the center of the sphere.
  getCenterHandle(): ISphereWidgetHandleState;
  // An arbitrary point at the sphere border. Used only to set the radius.
  getBorderHandle(): ISphereWidgetHandleState;
  // The handle used for displaying the sphere.
  getSphereHandle(): vtkOriginMixinState &
    vtkColorMixinState &
    vtkScale1MixinState &
    vtkVisibleMixinState &
    vtkOrientationMixinState;
}

// The type of object returned by vtkWidgetManager.addWidget()
export interface vtkSphereWidgetHandle extends vtkAbstractWidget {
  // Set the sphere parameters.
  setCenterAndRadius(center: Vector3, radius: number): void;
}

export interface vtkSphereWidget extends vtkAbstractWidgetFactory<vtkSphereWidgetHandle> {
  getWidgetState(): vtkSphereWidgetState;
  setWidgetState(widgetState: vtkSphereWidgetState): boolean;

  /**
   * The representation builders the widget uses in the given view type.
   */
  getRepresentationsForViewType(viewType: ViewTypes): unknown;

  /**
   * The manipulator the widget handles are driven by.
   */
  getManipulator(): vtkAbstractManipulator | undefined;

  /**
   * Set the manipulator on the widget and on each of its handles.
   */
  setManipulator(manipulator: vtkAbstractManipulator): void;

  // Methods specific to vtkSphereWidget.
  getRadius(): number;
}

export interface ISphereWidgetInitialValues extends IAbstractWidgetFactoryInitialValues<vtkSphereWidgetHandle> {}

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ISphereWidgetInitialValues
): void;

export function newInstance(
  props?: ISphereWidgetInitialValues
): vtkSphereWidget;

export const vtkSphereWidget: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkSphereWidget;
