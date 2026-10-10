import { Nullable, Vector3 } from '../../../types';
import vtkGlyphRepresentation, {
  IGlyphRepresentationInitialValues,
} from '../GlyphRepresentation';

export interface ILineHandleRepresentationInitialValues extends IGlyphRepresentationInitialValues {
  infiniteLine?: boolean;
  glyphResolution?: number;
  /**
   * Initial angle of the cylinder glyph, in radians. Only read when building
   * the glyph.
   * @default Math.PI / 4
   */
  glyphAngle?: number;
  holeWidth?: number;
}

export interface vtkLineHandleRepresentation extends vtkGlyphRepresentation {
  /** When true, the lines are scaled up so that they look infinite. */
  getInfiniteLine(): boolean;
  setInfiniteLine(infiniteLine: boolean): boolean;

  /** Number of sides of the cylinder used as glyph. */
  getGlyphResolution(): number;
  /**
   * Sets the resolution on the model and on the cylinder glyph. Returns the
   * result of each chained setter.
   */
  setGlyphResolution(glyphResolution: number): boolean[];

  /**
   * Width of the gap left at the origin of each line. The line is split in two
   * halves pushed away from the origin by half this width. When
   * `scaleInPixels` is on, the width is expressed in pixels.
   */
  getHoleWidth(): number;
  setHoleWidth(holeWidth: number): boolean;

  /**
   * Set a callback called with the display coordinates of the active states,
   * or with no argument when no state is active.
   */
  setDisplayCallback(callback: Nullable<(coords?: Vector3[]) => void>): void;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkLineHandleRepresentation characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ILineHandleRepresentationInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ILineHandleRepresentationInitialValues
): void;

export function newInstance(
  initialValues?: ILineHandleRepresentationInitialValues
): vtkLineHandleRepresentation;

/**
 * vtkLineHandleRepresentation renders a cylinder per state, optionally
 * infinite and optionally split in two halves separated by `holeWidth`.
 */
export declare const vtkLineHandleRepresentation: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkLineHandleRepresentation;
