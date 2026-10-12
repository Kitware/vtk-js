import { Matrix, Nullable, Vector2, Vector3 } from '../../../types';
import { ShapeType } from '../../Widgets3D/LineWidget/Constants';
import vtkGlyphRepresentation, {
  IGlyphRepresentationInitialValues,
} from '../GlyphRepresentation';

export interface IArrowHandleRepresentationInitialValues extends IGlyphRepresentationInitialValues {
  /**
   * Whether the glyph should face the camera:
   * - `null`/`undefined` leaves it to the shape type (2D shapes face the
   *   camera, 3D shapes do not)
   * - `true` always faces the camera
   * - `false` never faces the camera
   */
  faceCamera?: Nullable<boolean>;
  orientation?: Vector3;
  /**
   * Shape used when the `shape` mixin of the states is invalid.
   */
  shape?: ShapeType;
  viewMatrix?: Matrix;
}

export interface vtkArrowHandleRepresentation extends vtkGlyphRepresentation {
  getVisibilityFlagArray(): Vector2;
  getVisibilityFlagArrayByReference(): Vector2;
  setVisibilityFlagArray(visibilityFlagArray: Vector2): boolean;
  setVisibilityFlagArray(a: number, b: number): boolean;
  setVisibilityFlagArrayFrom(visibilityFlagArray: Vector2): void;

  /**
   * Direction the glyph is oriented along, for the shapes that are orientable.
   */
  getOrientation(): Vector3;
  getOrientationByReference(): Vector3;
  setOrientation(orientation: Vector3): boolean;
  setOrientation(x: number, y: number, z: number): boolean;
  setOrientationFrom(orientation: Vector3): void;

  /**
   * View matrix used to orient the glyph towards the camera.
   */
  getViewMatrix(): Matrix;
  getViewMatrixByReference(): Matrix;
  setViewMatrix(viewMatrix: Matrix): boolean;
  setViewMatrixFrom(viewMatrix: Matrix): void;

  getFaceCamera(): Nullable<boolean>;
  setFaceCamera(faceCamera: Nullable<boolean>): boolean;

  setGlyphResolution(glyphResolution: number): boolean;

  /**
   * Set a callback called with the display coordinates of the active states,
   * or with no argument when no state is active.
   */
  setDisplayCallback(callback: Nullable<(coords?: Vector3[]) => void>): void;

  /** True when the current shape is a flat shape. */
  is2DShape(): boolean;

  /** True when the current shape can be oriented along `orientation`. */
  isOrientableShape(): boolean;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkArrowHandleRepresentation characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IArrowHandleRepresentationInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IArrowHandleRepresentationInitialValues
): void;

export function newInstance(
  initialValues?: IArrowHandleRepresentationInitialValues
): vtkArrowHandleRepresentation;

/**
 * vtkArrowHandleRepresentation renders one glyph per handle state, the glyph
 * geometry being rebuilt whenever the `shape` mixin of the states changes.
 * Depending on the shape, the glyph is oriented along `orientation` and/or
 * rotated to face the camera.
 */
export declare const vtkArrowHandleRepresentation: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkArrowHandleRepresentation;
