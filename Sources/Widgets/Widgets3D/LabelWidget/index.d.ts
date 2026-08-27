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
import { vtkTextMixinState } from '../../Core/StateBuilder/textMixin';
import { vtkVisibleMixinState } from '../../Core/StateBuilder/visibleMixin';

export type ILabelWidgetHandleState = vtkOriginMixinState &
  vtkColorMixinState &
  vtkScale1MixinState &
  vtkVisibleMixinState &
  vtkManipulatorMixinState;

// The handle backing the SVG text.
export type ILabelWidgetTextState = vtkOriginMixinState &
  vtkColorMixinState &
  vtkTextMixinState &
  vtkVisibleMixinState &
  vtkManipulatorMixinState;

// The internal state of the widget.
export interface vtkLabelWidgetState
  extends vtkWidgetState, vtkBoundsMixinState {
  // The handle that defines where the label points at.
  getMoveHandle(): ILabelWidgetHandleState;
  // The handle that carries the label text and its position.
  getText(): ILabelWidgetTextState;
}

// The type of object returned by vtkWidgetManager.addWidget().
export interface vtkLabelWidgetHandle extends vtkAbstractWidget {
  /**
   * Set the label text and re-render.
   */
  setText(text: string): void;

  /**
   * Get the label text.
   */
  getText(): string;

  setDisplayCallback(callback: (coords: any) => void): void;

  /**
   * Reset the widget to its unplaced state.
   */
  reset(): void;
}

export interface vtkLabelWidget extends vtkAbstractWidgetFactory<vtkLabelWidgetHandle> {
  getWidgetState(): vtkLabelWidgetState;

  /**
   * The representation builders the widget uses in the given view type.
   */
  getRepresentationsForViewType(viewType: ViewTypes): unknown;

  /**
   * The manipulator the move handle and the text handle are driven by.
   */
  getManipulator(): vtkAbstractManipulator | undefined;

  /**
   * Set the manipulator on the widget, on its move handle and on its text
   * handle.
   */
  setManipulator(manipulator: vtkAbstractManipulator): void;
}

export interface ILabelWidgetInitialValues extends IAbstractWidgetFactoryInitialValues<vtkLabelWidgetHandle> {
  manipulator?: vtkAbstractManipulator;
}

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ILabelWidgetInitialValues
): void;

export function newInstance(props?: ILabelWidgetInitialValues): vtkLabelWidget;

/**
 * vtkLabelWidget places a single point and displays a piece of text next to it
 * in the SVG layer.
 */
export declare const vtkLabelWidget: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkLabelWidget;
