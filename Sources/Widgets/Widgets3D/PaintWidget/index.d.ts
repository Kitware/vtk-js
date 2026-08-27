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

// The brush handle that follows the pointer.
export type IPaintWidgetHandleState = vtkOriginMixinState &
  vtkColorMixinState &
  vtkScale1MixinState &
  vtkOrientationMixinState &
  vtkManipulatorMixinState &
  vtkVisibleMixinState;

// One stamp of the brush along the current stroke.
export type IPaintWidgetTrailState = vtkOriginMixinState &
  vtkColorMixinState &
  vtkScale1MixinState &
  vtkOrientationMixinState &
  vtkVisibleMixinState;

// The internal state of the widget.
export interface vtkPaintWidgetState
  extends vtkWidgetState, vtkBoundsMixinState {
  /**
   * The unsnapped world position of the pointer, before the handle origin is
   * constrained.
   */
  getTrueOrigin(): Vector3;
  getTrueOriginByReference(): Vector3;
  setTrueOrigin(trueOrigin: Vector3): boolean;
  setTrueOrigin(x: number, y: number, z: number): boolean;
  setTrueOriginFrom(trueOrigin: Vector3): void;

  getHandle(): IPaintWidgetHandleState;

  getTrailList(): IPaintWidgetTrailState[];
  addTrail(initialValues?: object): IPaintWidgetTrailState;
  removeTrail(trailOrIndex: IPaintWidgetTrailState | number): void;
  clearTrailList(): void;
}

// The type of object returned by vtkWidgetManager.addWidget().
export interface vtkPaintWidgetHandle extends vtkAbstractWidget {}

export interface vtkPaintWidget extends vtkAbstractWidgetFactory<vtkPaintWidgetHandle> {
  getWidgetState(): vtkPaintWidgetState;

  /**
   * The representation builders the widget uses in the given view type.
   */
  getRepresentationsForViewType(viewType: ViewTypes): unknown;

  /**
   * The manipulator the brush handle is driven by.
   */
  getManipulator(): vtkAbstractManipulator | undefined;

  /**
   * Set the manipulator on the widget and on its brush handle.
   */
  setManipulator(manipulator: vtkAbstractManipulator): void;

  /**
   * True while a stroke is being painted.
   */
  getPainting(): boolean;

  /**
   * The brush radius.
   */
  getRadius(): number;

  /**
   * Set the brush radius. Also updates the scale of the brush handle.
   */
  setRadius(radius: number): void;

  /**
   * The value the brush paints with.
   */
  getColor(): number[];
  setColor(color: number[]): boolean;
}

export interface IPaintWidgetInitialValues extends IAbstractWidgetFactoryInitialValues<vtkPaintWidgetHandle> {
  manipulator?: vtkAbstractManipulator;
  radius?: number;
  painting?: boolean;
  color?: number[];
}

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IPaintWidgetInitialValues
): void;

export function newInstance(props?: IPaintWidgetInitialValues): vtkPaintWidget;

/**
 * vtkPaintWidget provides a circular or spherical brush that follows the
 * pointer and records the stamps of the current stroke as a trail of states.
 */
export declare const vtkPaintWidget: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkPaintWidget;
