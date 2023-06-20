import type vtkPolyData from '../../../Common/DataModel/PolyData';
import type vtkPlane from '../../../Common/DataModel/Plane';
import vtkAbstractRepresentationProxy from '../../Core/AbstractRepresentationProxy';

export interface vtkResliceRepresentationProxy
  extends vtkAbstractRepresentationProxy {

  // proxy property mappings

  setVisibility(visible: boolean): boolean;
  getVisibility(): boolean;
  setWindowWidth(width: number): boolean;
  getWindowWidth(): number;
  setWindowLevel(level: number): boolean;
  getWindowLevel(): number;
  setInterpolationType(type: number): boolean;
  getInterpolationType(): number;
  setSlabType(type: number): boolean;
  getSlabtype(): number;
  setSlicePlane(plane: vtkPlane): boolean;
  getSlicePlane(): vtkPlane;
  setSlicePolyData(polydata: vtkPolyData): boolean;
  getSlicePolyData(): vtkPolyData;
  setSlabThickness(thickness: number): boolean;
  getSlabThickness(): number;
  setSlabTrapezoidIntegration(slabTrapezoidIntegration: number): boolean;
  getSlabTrapezoidIntegration(): number;
}

export default vtkResliceRepresentationProxy;
