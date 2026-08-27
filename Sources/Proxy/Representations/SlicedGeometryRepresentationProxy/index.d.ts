import { RGBColor } from '../../../types';
import { SlicingMode } from '../../../Rendering/Core/ImageMapper/Constants';
import {
  IAbstractRepresentationProxyInitialValues,
  vtkAbstractRepresentationProxy,
} from '../../Core/AbstractRepresentationProxy';

export interface vtkSlicedGeometryRepresentationProxy extends vtkAbstractRepresentationProxy {
  /**
   * Move the cutting plane along its normal. Returns true when the plane or
   * the stored slice actually changed.
   */
  setSlice(slice?: number): boolean;

  /**
   * Translate the actor along the plane normal, to pull the cut geometry off
   * the surface it was cut from. Returns true when anything changed.
   */
  setOffset(offset?: number): boolean;

  /**
   * @param mode one of the vtkImageMapper slicing mode names, 'X', 'Y' or 'Z'
   */
  setSlicingMode(mode: string): void;

  getSlicingMode(): string | SlicingMode;
  getSlice(): number;
  getOffset(): number;

  // proxy property mappings
  getOpacity(): number;
  setOpacity(opacity: number): boolean;
  getVisibility(): boolean;
  setVisibility(visible: boolean): boolean;
  getColor(): RGBColor;
  setColor(color: RGBColor): boolean;
  getUseShadow(): boolean;
  setUseShadow(lighting: boolean): boolean;
  getUseBounds(): boolean;
  setUseBounds(useBounds: boolean): boolean;
}

export interface ISlicedGeometryRepresentationProxyInitialValues extends IAbstractRepresentationProxyInitialValues {
  offset?: number;
  slice?: number;
  slicingMode?: string | SlicingMode;
}

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ISlicedGeometryRepresentationProxyInitialValues
): void;

export function newInstance(
  initialValues?: ISlicedGeometryRepresentationProxyInitialValues
): vtkSlicedGeometryRepresentationProxy;

/**
 * Representation proxy cutting its input geometry with an axis-aligned plane
 * and rendering the resulting slice.
 */
declare const vtkSlicedGeometryRepresentationProxy: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkSlicedGeometryRepresentationProxy;
