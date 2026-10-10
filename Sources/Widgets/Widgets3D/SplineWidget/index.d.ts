import vtkAbstractWidget from '../../Core/AbstractWidget';
import vtkAbstractManipulator from '../../Manipulators/AbstractManipulator';
import {
  IAbstractWidgetFactoryInitialValues,
  vtkAbstractWidgetFactory,
} from '../../Core/AbstractWidgetFactory';
import { ViewTypes } from '../../Core/WidgetManager/Constants';
import { TypedArray, Vector3 } from '../../../types';
import { BoundaryCondition } from '../../../Common/DataModel/Spline1D/Constants';
import { splineKind } from '../../../Common/DataModel/Spline3D/Constants';
import { vtkWidgetState } from '../../Core/WidgetState';
import { vtkBoundsMixinState } from '../../Core/StateBuilder/boundsMixin';
import { vtkColorMixinState } from '../../Core/StateBuilder/colorMixin';
import { vtkManipulatorMixinState } from '../../Core/StateBuilder/manipulatorMixin';
import { vtkOriginMixinState } from '../../Core/StateBuilder/originMixin';
import { vtkScale1MixinState } from '../../Core/StateBuilder/scale1Mixin';
import { vtkVisibleMixinState } from '../../Core/StateBuilder/visibleMixin';

export type ISplineWidgetHandleState = vtkOriginMixinState &
  vtkColorMixinState &
  vtkScale1MixinState &
  vtkVisibleMixinState &
  vtkManipulatorMixinState;

// The internal state of the widget.
export interface vtkSplineWidgetState
  extends vtkWidgetState, vtkBoundsMixinState {
  getSplineKind(): splineKind;
  setSplineKind(splineKind: splineKind): boolean;

  getSplineClosed(): boolean;
  setSplineClosed(splineClosed: boolean): boolean;

  getSplineBoundaryCondition(): BoundaryCondition;
  setSplineBoundaryCondition(boundaryCondition: BoundaryCondition): boolean;

  getSplineBoundaryConditionValues(): Vector3;
  getSplineBoundaryConditionValuesByReference(): Vector3;
  setSplineBoundaryConditionValues(values: Vector3): boolean;
  setSplineBoundaryConditionValues(x: number, y: number, z: number): boolean;
  setSplineBoundaryConditionValuesFrom(values: Vector3): void;

  getSplineTension(): number;
  setSplineTension(tension: number): boolean;

  getSplineContinuity(): number;
  setSplineContinuity(continuity: number): boolean;

  getSplineBias(): number;
  setSplineBias(bias: number): boolean;

  // The handle used only during initial placement.
  getMoveHandle(): ISplineWidgetHandleState;

  // The placed handles, in placement order.
  getHandleList(): ISplineWidgetHandleState[];
  addHandle(initialValues?: object): ISplineWidgetHandleState;
  removeHandle(handleOrIndex: ISplineWidgetHandleState | number): void;
  clearHandleList(): void;
}

// The type of object returned by vtkWidgetManager.addWidget().
export interface vtkSplineWidgetHandle extends vtkAbstractWidget {
  setDisplayCallback(callback: (coords: any) => void): void;

  getResetAfterPointPlacement(): boolean;
  setResetAfterPointPlacement(resetAfterPointPlacement: boolean): boolean;

  getFreehandMinDistance(): number;
  setFreehandMinDistance(freehandMinDistance: number): boolean;

  getAllowFreehand(): boolean;
  setAllowFreehand(allowFreehand: boolean): boolean;

  getDefaultCursor(): string;
  setDefaultCursor(defaultCursor: string): boolean;

  getHandleSizeInPixels(): number;
  /**
   * Set the handle size and rescale the already placed handles.
   */
  setHandleSizeInPixels(size: number): void;

  /**
   * Set the number of points the spline is sampled at, on the widget and on
   * its spline representation.
   */
  setResolution(resolution: number): void;

  /**
   * The sampled points of the spline, as the raw point data of the spline
   * representation output.
   */
  getPoints(): TypedArray;

  /**
   * Remove every placed handle.
   */
  reset(): void;
}

export interface vtkSplineWidget extends vtkAbstractWidgetFactory<vtkSplineWidgetHandle> {
  getWidgetState(): vtkSplineWidgetState;

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

  /**
   * The minimum world distance between two handles placed by a freehand
   * stroke.
   */
  getFreehandMinDistance(): number;
  setFreehandMinDistance(freehandMinDistance: number): boolean;

  getAllowFreehand(): boolean;
  setAllowFreehand(allowFreehand: boolean): boolean;

  /**
   * The number of points the spline is sampled at.
   */
  getResolution(): number;
  setResolution(resolution: number): boolean;

  getDefaultCursor(): string;
  setDefaultCursor(defaultCursor: string): boolean;

  getHandleSizeInPixels(): number;
  setHandleSizeInPixels(handleSizeInPixels: number): boolean;

  /**
   * When true, closing the spline resets the widget instead of making it lose
   * the focus.
   */
  getResetAfterPointPlacement(): boolean;
  setResetAfterPointPlacement(resetAfterPointPlacement: boolean): boolean;
}

export interface ISplineWidgetInitialValues extends IAbstractWidgetFactoryInitialValues<vtkSplineWidgetHandle> {
  manipulator?: vtkAbstractManipulator;
  freehandMinDistance?: number;
  allowFreehand?: boolean;
  resolution?: number;
  defaultCursor?: string;
  handleSizeInPixels?: number;
  resetAfterPointPlacement?: boolean;
}

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ISplineWidgetInitialValues
): void;

export function newInstance(
  props?: ISplineWidgetInitialValues
): vtkSplineWidget;

/**
 * vtkSplineWidget places handles that a closed or open spline is fitted
 * through, either point by point or with a freehand stroke.
 */
export declare const vtkSplineWidget: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkSplineWidget;
