import vtkAbstractWidget from '../../Core/AbstractWidget';
import { Vector3, Bounds } from '../../../types';

export interface ISeedWidgetHandleState {
  getOrigin(): Vector3;
  setOrigin(arg: Vector3): void;
  getColor3(): string;
  setColor3(arg: string): void;
  getScale1(): number;
  setScale1(arg: number): void;
  getVisible(): boolean;
  setVisible(arg: boolean): void;
  setShape(arg: string): void;
  getShape(): string;
}

// The internal state of the widget.
export interface vtkSeedWidgetState {
  // A handle that defines the location
  getMoveHandle(): ISeedWidgetHandleState;
}

// Object returned by vtkWidgetManager.addWidget().
// One instance per view.
export interface vtkSeedWidgetHandle {
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

export interface vtkSeedWidget {
  // Abstract widget methods.
  getWidgetState(): vtkSeedWidgetState;
  onWidgetChange(fn: () => void): void;
  placeWidget(bounds: Bounds): void;
  setPlaceFactor(factor: number): void;
}

export interface ISeedWidgetInitialValues {}

export function newInstance(props?: ISeedWidgetInitialValues): vtkSeedWidget;

export const vtkSeedWidget: {
  newInstance: typeof newInstance;
};

export default vtkSeedWidget;
