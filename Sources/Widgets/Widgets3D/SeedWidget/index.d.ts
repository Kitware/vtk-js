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
import { vtkColor3MixinState } from '../../Core/StateBuilder/color3Mixin';
import { vtkDirectionMixinState } from '../../Core/StateBuilder/directionMixin';
import { vtkManipulatorMixinState } from '../../Core/StateBuilder/manipulatorMixin';
import { vtkOriginMixinState } from '../../Core/StateBuilder/originMixin';
import { vtkScale1MixinState } from '../../Core/StateBuilder/scale1Mixin';
import { vtkVisibleMixinState } from '../../Core/StateBuilder/visibleMixin';

export interface ISeedWidgetHandleState
  extends
    vtkWidgetState,
    vtkOriginMixinState,
    vtkColor3MixinState,
    vtkScale1MixinState,
    vtkDirectionMixinState,
    vtkVisibleMixinState,
    vtkManipulatorMixinState {}

// The internal state of the widget.
export interface vtkSeedWidgetState
  extends vtkWidgetState, vtkBoundsMixinState {
  // A handle that defines the location
  getMoveHandle(): ISeedWidgetHandleState;
}

// Object returned by vtkWidgetManager.addWidget().
// One instance per view.
export interface vtkSeedWidgetHandle extends vtkAbstractWidget {
  /**
   * Place the seed position.
   * @param center Vector3 3D position
   */
  setCenter(center: Vector3): void;

  /**
   * Turn the seed widget as interactive.
   * @see vtkSeedWidgetHandle.endInteract
   */
  startInteract(): void;

  /**
   * Stop the seed widget to be interactive.
   * @see vtkSeedWidgetHandle.endInteract
   */
  endInteract(): void;
}

export interface vtkSeedWidget extends vtkAbstractWidgetFactory<vtkSeedWidgetHandle> {
  getWidgetState(): vtkSeedWidgetState;
  setWidgetState(widgetState: vtkSeedWidgetState): boolean;

  /**
   * The representation builders the widget uses in the given view type.
   */
  getRepresentationsForViewType(viewType: ViewTypes): unknown;

  /**
   * The manipulator the move handle is driven by.
   */
  getManipulator(): vtkAbstractManipulator | undefined;

  /**
   * Set the manipulator on the widget and on its move handle.
   */
  setManipulator(manipulator: vtkAbstractManipulator): void;
}

export interface ISeedWidgetInitialValues extends IAbstractWidgetFactoryInitialValues<vtkSeedWidgetHandle> {}

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ISeedWidgetInitialValues
): void;

export function newInstance(props?: ISeedWidgetInitialValues): vtkSeedWidget;

export const vtkSeedWidget: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkSeedWidget;
