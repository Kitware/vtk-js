import vtkInteractorStyleManipulator, {
  IInteractorStyleManipulatorInitialValues,
} from '../InteractorStyleManipulator';
import vtkVolumeMapper from '../../../Rendering/Core/VolumeMapper';
import { Nullable, Range, Vector3 } from '../../../types';

export interface vtkInteractorStyleMPRSlice extends vtkInteractorStyleManipulator {
  /**
   * Gets the mapper whose bounds define the slice range.
   */
  getVolumeMapper(): Nullable<vtkVolumeMapper>;

  /**
   * Sets the mapper whose bounds define the slice range, and reorients the
   * camera along the current slice normal.
   */
  setVolumeMapper(volumeMapper: Nullable<vtkVolumeMapper>): void;

  /**
   * Gets the current slice position, measured along the slice normal.
   */
  getSlice(): number;

  /**
   * Moves the camera to the given slice position, clamped to the slice range.
   * @param slice the slice position
   */
  setSlice(slice: number): boolean;

  /**
   * Gets the [min, max] slice positions spanned by the volume mapper.
   */
  getSliceRange(): Range;

  /**
   * Gets the slice normal, which is the camera direction of projection.
   */
  getSliceNormal(): Vector3;

  /**
   * Points the camera along the given world-space normal and frames the volume
   * mapper bounds.
   * @param normal the slice normal components
   */
  setSliceNormal(...normal: number[]): void;
}

export interface IInteractorStyleMPRSliceInitialValues extends IInteractorStyleManipulatorInitialValues {
  volumeMapper?: vtkVolumeMapper;
}

export function newInstance(
  initialValues?: IInteractorStyleMPRSliceInitialValues
): vtkInteractorStyleMPRSlice;

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IInteractorStyleMPRSliceInitialValues
): void;

/**
 * Manipulator style for multi-planar reformat: rotate, pan and zoom
 * manipulators plus a scroll manipulator bound to the slice position along the
 * camera direction of projection.
 */
export declare const vtkInteractorStyleMPRSlice: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkInteractorStyleMPRSlice;
