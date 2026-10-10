import vtkSynchronizableRenderWindow, {
  ISynchronizerContext,
  IViewState,
} from '..';

/**
 * Create, update and delete the behaviors described by `state.behaviors` for
 * the given render window. Behaviors are stored per synchronized view id, so
 * a behavior removed from the state is deleted on the next call.
 *
 * The only mapped behavior type is `CameraSync`, which keeps a destination
 * renderer camera oriented like a source renderer camera. An additional
 * `autoOrientation` flag synchronizes the cameras of a two renderer render
 * window without any explicit configuration.
 *
 * @param {vtkSynchronizableRenderWindow} renderWindow
 * @param {IViewState} state
 * @param {ISynchronizerContext} context used to resolve renderer instance ids
 */
export function applyBehaviors(
  renderWindow: vtkSynchronizableRenderWindow,
  state: IViewState,
  context: ISynchronizerContext
): void;

declare const _default: {
  applyBehaviors: typeof applyBehaviors;
};
export default _default;
