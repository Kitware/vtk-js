import { vtkViewProxy } from '../ViewProxy';

export interface vtkView2DProxy extends vtkViewProxy {
  getAxis(): number;
}

declare const _default: vtkView2DProxy;
export default _default;
