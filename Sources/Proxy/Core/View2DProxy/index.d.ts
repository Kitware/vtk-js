import vtkViewProxy from '../ViewProxy';

export interface vtkView2DProxy extends vtkViewProxy {
  getAxis(): number;
}

export default vtkView2DProxy;
