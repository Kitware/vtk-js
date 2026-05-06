import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import vtkArmature from '../../../Common/DataModel/Armature';

export interface IArmatureSourceInitialValues {
  skeleton?: vtkArmature | null;
  boneRadius?: number;
  jointRadius?: number;
}

type vtkArmatureSourceBase = vtkObject &
  Omit<
    vtkAlgorithm,
    | 'getInputData'
    | 'setInputData'
    | 'setInputConnection'
    | 'getInputConnection'
    | 'addInputConnection'
    | 'addInputData'
  >;

export interface vtkArmatureSource extends vtkArmatureSourceBase {
  /**
   * Set the skeleton to visualize
   * @param skeleton The skeleton to visualize
   */
  setSkeleton(skeleton: vtkArmature | null): boolean;

  /**
   * Get the skeleton
   */
  getSkeleton(): vtkArmature | null;

  /**
   * Set the radius for bone visualization (cylinders)
   * @param radius The bone radius
   */
  setBoneRadius(radius: number): boolean;

  /**
   * Get the bone radius
   */
  getBoneRadius(): number;

  /**
   * Set the radius for joint visualization (spheres)
   * @param radius The joint radius
   */
  setJointRadius(radius: number): boolean;

  /**
   * Get the joint radius
   */
  getJointRadius(): number;
}

export interface IvtkArmatureSourceInitialValues
  extends IArmatureSourceInitialValues {}

export function newInstance(
  initialValues?: IvtkArmatureSourceInitialValues
): vtkArmatureSource;
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IArmatureSourceInitialValues
): void;

export declare const vtkArmatureSource: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkArmatureSource;
