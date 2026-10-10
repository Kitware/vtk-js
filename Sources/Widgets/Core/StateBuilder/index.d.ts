import vtkWidgetState from '../WidgetState';
import { vtkBoundsMixinState } from './boundsMixin';

/**
 * The root state a builder produces. It is always decorated with the bounds
 * mixin, so that `placeWidget` and the widget factor are available on every
 * widget state, plus whatever mixins are passed to `build`.
 */
export type vtkRootWidgetState = vtkWidgetState & vtkBoundsMixinState;

/**
 * The name of a mixin known to the state builder. Each one is implemented by
 * the matching `<name>Mixin` module of this directory.
 */
export type StateBuilderMixin =
  | 'bounds'
  | 'color'
  | 'color3'
  | 'corner'
  | 'direction'
  | 'manipulator'
  | 'name'
  | 'orientation'
  | 'origin'
  | 'scale1'
  | 'scale3'
  | 'text'
  | 'visible'
  | 'shape';

export interface StateBuilder {
  /**
   * Add a sub-state that can hold a varying number of instances, all built from
   * the same set of mixins. The built state exposes `add<Name>`,
   * `get<Name>List`, `remove<Name>` and `clear<Name>List` methods.
   */
  addDynamicMixinState(buildInfo: {
    labels: string[];
    mixins: StateBuilderMixin[];
    name: string;
    initialValues?: object;
  }): StateBuilder;

  /**
   * Add a single sub-state built from the given mixins.
   */
  addStateFromMixin(buildInfo: {
    labels: string[];
    mixins: StateBuilderMixin[];
    name: string;
    initialValues?: object;
  }): StateBuilder;

  /**
   * Add an already built state as a sub-state.
   */
  addStateFromInstance(stateInfo: {
    labels: string[];
    name: string;
    instance: vtkWidgetState;
  }): StateBuilder;

  /**
   * Add a plain field, with its `get<Name>`/`set<Name>` accessors, onto the
   * state being built.
   */
  addField(field: { name: string; initialValue: any }): StateBuilder;

  /**
   * Build the state, optionally decorating the root state with the given
   * mixins.
   */
  build(...mixins: StateBuilderMixin[]): vtkRootWidgetState;
}

/**
 * Create a new, empty state builder.
 */
export function createBuilder(): StateBuilder;

declare const vtkStateBuilder: {
  createBuilder: typeof createBuilder;
};

export default vtkStateBuilder;
