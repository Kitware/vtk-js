import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { Nullable, Vector3 } from '../../../types';
import vtkPlane from '../../../Common/DataModel/Plane';
import { ScalarMode } from './Constants';

/**
 * The type is public; the value is reached through the module default export.
 */
export type { ScalarMode };

/**
 *
 */
export interface IClipClosedSurfaceInitialValues {
  clippingPlanes?: vtkPlane[];
  tolerance?: number;
  passPointData?: boolean;
  triangulatePolys?: boolean;
  scalarMode?: ScalarMode;
  generateOutline?: boolean;
  generateFaces?: boolean;
  activePlaneId?: number;
  baseColor?: Vector3;
  clipColor?: Vector3;
  activePlaneColor?: Vector3;
  triangulationErrorDisplay?: boolean;
}

type vtkClipClosedSurfaceBase = vtkObject & vtkAlgorithm;

export interface vtkClipClosedSurface extends vtkClipClosedSurfaceBase {
  /**
   * Get the planes used to clip the input data.
   */
  getClippingPlanes(): Nullable<vtkPlane[]>;

  /**
   * Get the tolerance used to determine when a point is on the clipping plane.
   */
  getTolerance(): number;

  /**
   * Get whether point data is passed through to the output.
   */
  getPassPointData(): boolean;

  /**
   * Get whether generated triangles are further triangulated.
   */
  getTriangulatePolys(): boolean;

  /**
   * Get the scalar mode used to color the output.
   */
  getScalarMode(): ScalarMode;

  /**
   * Get whether an outline is generated at the cut edges.
   */
  getGenerateOutline(): boolean;

  /**
   * Get whether faces are generated to close the clipped surface.
   */
  getGenerateFaces(): boolean;

  /**
   * Get the id of the active clipping plane.
   */
  getActivePlaneId(): number;

  /**
   * Get whether an error is displayed when triangulation fails.
   */
  getTriangulationErrorDisplay(): boolean;

  /**
   * Get the color used for the faces generated to close the surface.
   */
  getBaseColor(): Vector3;

  /**
   * Get the color used for the faces generated to close the surface.
   */
  getBaseColorByReference(): Vector3;

  /**
   * Get the color used for the region of a cut face that is on the active plane.
   */
  getClipColor(): Vector3;

  /**
   * Get the color used for the region of a cut face that is on the active plane.
   */
  getClipColorByReference(): Vector3;

  /**
   * Get the color used for the active plane's cut face when it differs from the other cut faces.
   */
  getActivePlaneColor(): Vector3;

  /**
   * Get the color used for the active plane's cut face when it differs from the other cut faces.
   */
  getActivePlaneColorByReference(): Vector3;

  /**
   *
   * @param {any} inData
   * @param {any} outData
   */
  requestData(inData: any, outData: any): void;

  /**
   * Set the planes used to clip the input data.
   * @param clippingPlanes
   */
  setClippingPlanes(clippingPlanes: vtkPlane[]): boolean;

  /**
   * Set the tolerance used to determine when a point is on the clipping plane.
   * @param tolerance
   */
  setTolerance(tolerance: number): boolean;

  /**
   * Set whether point data is passed through to the output.
   * @param passPointData
   */
  setPassPointData(passPointData: boolean): boolean;

  /**
   * Set whether generated triangles are further triangulated.
   * @param triangulatePolys
   */
  setTriangulatePolys(triangulatePolys: boolean): boolean;

  /**
   * Set the scalar mode used to color the output.
   * @param scalarMode
   */
  setScalarMode(scalarMode: ScalarMode): boolean;

  /**
   * Set scalarMode to NONE.
   */
  setScalarModeToNone(): void;

  /**
   * Set scalarMode to COLORS.
   */
  setScalarModeToColors(): void;

  /**
   * Set scalarMode to LABELS.
   */
  setScalarModeToLabels(): void;

  /**
   * Set whether an outline is generated at the cut edges.
   * @param generateOutline
   */
  setGenerateOutline(generateOutline: boolean): boolean;

  /**
   * Set whether faces are generated to close the clipped surface.
   * @param generateFaces
   */
  setGenerateFaces(generateFaces: boolean): boolean;

  /**
   * Set the id of the active clipping plane.
   * @param activePlaneId
   */
  setActivePlaneId(activePlaneId: number): boolean;

  /**
   * Set whether an error is displayed when triangulation fails.
   * @param triangulationErrorDisplay
   */
  setTriangulationErrorDisplay(triangulationErrorDisplay: boolean): boolean;

  /**
   * Set the color used for the faces generated to close the surface.
   * @param x
   * @param y
   * @param z
   */
  setBaseColor(x: number, y: number, z: number): boolean;

  /**
   * Set the color used for the faces generated to close the surface.
   * @param baseColor
   */
  setBaseColorFrom(baseColor: Vector3): void;

  /**
   * Set the color used for the region of a cut face that is on the active plane.
   * @param x
   * @param y
   * @param z
   */
  setClipColor(x: number, y: number, z: number): boolean;

  /**
   * Set the color used for the region of a cut face that is on the active plane.
   * @param clipColor
   */
  setClipColorFrom(clipColor: Vector3): void;

  /**
   * Set the color used for the active plane's cut face when it differs from the other cut faces.
   * @param x
   * @param y
   * @param z
   */
  setActivePlaneColor(x: number, y: number, z: number): boolean;

  /**
   * Set the color used for the active plane's cut face when it differs from the other cut faces.
   * @param activePlaneColor
   */
  setActivePlaneColorFrom(activePlaneColor: Vector3): void;
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

/**
 * Method use to decorate a given object (publicAPI+model) with vtkClipClosedSurface characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {object} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IClipClosedSurfaceInitialValues
): void;

// ----------------------------------------------------------------------------

/**
 * Method use to create a new instance of vtkClipClosedSurface
 * @param {IClipClosedSurfaceInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IClipClosedSurfaceInitialValues
): vtkClipClosedSurface;

/**
 * vtkClipClosedSurface
 */
export declare const vtkClipClosedSurface: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  // constants
  ScalarMode: typeof ScalarMode;
};

export default vtkClipClosedSurface;
