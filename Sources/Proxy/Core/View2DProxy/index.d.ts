import { IViewProxyInitialValues, vtkViewProxy } from '../ViewProxy';

export interface vtkView2DProxy extends vtkViewProxy {
  getAxis(): number;
  getFitProps(): boolean;
}

export interface IView2DProxyInitialValues extends IViewProxyInitialValues {
  fitProps?: boolean;
}

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IView2DProxyInitialValues
): void;

export function newInstance(
  initialValues?: IView2DProxyInitialValues
): vtkView2DProxy;

declare const vtkView2DProxy: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkView2DProxy;
