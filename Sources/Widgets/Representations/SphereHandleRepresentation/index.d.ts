import { Nullable, Vector3 } from '../../../types';
import vtkGlyphRepresentation, {
  IGlyphRepresentationInitialValues,
} from '../GlyphRepresentation';

export interface ISphereHandleRepresentationInitialValues extends IGlyphRepresentationInitialValues {}

export interface vtkSphereHandleRepresentation extends vtkGlyphRepresentation {
  /** Phi resolution of the sphere glyph. */
  getGlyphResolution(): number;
  /** Sets both the phi and theta resolution of the sphere glyph. */
  setGlyphResolution(glyphResolution: number): boolean;

  /**
   * Set a callback called with the display coordinates of the active states,
   * or with no argument when no state is active.
   */
  setDisplayCallback(callback: Nullable<(coords?: Vector3[]) => void>): void;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkSphereHandleRepresentation characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ISphereHandleRepresentationInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ISphereHandleRepresentationInitialValues
): void;

export function newInstance(
  initialValues?: ISphereHandleRepresentationInitialValues
): vtkSphereHandleRepresentation;

/**
 * vtkSphereHandleRepresentation renders the default sphere glyph of
 * vtkGlyphRepresentation per handle state, and can report the display
 * coordinates of the active handles through a callback.
 */
export declare const vtkSphereHandleRepresentation: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkSphereHandleRepresentation;
