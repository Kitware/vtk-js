import vtkAbstractWidget from '../../Core/AbstractWidget';
import vtkAbstractManipulator from '../../Manipulators/AbstractManipulator';
import {
  IAbstractWidgetFactoryInitialValues,
  vtkAbstractWidgetFactory,
} from '../../Core/AbstractWidgetFactory';
import { ViewTypes } from '../../Core/WidgetManager/Constants';
import { Vector3, Vector4 } from '../../../types';
import { TransformMode } from './constants';
import { vtkWidgetState } from '../../Core/WidgetState';
import { vtkBoundsMixinState } from '../../Core/StateBuilder/boundsMixin';
import { vtkColor3MixinState } from '../../Core/StateBuilder/color3Mixin';
import { vtkNameMixinState } from '../../Core/StateBuilder/nameMixin';
import { vtkOrientationMixinState } from '../../Core/StateBuilder/orientationMixin';
import { vtkOriginMixinState } from '../../Core/StateBuilder/originMixin';
import { vtkScale1MixinState } from '../../Core/StateBuilder/scale1Mixin';
import { vtkScale3MixinState } from '../../Core/StateBuilder/scale3Mixin';
import { vtkVisibleMixinState } from '../../Core/StateBuilder/visibleMixin';

/**
 * The transform the widget edits. The handle states are re-derived from it
 * whenever it is modified.
 */
export interface vtkTransformControlsWidgetTransformState extends vtkWidgetState {
  getTranslation(): Vector3;
  getTranslationByReference(): Vector3;
  setTranslation(translation: Vector3): boolean;
  setTranslation(x: number, y: number, z: number): boolean;
  setTranslationFrom(translation: Vector3): void;

  getScale(): Vector3;
  getScaleByReference(): Vector3;
  setScale(scale: Vector3): boolean;
  setScale(x: number, y: number, z: number): boolean;
  setScaleFrom(scale: Vector3): void;

  /**
   * The rotation, as a quaternion.
   */
  getRotation(): Vector4;
  getRotationByReference(): Vector4;
  setRotation(rotation: Vector4): boolean;
  setRotation(x: number, y: number, z: number, w: number): boolean;
  setRotationFrom(rotation: Vector4): void;
}

// A translate or scale axis handle.
export type ITransformControlsWidgetAxisHandleState = vtkNameMixinState &
  vtkOriginMixinState &
  vtkColor3MixinState &
  vtkScale3MixinState &
  vtkOrientationMixinState &
  vtkVisibleMixinState;

// A rotate axis handle.
export type ITransformControlsWidgetRotateHandleState = vtkNameMixinState &
  vtkOriginMixinState &
  vtkColor3MixinState &
  vtkScale1MixinState &
  vtkOrientationMixinState &
  vtkVisibleMixinState;

// The internal state of the widget.
export interface vtkTransformControlsWidgetState
  extends vtkWidgetState, vtkBoundsMixinState {
  getTransform(): vtkTransformControlsWidgetTransformState;

  getTranslateHandleX(): ITransformControlsWidgetAxisHandleState;
  getTranslateHandleY(): ITransformControlsWidgetAxisHandleState;
  getTranslateHandleZ(): ITransformControlsWidgetAxisHandleState;

  getScaleHandleX(): ITransformControlsWidgetAxisHandleState;
  getScaleHandleY(): ITransformControlsWidgetAxisHandleState;
  getScaleHandleZ(): ITransformControlsWidgetAxisHandleState;

  getRotateHandleX(): ITransformControlsWidgetRotateHandleState;
  getRotateHandleY(): ITransformControlsWidgetRotateHandleState;
  getRotateHandleZ(): ITransformControlsWidgetRotateHandleState;
}

// The type of object returned by vtkWidgetManager.addWidget().
export interface vtkTransformControlsWidgetHandle extends vtkAbstractWidget {
  setDisplayCallback(callback: (coords: any) => void): void;
}

export interface vtkTransformControlsWidget extends vtkAbstractWidgetFactory<vtkTransformControlsWidgetHandle> {
  getWidgetState(): vtkTransformControlsWidgetState;

  /**
   * The representation builders the widget uses in the given view type.
   */
  getRepresentationsForViewType(viewType: ViewTypes): unknown;

  /**
   * Which set of handles the widget shows and interacts with.
   */
  getMode(): TransformMode;
  setMode(mode: TransformMode): boolean;

  /**
   * Show only the handles matching the current mode.
   */
  updateHandleVisibility(): void;

  getLineManipulator(): vtkAbstractManipulator | undefined;
  getRotateManipulator(): vtkAbstractManipulator | undefined;
}

export interface ITransformControlsWidgetInitialValues extends IAbstractWidgetFactoryInitialValues<vtkTransformControlsWidgetHandle> {
  mode?: TransformMode;
}

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ITransformControlsWidgetInitialValues
): void;

export function newInstance(
  props?: ITransformControlsWidgetInitialValues
): vtkTransformControlsWidget;

/**
 * vtkTransformControlsWidget shows a set of per-axis handles that translate,
 * scale or rotate a transform, one mode at a time.
 */
export declare const vtkTransformControlsWidget: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  TransformMode: typeof TransformMode;
};

export default vtkTransformControlsWidget;
