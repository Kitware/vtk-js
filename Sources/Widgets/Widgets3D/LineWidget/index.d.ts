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
import { vtkShapeMixinState } from '../../Core/StateBuilder/shapeMixin';
import { vtkTextMixinState } from '../../Core/StateBuilder/textMixin';
import { vtkVisibleMixinState } from '../../Core/StateBuilder/visibleMixin';

export type ILineWidgetHandleState = vtkOriginMixinState &
  vtkColorMixinState &
  vtkScale1MixinState &
  vtkVisibleMixinState &
  vtkManipulatorMixinState &
  vtkShapeMixinState;

// The handle backing the SVG text.
export type ILineWidgetTextState = vtkOriginMixinState &
  vtkColorMixinState &
  vtkTextMixinState &
  vtkVisibleMixinState;

/**
 * A sub-state holding only the relative position of the text along the line,
 * so that it can be listened to on its own.
 */
export interface vtkLineWidgetPositionOnLineState extends vtkWidgetState {
  /**
   * Where the text sits along the line, from 0 at handle1 to 1 at handle2.
   */
  getPosOnLine(): number;
  setPosOnLine(posOnLine: number): boolean;
}

// The internal state of the widget.
export interface vtkLineWidgetState
  extends vtkWidgetState, vtkBoundsMixinState {
  // The handle used only during initial placement.
  getMoveHandle(): ILineWidgetHandleState;
  // The first tip of the line.
  getHandle1(): ILineWidgetHandleState;
  // The second tip of the line.
  getHandle2(): ILineWidgetHandleState;
  getText(): ILineWidgetTextState;
  getPositionOnLine(): vtkLineWidgetPositionOnLineState;

  getLineThickness(): number;
  setLineThickness(lineThickness: number): boolean;
}

// The type of object returned by vtkWidgetManager.addWidget().
export interface vtkLineWidgetHandle extends vtkAbstractWidget {
  /**
   * The handle state at the given index.
   *
   * @param handleIndex 0 for handle1, 1 for handle2, 2 for the move handle
   */
  getHandle(handleIndex: number): ILineWidgetHandleState;

  /**
   * The index of the given handle state, or -1 when it is not one of the
   * widget's handles.
   */
  getHandleIndex(handle: ILineWidgetHandleState): number;

  /**
   * True once both tips of the line have been placed.
   */
  isPlaced(): boolean;

  /**
   * Set the text displayed by the SVG layer and re-render.
   */
  setText(text: string): void;

  /**
   * Orient every handle along the direction of the line.
   */
  updateHandleOrientations(): void;

  /**
   * Make the two tip handles face the camera.
   */
  rotateHandlesToFaceCamera(): void;

  /**
   * Update the visibility flags of the given handle's representation from the
   * handle state's visibility and shape.
   */
  updateHandleVisibility(handleIndex: number): void;

  /**
   * Place the given handle at the current position of the move handle.
   */
  placeHandle(handleIndex: number): void;

  /**
   * Reset the widget to its unplaced state.
   */
  reset(): void;
}

export interface vtkLineWidget extends vtkAbstractWidgetFactory<vtkLineWidgetHandle> {
  getWidgetState(): vtkLineWidgetState;

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
  setManipulator(manipulator: vtkAbstractManipulator): void;

  /**
   * The world distance between the two tips of the line. Returns 0 until both
   * tips are placed.
   */
  getDistance(): number;
}

export interface ILineWidgetInitialValues extends IAbstractWidgetFactoryInitialValues<vtkLineWidgetHandle> {
  manipulator?: vtkAbstractManipulator;
}

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ILineWidgetInitialValues
): void;

export function newInstance(props?: ILineWidgetInitialValues): vtkLineWidget;

/**
 * vtkLineWidget places a line between two handles, each of which can take one
 * of the shapes of `Constants.ShapeType`, and measures its length.
 */
export declare const vtkLineWidget: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkLineWidget;
