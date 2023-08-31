import vtkAbstractWidget from '../../Core/AbstractWidget';
import { Vector3, Bounds } from '../../../types';

export interface ISeedWidgetHandleState {
  getOrigin(): Vector3;
  setOrigin(arg: Vector3): void;
  getColor3(): string;
  setColor3(arg: string):void;
  getScale1(): number;
  setScale1(arg: number): void;
  getVisible(): boolean;
  setVisible(arg: boolean):void
  setShape(arg: string): void;
  getShape(): string;
}

// The internal state of the widget.
export interface vtkSeedWidgetState {
  // A handle that defines the location
  getMoveHandle(): ISeedWidgetHandleState;
}

// The type of object returned by vtkWidgetManager.addWidget()
export interface vtkSeedWidgetHandle {
  setCenter(center: Vector3): void;
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
