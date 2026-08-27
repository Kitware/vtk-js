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
import { vtkCornerMixinState } from '../../Core/StateBuilder/cornerMixin';
import { vtkManipulatorMixinState } from '../../Core/StateBuilder/manipulatorMixin';
import { vtkOrientationMixinState } from '../../Core/StateBuilder/orientationMixin';
import { vtkOriginMixinState } from '../../Core/StateBuilder/originMixin';
import { vtkScale1MixinState } from '../../Core/StateBuilder/scale1Mixin';
import { vtkTextMixinState } from '../../Core/StateBuilder/textMixin';
import { vtkVisibleMixinState } from '../../Core/StateBuilder/visibleMixin';

// One of the two corner handles.
export type IRectangleWidgetPointHandleState = vtkOriginMixinState &
  vtkColorMixinState &
  vtkScale1MixinState &
  vtkVisibleMixinState &
  vtkManipulatorMixinState;

// The handle used for displaying the rectangle.
export type IRectangleWidgetShapeHandleState = vtkOriginMixinState &
  vtkCornerMixinState &
  vtkColorMixinState &
  vtkVisibleMixinState &
  vtkOrientationMixinState;

// The handle backing the SVG text.
export type IRectangleWidgetTextState = vtkOriginMixinState &
  vtkColorMixinState &
  vtkTextMixinState &
  vtkVisibleMixinState;

/**
 * Where the text is placed relative to the bounding box of the shape, along
 * the horizontal, vertical and depth axes of the view.
 */
export type RectangleWidgetTextPosition = [
  TextPosition,
  TextPosition,
  TextPosition,
];

// The internal state of the widget.
export interface vtkRectangleWidgetState
  extends vtkWidgetState, vtkBoundsMixinState {
  getPoint1Handle(): IRectangleWidgetPointHandleState;
  getPoint2Handle(): IRectangleWidgetPointHandleState;
  getRectangleHandle(): IRectangleWidgetShapeHandleState;
  getText(): IRectangleWidgetTextState;

  getTextPosition(): RectangleWidgetTextPosition;
  getTextPositionByReference(): RectangleWidgetTextPosition;
  setTextPosition(textPosition: RectangleWidgetTextPosition): boolean;
  setTextPosition(
    horizontal: TextPosition,
    vertical: TextPosition,
    depth: TextPosition
  ): boolean;
  setTextPositionFrom(textPosition: RectangleWidgetTextPosition): void;

  /**
   * The margin, in world units, between the text and the shape.
   */
  getTextWorldMargin(): number;
  setTextWorldMargin(textWorldMargin: number): boolean;
}

// The type of object returned by vtkWidgetManager.addWidget().
export interface vtkRectangleWidgetHandle extends vtkShapeWidgetHandle {}

export interface vtkRectangleWidget extends vtkShapeWidget<vtkRectangleWidgetHandle> {
  getWidgetState(): vtkRectangleWidgetState;
  setWidgetState(widgetState: vtkRectangleWidgetState): boolean;

  /**
   * The representation builders the widget uses in the given view type.
   */
  getRepresentationsForViewType(viewType: ViewTypes): unknown;
}

export interface IRectangleWidgetInitialValues extends IShapeWidgetInitialValues<vtkRectangleWidgetHandle> {}

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IRectangleWidgetInitialValues
): void;

export function newInstance(
  props?: IRectangleWidgetInitialValues
): vtkRectangleWidget;

/**
 * vtkRectangleWidget places a rectangle from two points. Modifier keys switch
 * between corner-to-corner and center-to-corner placement and constrain the
 * ratio to a square.
 */
export declare const vtkRectangleWidget: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkRectangleWidget;
