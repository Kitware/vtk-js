import { ViewTypes } from '../../Core/WidgetManager/Constants';
import { TextPosition } from '../ShapeWidget/Constants';
import {
  IShapeWidgetInitialValues,
  vtkShapeWidget,
  vtkShapeWidgetHandle,
} from '../ShapeWidget';
import { vtkWidgetState } from '../../Core/WidgetState';
import { vtkBoundsMixinState } from '../../Core/StateBuilder/boundsMixin';
import { vtkColorMixinState } from '../../Core/StateBuilder/colorMixin';
import { vtkManipulatorMixinState } from '../../Core/StateBuilder/manipulatorMixin';
import { vtkOrientationMixinState } from '../../Core/StateBuilder/orientationMixin';
import { vtkOriginMixinState } from '../../Core/StateBuilder/originMixin';
import { vtkScale1MixinState } from '../../Core/StateBuilder/scale1Mixin';
import { vtkScale3MixinState } from '../../Core/StateBuilder/scale3Mixin';
import { vtkTextMixinState } from '../../Core/StateBuilder/textMixin';
import { vtkVisibleMixinState } from '../../Core/StateBuilder/visibleMixin';

// One of the two corner handles.
export type IEllipseWidgetPointHandleState = vtkOriginMixinState &
  vtkColorMixinState &
  vtkScale1MixinState &
  vtkVisibleMixinState &
  vtkManipulatorMixinState;

// The handle used for displaying the ellipse.
export type IEllipseWidgetShapeHandleState = vtkOriginMixinState &
  vtkColorMixinState &
  vtkScale3MixinState &
  vtkVisibleMixinState &
  vtkOrientationMixinState;

// The handle backing the SVG text.
export type IEllipseWidgetTextState = vtkOriginMixinState &
  vtkColorMixinState &
  vtkTextMixinState &
  vtkVisibleMixinState;

/**
 * Where the text is placed relative to the bounding box of the shape, along
 * the horizontal, vertical and depth axes of the view.
 */
export type EllipseWidgetTextPosition = [
  TextPosition,
  TextPosition,
  TextPosition,
];

// The internal state of the widget.
export interface vtkEllipseWidgetState
  extends vtkWidgetState, vtkBoundsMixinState {
  getPoint1Handle(): IEllipseWidgetPointHandleState;
  getPoint2Handle(): IEllipseWidgetPointHandleState;
  getEllipseHandle(): IEllipseWidgetShapeHandleState;
  getText(): IEllipseWidgetTextState;

  getTextPosition(): EllipseWidgetTextPosition;
  getTextPositionByReference(): EllipseWidgetTextPosition;
  setTextPosition(textPosition: EllipseWidgetTextPosition): boolean;
  setTextPosition(
    horizontal: TextPosition,
    vertical: TextPosition,
    depth: TextPosition
  ): boolean;
  setTextPositionFrom(textPosition: EllipseWidgetTextPosition): void;

  /**
   * The margin, in world units, between the text and the shape.
   */
  getTextWorldMargin(): number;
  setTextWorldMargin(textWorldMargin: number): boolean;
}

// The type of object returned by vtkWidgetManager.addWidget().
export interface vtkEllipseWidgetHandle extends vtkShapeWidgetHandle {}

export interface vtkEllipseWidget extends vtkShapeWidget<vtkEllipseWidgetHandle> {
  getWidgetState(): vtkEllipseWidgetState;
  setWidgetState(widgetState: vtkEllipseWidgetState): boolean;

  /**
   * The representation builders the widget uses in the given view type.
   */
  getRepresentationsForViewType(viewType: ViewTypes): unknown;
}

export interface IEllipseWidgetInitialValues extends IShapeWidgetInitialValues<vtkEllipseWidgetHandle> {}

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IEllipseWidgetInitialValues
): void;

export function newInstance(
  props?: IEllipseWidgetInitialValues
): vtkEllipseWidget;

/**
 * vtkEllipseWidget places an ellipse from two points. Modifier keys switch
 * between corner-to-corner and center-to-corner placement and constrain the
 * ratio to a circle.
 */
export declare const vtkEllipseWidget: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkEllipseWidget;
