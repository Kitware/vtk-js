import vtkAbstractRepresentationProxy from '../../Core/AbstractRepresentationProxy';
import vtkImageCropFilter from '../../../Filters/General/ImageCropFilter';

export interface vtkVolumeRepresentationProxy
  extends vtkAbstractRepresentationProxy {
  setIs2DVolume(is2D: boolean): void;
  getIs2DVolume(): boolean;
  isVisible(): boolean;
  setVisibility(visible: boolean): void;
  getVisibility(): boolean;
  setSliceVisibility(isVisible: boolean): void;
  getSliceVisibility(): boolean;
  setSampleDistance(samp: number): void;
  getSampleDistance(): number;
  setEdgeGradient(grad: number): void;
  getEdgeGradient(): number;
  getCropFilter(): vtkImageCropFilter;

  // proxy property mappings
  getXSlice(): number;
  setXSlice(slice: number): boolean;
  getYSlice(): number;
  setYSlice(slice: number): boolean;
  getZSlice(): number;
  setZSlice(slice: number): boolean;
  getVolumeVisibility(): boolean;
  setVolumeVisibility(visible: boolean): boolean;
  getXSliceVisibility(): boolean;
  setXSliceVisibility(visible: boolean): boolean;
  getYSliceVisibility(): boolean;
  setYSliceVisibility(visible: boolean): boolean;
  getZSliceVisibility(): boolean;
  setZSliceVisibility(visible: boolean): boolean;
  getWindowWidth(): number;
  setWindowWidth(width: number): boolean;
  getWindowLevel(): number;
  setWindowLevel(level: number): boolean;
  getUseShadow(): boolean;
  setUseShadow(useShadow: boolean): boolean;
  getCroppingPlanes(): number[];
  setCroppingPlanes(planes: number[]): boolean;
}

export default vtkVolumeRepresentationProxy;
