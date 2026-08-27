import { Nullable, Vector3 } from '../../../types';
import { InteractionMethodsName, lineNames } from './Constants';
import { vtkAbstractWidget } from '../../Core/AbstractWidget';
import { ViewTypes } from '../../Core/WidgetManager/Constants';
import { vtkColor3MixinState } from '../../Core/StateBuilder/color3Mixin';
import { vtkManipulatorMixinState } from '../../Core/StateBuilder/manipulatorMixin';
import { vtkOrientationMixinState } from '../../Core/StateBuilder/orientationMixin';
import { vtkOriginMixinState } from '../../Core/StateBuilder/originMixin';
import { vtkScale3MixinState } from '../../Core/StateBuilder/scale3Mixin';
import { vtkVisibleMixinState } from '../../Core/StateBuilder/visibleMixin';

/**
 * The mixins the reslice cursor builds its line handles from.
 */
export type ResliceCursorLineHandleState = vtkOriginMixinState &
  vtkColor3MixinState &
  vtkScale3MixinState &
  vtkOrientationMixinState &
  vtkVisibleMixinState &
  vtkManipulatorMixinState;

type TLineName = (typeof lineNames)[number];

type TCursorStyles = {
  [key in InteractionMethodsName]?: string;
} & {
  default?: string;
};

export interface vtkResliceCursorWidgetDefaultInstance extends vtkAbstractWidget {
  getActiveInteraction(): Nullable<InteractionMethodsName>;

  getScaleInPixels(): boolean;
  setScaleInPixels(scaleInPixels: boolean): boolean;

  getHoleWidth(): number;
  setHoleWidth(holeWidth: number): boolean;

  setKeepOrthogonality(keepOrthogonality: boolean): boolean;
  getKeepOrthogonality(): boolean;

  setCursorStyles(cursorStyles: TCursorStyles): boolean;
  getCursorStyles(): TCursorStyles;

  setEnableTranslation(enableTranslation: boolean): void;
  setEnableRotation(enableRotation: boolean): void;

  getInfiniteLine(): boolean;
  setInfiniteLine(infiniteLine: boolean): boolean;

  getActiveLineName(): TLineName | undefined;

  /**
   * The line handle state of the line currently being interacted with.
   */
  getActiveLineHandle(): ResliceCursorLineHandleState | undefined;

  /**
   * The line handle state of the other line in the same view.
   *
   * @param {TLineName} lineName Returns `ZinX` for `YinX`, `YinX` for `ZinX`...
   */
  getOtherLineHandle(
    lineName: TLineName
  ): ResliceCursorLineHandleState | undefined;

  /**
   * Which of the two rotation handles of the active axis is active.
   *
   * @returns `'point0'`, `'point1'`, or null when the line itself is being
   * rotated.
   */
  getActiveRotationPointName(): Nullable<'point0' | 'point1'>;

  /**
   * Start a scroll interaction, optionally seeding the previous position.
   */
  startScrolling(newPosition: Nullable<Vector3>): void;

  /**
   * End the current scroll interaction.
   */
  endScrolling(): void;

  /**
   * Apply the cursor style matching the current interaction to the view.
   */
  updateCursor(): void;

  /**
   * Move the center by the given number of slices along the normal of the
   * widget's own view plane.
   *
   * @param {Number} nbSteps The number of slices, may be negative
   */
  translateCenterOnPlaneDirection(nbSteps: number): void;

  /**
   * Clamp the given center to the bounds of the image.
   */
  getBoundedCenter(newCenter: Vector3): Vector3;

  /**
   * Rotate a line of the widget's own view, and the orthogonal one when
   * `keepOrthogonality` is set.
   *
   * @param {TLineName} lineName The line to rotate
   * @param {Number} radianAngle Applied angle, in radians
   */
  rotateLineInView(lineName: TLineName, radianAngle: number): void;

  /**
   * Rotate a plane around an arbitrary axis.
   *
   * @param {ViewTypes} viewType Which plane is rotated
   * @param {Number} radianAngle Applied angle, in radians
   * @param {Vector3} planeNormal The axis to rotate around
   */
  rotatePlane(
    viewType: ViewTypes,
    radianAngle: number,
    planeNormal: Vector3
  ): void;

  /**
   * Set the orientation of a plane.
   *
   * @param {ViewTypes} viewType Which plane is updated
   * @param {Vector3} normal The new plane normal
   * @param {Vector3} [viewUp] Defaults to the current view up of that plane
   */
  setViewPlane(
    viewType: ViewTypes,
    normal: Vector3,
    viewUp?: Nullable<Vector3>
  ): void;

  /**
   * The interaction handlers, installed under the InteractionMethodsName
   * values and dispatched by name from the active interaction.
   */
  translateAxis(callData: any): void;
  translateCenter(callData: any): void;
  rotateLine(callData: any): void;
}

/**
 * Decorates a widget instance (publicAPI+model) with the reslice cursor
 * interaction methods described by `vtkResliceCursorWidgetDefaultInstance`.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 */
declare function widgetBehavior(publicAPI: object, model: object): void;

export default widgetBehavior;
