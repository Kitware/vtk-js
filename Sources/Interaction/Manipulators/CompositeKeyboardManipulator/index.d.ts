import vtkRenderer from '../../../Rendering/Core/Renderer';
import vtkRenderWindowInteractor from '../../../Rendering/Core/RenderWindowInteractor';

export interface vtkCompositeKeyboardManipulator {
  /**
   * Handles a keypress event.
   * @param interactor the interactor
   * @param renderer the renderer
   * @param key the key
   */
  onKeyPress(
    interactor: vtkRenderWindowInteractor,
    renderer: vtkRenderer,
    key: KeyboardEvent['key']
  ): void;

  /**
   * Handles a keydown event.
   * @param interactor the interactor
   * @param renderer the renderer
   * @param key the key
   */
  onKeyDown(
    interactor: vtkRenderWindowInteractor,
    renderer: vtkRenderer,
    key: KeyboardEvent['key']
  ): void;

  /**
   * Handles a keyup event.
   * @param interactor the interactor
   * @param renderer the renderer
   * @param key the key
   */
  onKeyUp(
    interactor: vtkRenderWindowInteractor,
    renderer: vtkRenderer,
    key: KeyboardEvent['key']
  ): void;
}

export function extend(publicAPI: object, model: object): void;

export const vtkCompositeKeyboardManipulator: {
  extend: typeof extend;
};

export default vtkCompositeKeyboardManipulator;
