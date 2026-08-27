import vtkAbstractWidget from '../../Core/AbstractWidget';
import vtkAbstractManipulator from '../../Manipulators/AbstractManipulator';
import {
  IAbstractWidgetFactoryInitialValues,
  vtkAbstractWidgetFactory,
} from '../../Core/AbstractWidgetFactory';
import { BehaviorCategory } from './Constants';
import { Nullable, Vector3 } from '../../../types';

/**
 * The behavior flags that apply for each modifier key. The `None` entry holds
 * the behavior used when no modifier key is pressed.
 */
export interface IShapeWidgetModifierBehavior {
  None: Partial<Record<BehaviorCategory, number>>;
  [modifierKey: string]: Partial<Record<BehaviorCategory, number>>;
}

// The type of object returned by vtkWidgetManager.addWidget().
export interface vtkShapeWidgetHandle extends vtkAbstractWidget {
  setDisplayCallback(callback: (coords: any) => void): void;

  /**
   * Set the text displayed by the SVG layer.
   */
  setText(text: string): void;

  getResetAfterPointPlacement(): boolean;
  setResetAfterPointPlacement(resetAfterPointPlacement: boolean): boolean;

  getModifierBehavior(): IShapeWidgetModifierBehavior;
  setModifierBehavior(modifierBehavior: IShapeWidgetModifierBehavior): boolean;

  /**
   * True when a currently pressed modifier key selects `flag` for `category`.
   */
  isBehaviorActive(category: BehaviorCategory, flag: number): boolean;

  /**
   * True when a currently pressed modifier key selects, for `category`, any
   * flag other than `flag`.
   */
  isOppositeBehaviorActive(category: BehaviorCategory, flag: number): boolean;

  /**
   * The flag of `category` that the pressed modifier keys, or the default
   * behavior, currently select.
   */
  getActiveBehaviorFromCategory(category: BehaviorCategory): number | undefined;

  isRatioFixed(): boolean;
  isDraggingEnabled(): boolean;
  isDraggingForced(): boolean;

  getPoint1(): Nullable<Vector3>;
  getPoint2(): Nullable<Vector3>;

  /**
   * Place both points at once and update the shape.
   */
  setPoints(point1: Vector3, point2: Vector3): void;

  /**
   * Place the first point. Can be called right after `grabFocus()` to place
   * the first point without waiting for an interaction.
   */
  placePoint1(point: Vector3): void;

  /**
   * Place the second point.
   */
  placePoint2(point2: Vector3): void;

  /**
   * The point that makes the shape a square, given the two opposite corners.
   */
  makeSquareFromPoints(point1: Vector3, point2: Vector3): Vector3;

  /**
   * Position the shape from two opposite corners. Reimplemented by each
   * concrete shape widget.
   */
  setCorners(point1: Vector3, point2: Vector3): void;

  /**
   * Recompute the shape from the currently placed points, honoring the active
   * points and ratio behaviors.
   */
  updateShapeBounds(): void;

  /**
   * Move the text handle to the position `textPosition` describes for the
   * bounding box of the two given points.
   */
  updateTextPosition(point1: Vector3, point2: Vector3): void;

  /**
   * If the widget has the focus, reset it to its state just after it grabbed
   * the focus. Otherwise reset it to its state before it grabbed the focus.
   */
  reset(): void;
}

export interface vtkShapeWidget<
  WidgetInstance extends vtkShapeWidgetHandle = vtkShapeWidgetHandle,
> extends vtkAbstractWidgetFactory<WidgetInstance> {
  /**
   * The manipulator the move handles are driven by.
   */
  getManipulator(): vtkAbstractManipulator | undefined;

  /**
   * Set the manipulator on the widget and on every state labelled
   * `moveHandle`.
   */
  setManipulator(manipulator: vtkAbstractManipulator): void;

  getModifierBehavior(): IShapeWidgetModifierBehavior;
  setModifierBehavior(modifierBehavior: IShapeWidgetModifierBehavior): boolean;

  /**
   * When true, placing the second point resets the widget instead of making it
   * lose the focus.
   */
  getResetAfterPointPlacement(): boolean;
  setResetAfterPointPlacement(resetAfterPointPlacement: boolean): boolean;
}

export interface IShapeWidgetInitialValues<
  WidgetInstance extends vtkShapeWidgetHandle = vtkShapeWidgetHandle,
> extends IAbstractWidgetFactoryInitialValues<WidgetInstance> {
  manipulator?: vtkAbstractManipulator;
  modifierBehavior?: IShapeWidgetModifierBehavior;
  resetAfterPointPlacement?: boolean;
}

export function extend<
  WidgetInstance extends vtkShapeWidgetHandle = vtkShapeWidgetHandle,
>(
  publicAPI: object,
  model: object,
  initialValues?: IShapeWidgetInitialValues<WidgetInstance>
): void;

export function newInstance<
  WidgetInstance extends vtkShapeWidgetHandle = vtkShapeWidgetHandle,
>(
  props?: IShapeWidgetInitialValues<WidgetInstance>
): vtkShapeWidget<WidgetInstance>;

/**
 * vtkShapeWidget is the base factory of the widgets that place a two-point
 * shape, such as vtkEllipseWidget and vtkRectangleWidget. It holds the
 * modifier-key behavior table that decides how the two points are interpreted.
 */
export declare const vtkShapeWidget: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkShapeWidget;
