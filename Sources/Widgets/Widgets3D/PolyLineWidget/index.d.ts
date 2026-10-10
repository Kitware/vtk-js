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

export type IPolyLineWidgetHandleState = vtkOriginMixinState &
  vtkColorMixinState &
  vtkScale1MixinState &
  vtkVisibleMixinState &
  vtkManipulatorMixinState;

// The internal state of the widget.
export interface vtkPolyLineWidgetState
  extends vtkWidgetState, vtkBoundsMixinState {
  // The handle used only during initial placement.
  getMoveHandle(): IPolyLineWidgetHandleState;

  // The placed handles, in placement order.
  getHandleList(): IPolyLineWidgetHandleState[];
  addHandle(initialValues?: object): IPolyLineWidgetHandleState;
  removeHandle(handleOrIndex: IPolyLineWidgetHandleState | number): void;
  clearHandleList(): void;
}

// The type of object returned by vtkWidgetManager.addWidget().
export interface vtkPolyLineWidgetHandle extends vtkAbstractWidget {
  setDisplayCallback(callback: (coords: any) => void): void;
}

export interface vtkPolyLineWidget extends vtkAbstractWidgetFactory<vtkPolyLineWidgetHandle> {
  getWidgetState(): vtkPolyLineWidgetState;

  /**
   * The representation builders the widget uses in the given view type.
   */
  getRepresentationsForViewType(viewType: ViewTypes): unknown;

  /**
   * The manipulator the handles are driven by.
   */
  getManipulator(): vtkAbstractManipulator | undefined;

  /**
   * Set the manipulator on the widget, on its move handle and on each of its
   * placed handles.
   */
  setManipulator(manipulator: vtkAbstractManipulator): void;
}

export interface IPolyLineWidgetInitialValues extends IAbstractWidgetFactoryInitialValues<vtkPolyLineWidgetHandle> {
  manipulator?: vtkAbstractManipulator;
}

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IPolyLineWidgetInitialValues
): void;

export function newInstance(
  props?: IPolyLineWidgetInitialValues
): vtkPolyLineWidget;

/**
 * vtkPolyLineWidget places an arbitrary number of handles joined by a
 * poly line.
 */
export declare const vtkPolyLineWidget: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkPolyLineWidget;
