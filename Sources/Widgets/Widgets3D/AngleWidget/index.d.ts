import vtkAbstractWidget from '../../Core/AbstractWidget';
import vtkAbstractManipulator from '../../Manipulators/AbstractManipulator';
import {
  IAbstractWidgetFactoryInitialValues,
  vtkAbstractWidgetFactory,
} from '../../Core/AbstractWidgetFactory';
import { ViewTypes } from '../../Core/WidgetManager/Constants';
import { vtkWidgetState } from '../../Core/WidgetState';
import { vtkBoundsMixinState } from '../../Core/StateBuilder/boundsMixin';
import { vtkColorMixinState } from '../../Core/StateBuilder/colorMixin';
import { vtkManipulatorMixinState } from '../../Core/StateBuilder/manipulatorMixin';
import { vtkOriginMixinState } from '../../Core/StateBuilder/originMixin';
import { vtkScale1MixinState } from '../../Core/StateBuilder/scale1Mixin';
import { vtkVisibleMixinState } from '../../Core/StateBuilder/visibleMixin';

export type IAngleWidgetHandleState = vtkOriginMixinState &
  vtkColorMixinState &
  vtkScale1MixinState &
  vtkVisibleMixinState &
  vtkManipulatorMixinState;

// The internal state of the widget.
export interface vtkAngleWidgetState
  extends vtkWidgetState, vtkBoundsMixinState {
  // The handle used only during initial placement.
  getMoveHandle(): IAngleWidgetHandleState;

  // The three placed handles, in placement order.
  getHandleList(): IAngleWidgetHandleState[];
  addHandle(initialValues?: object): IAngleWidgetHandleState;
  removeHandle(handleOrIndex: IAngleWidgetHandleState | number): void;
  clearHandleList(): void;
}

// The type of object returned by vtkWidgetManager.addWidget().
export interface vtkAngleWidgetHandle extends vtkAbstractWidget {
  setDisplayCallback(callback: (coords: any) => void): void;
}

export interface vtkAngleWidget extends vtkAbstractWidgetFactory<vtkAngleWidgetHandle> {
  getWidgetState(): vtkAngleWidgetState;

  /**
   * The representation builders the widget uses in the given view type.
   */
  getRepresentationsForViewType(viewType: ViewTypes): unknown;

  /**
   * The manipulator the handles are driven by.
   */
  getManipulator(): vtkAbstractManipulator | undefined;

  /**
   * Set the manipulator on the widget and on each of its handles.
   */
  setManipulator(manipulator: vtkAbstractManipulator): boolean;

  /**
   * The angle formed by the three placed handles, in radians. Returns 0 until
   * the three handles are placed.
   */
  getAngle(): number;
}

export interface IAngleWidgetInitialValues extends IAbstractWidgetFactoryInitialValues<vtkAngleWidgetHandle> {
  manipulator?: vtkAbstractManipulator;
}

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IAngleWidgetInitialValues
): void;

export function newInstance(props?: IAngleWidgetInitialValues): vtkAngleWidget;

/**
 * vtkAngleWidget places three handles and measures the angle they form at the
 * second one.
 */
export declare const vtkAngleWidget: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkAngleWidget;
