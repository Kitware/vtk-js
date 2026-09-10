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

/**
 * vtkArmatureSource converts a vtkArmature skeleton into a vtkPolyData stick
 * figure, so that a skeleton can be drawn with a standard mapper and actor.
 *
 * The filter takes no input and produces one output. For every bone it emits
 * one point at the bone origin, which is the translation part of the bone
 * world matrix, and one vert cell at that point. For every bone that has a
 * parent it also emits one line cell from the parent point to the bone point.
 * The output is therefore one joint per bone and one segment per parent to
 * child link.
 *
 * Point positions come from `skeleton.getWorldMatrices()`, so the output
 * follows the current pose of the armature. vtkArmature initializes each new
 * matrix slot to identity, so a bone whose world matrix was never computed
 * sits at the armature origin. Update the pose on the armature before this
 * filter executes.
 *
 * The filter produces nothing while no skeleton is set, and it leaves the
 * previous output in place when the skeleton has no bones.
 */
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
   * Set the intended radius of the bone geometry.
   *
   * The filter emits line cells rather than cylinders, so this value is stored
   * and never read. Set the line width on the actor property to change the
   * drawn thickness.
   * @param radius The bone radius
   */
  setBoneRadius(radius: number): boolean;

  /**
   * Get the intended bone radius. Default 0.1.
   */
  getBoneRadius(): number;

  /**
   * Set the intended radius of the joint geometry.
   *
   * The filter emits vert cells rather than spheres, so this value is stored
   * and never read. Set the point size on the actor property to change the
   * drawn size.
   * @param radius The joint radius
   */
  setJointRadius(radius: number): boolean;

  /**
   * Get the intended joint radius. Default 0.15.
   */
  getJointRadius(): number;
}

export interface IvtkArmatureSourceInitialValues extends IArmatureSourceInitialValues {}

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
