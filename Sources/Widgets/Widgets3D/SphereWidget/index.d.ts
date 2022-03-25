import vtkAbstractWidget from '../../Core/AbstractWidget';
import { Vector3, Bounds } from '../../../types';

export interface ISphereWidgetHandleState {
  getOrigin(): Vector3;
  setOrigin(arg: Vector3): void;
  getColor(): string;
  setColor(arg: string):void;
  getScale1(): number;
  setScale1(arg: number): void;
  getVisible(): boolean;
  setVisible(arg: boolean):void
  setShape(arg: string): void;
  getShape(): string;
}

// The internal state of the widget.
export interface vtkSphereWidgetState {
  // A handle that defines the center of the sphere.
  getCenterHandle(): ISphereWidgetHandleState;
  // An arbitrary point at the sphere border. Used only to set the radius.
  getBorderHandle(): ISphereWidgetHandleState;
}

// The type of object returned by vtkWidgetManager.addWidget()
export interface vtkSphereWidgetHandle {
  // Set the sphere parameters.
  setCenterAndRadius(center: Vector3, radius: number): void;
}

export interface vtkSphereWidget {
  // Abstract widget methods.
  getWidgetState(): vtkSphereWidgetState;
  onWidgetChange(fn: () => void): void;
  placeWidget(bounds: Bounds): void;
  setPlaceFactor(factor: number): void;

  // Methods specific to vtkSphereWidget.
  getRadius(): number;
}

export interface ISphereWidgetInitialValues {}

export function newInstance(props?: ISphereWidgetInitialValues): vtkSphereWidget;

export const vtkSphereWidget: {
  newInstance: typeof newInstance;
};

export default vtkSphereWidget;
