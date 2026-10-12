import { vtkPolyData } from '../../../Common/DataModel/PolyData';
import { vtkPlane } from '../../../Common/DataModel/Plane';
import { vtkAbstractRepresentationProxy } from '../../Core/AbstractRepresentationProxy';
import { RGBColor } from '../../../types';

export interface vtkResliceRepresentationProxy extends vtkAbstractRepresentationProxy {
  // proxy property mappings

  setVisibility(visible: boolean): boolean;
  getVisibility(): boolean;
  setWindowWidth(width: number): boolean;
  getWindowWidth(): number;
  setWindowLevel(level: number): boolean;
  getWindowLevel(): number;
  setInterpolationType(type: number): boolean;
  getInterpolationType(): number;
  setOutlineLineWidth(lineWidth: number): boolean;
  getOutlineLineWidth(): number;
  setOutlineColor(r: number, g: number, b: number): boolean;
  setOutlineColor(color: RGBColor): boolean;
  getOutlineColor(): RGBColor;
  setOutlineVisibility(visibility: boolean): boolean;
  getOutlineVisibility(): boolean;
  setSlabType(type: number): boolean;
  getSlabType(): number;
  setSlicePlane(plane: vtkPlane): boolean;
  getSlicePlane(): vtkPlane;
  setSlicePolyData(polydata: vtkPolyData): boolean;
  getSlicePolyData(): vtkPolyData;
  setSlabThickness(thickness: number): boolean;
  getSlabThickness(): number;
  setSlabTrapezoidIntegration(slabTrapezoidIntegration: number): boolean;
  getSlabTrapezoidIntegration(): number;
}

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: object
): void;

export function newInstance(
  initialValues?: object
): vtkResliceRepresentationProxy;

declare const vtkResliceRepresentationProxy: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkResliceRepresentationProxy;
