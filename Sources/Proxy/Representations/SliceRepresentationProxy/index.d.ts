import vtkAbstractRepresentationProxy from '../../Core/AbstractRepresentationProxy';

export interface vtkSliceRepresentationProxy
  extends vtkAbstractRepresentationProxy {
  /**
   * @param mode XYZIJK
   */
  setSlicingMode(mode: string): boolean;
  getSlicingMode(): string;
  getSliceIndex(): number;
  getAnnotations(): any;

  // proxy property mappings

  setVisibility(visible: boolean): boolean;
  getVisibility(): boolean;
  setWindowWidth(width: number): boolean;
  getWindowWidth(): number;
  setWindowLevel(level: number): boolean;
  getWindowLevel(): number;
  setInterpolationType(type: number): boolean;
  getInterpolationType(): number;
  setSlice(type: number): boolean;
  getSlice(): number;
}

export default vtkSliceRepresentationProxy;
