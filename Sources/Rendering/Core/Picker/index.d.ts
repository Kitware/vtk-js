import { Vector3, Nullable } from '../../../types';
import vtkAbstractPicker, {
  IAbstractPickerInitialValues,
} from '../AbstractPicker';
import vtkActor from '../Actor';
import vtkMapper from '../Mapper';
import vtkProp3D from '../Prop3D';
import vtkRenderer from '../Renderer';
import { vtkSubscription } from '../../../interfaces';

export interface IPickerInitialValues extends IAbstractPickerInitialValues {
  tolerance?: number;
  mapperPosition?: number[];
  actors?: vtkActor[];
  pickedPositions?: Array<any>;
  globalTMin?: number;
}

type OnPickChangeCallback = (pickedPositions: Vector3[]) => void;

export interface vtkPicker extends vtkAbstractPicker {
  /**
   * Get a collection of all the actors that were intersected.
   */
  getActors(): vtkActor[];

  /**
   * Get the dataset that was picked (if any).
   */
  getDataSet(): any;

  /**
   * Get mapper that was picked (if any)
   */
  getMapper(): Nullable<vtkMapper>;

  /**
   * Get position in mapper (i.e., non-transformed) coordinates of pick point.
   */
  getMapperPosition(): Vector3;

  /**
   * Get position in mapper (i.e., non-transformed) coordinates of pick point.
   */
  getMapperPositionByReference(): Vector3;

  /**
   * Get a list of the points the actors returned by getActors were intersected at.
   */
  getPickedPositions(): Vector3[];

  /**
   * Get tolerance for performing pick operation.
   */
  getTolerance(): number;

  /**
   * Invoke a pick change event with the list of picked points.
   * This function is called internally by VTK.js and is not intended for public use.
   * @param {Vector3[]} pickedPositions
   */
  invokePickChange(pickedPositions: Vector3[]): void;

  /**
   * Execute the given callback when the pickChange event is fired.
   * The callback receives an array of picked point positions.
   * @param {OnPickChangeCallback}
   */
  onPickChange(callback: OnPickChangeCallback): vtkSubscription;

  /**
   * Perform pick operation with selection point provided.
   * @param {Vector3} selection First two values should be x-y pixel coordinate, the third is usually zero.
   * @param {vtkRenderer} renderer The renderer on which you want to do picking.
   */
  pick(selection: Vector3, renderer: vtkRenderer): void;

  /**
   * Perform pick operation with the provided selection and focal points.
   * Both point are in world coordinates.
   * @param {Vector3} selectionPoint
   * @param {Vector3} focalPoint
   * @param {vtkRenderer} renderer
   */
  pick3DPoint(
    selectionPoint: Vector3,
    focalPoint: Vector3,
    renderer: vtkRenderer
  ): void;

  /**
   * Set position in mapper coordinates of pick point.
   * @param {Number} x The x coordinate.
   * @param {Number} y The y coordinate.
   * @param {Number} z The z coordinate.
   */
  setMapperPosition(x: number, y: number, z: number): boolean;

  /**
   * Set position in mapper coordinates of pick point.
   * @param {Vector3} mapperPosition The mapper coordinates of pick point.
   */
  setMapperPositionFrom(mapperPosition: Vector3): boolean;

  /**
   * Specify tolerance for performing pick operation. Tolerance is specified
   * as fraction of rendering window size. (Rendering window size is measured
   * across diagonal.)
   * @param {Number} tolerance The tolerance value.
   */
  setTolerance(tolerance: number): boolean;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkRenderer characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IPickerInitialValues} [initialValues]
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IPickerInitialValues
): void;

/**
 * Method use to create a new instance of vtkPicker with its focal point at the origin,
 * and position=(0,0,1). The view up is along the y-axis, view angle is 30 degrees,
 * and the clipping range is (.1,1000).
 * @param {IPickerInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IPickerInitialValues): vtkPicker;

/**
 * vtkPicker is used to select instances of vtkProp3D by shooting
 * a ray into a graphics window and intersecting with the actor's bounding box.
 * The ray is defined from a point defined in window (or pixel) coordinates,
 * and a point located from the camera's position.
 *
 * vtkPicker may return more than one vtkProp3D, since more than one bounding box may be intersected.
 * vtkPicker returns an unsorted list of props that were hit, and a list of the corresponding world points of the hits.
 * For the vtkProp3D that is closest to the camera, vtkPicker returns the pick coordinates in world and untransformed mapper space,
 * the prop itself, the data set, and the mapper.
 * For vtkPicker the closest prop is the one whose center point (i.e., center of bounding box) projected on the view ray is closest
 * to the camera. Subclasses of vtkPicker use other methods for computing the pick point.
 *
 * vtkPicker is used for quick geometric picking. If you desire more precise
 * picking of points or cells based on the geometry of any vtkProp3D, use the
 * subclasses vtkPointPicker or vtkCellPicker.  For hardware-accelerated
 * picking of any type of vtkProp, use vtkPropPicker or vtkWorldPointPicker.
 *
 * Note that only vtkProp3D's can be picked by vtkPicker.
 */
export declare const vtkPicker: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkPicker;
