import vtkGlyphRepresentation, {
  IGlyphRepresentationInitialValues,
} from '../GlyphRepresentation';

export interface ISphereContextRepresentationInitialValues extends IGlyphRepresentationInitialValues {
  glyphResolution?: number;
  drawBorder?: boolean;
  drawFace?: boolean;
}

export interface vtkSphereContextRepresentation extends vtkGlyphRepresentation {
  /** Phi and theta resolution of the sphere glyph. */
  getGlyphResolution(): number;
  /**
   * Sets the resolution on the model and on the sphere glyph. Returns the
   * result of each chained setter.
   */
  setGlyphResolution(glyphResolution: number): boolean[];

  /** Whether the wireframe of the sphere is rendered. */
  setDrawBorder(drawBorder: boolean): void;

  /** Whether the faces of the sphere are rendered. */
  setDrawFace(drawFace: boolean): void;

  /** Sets the opacity of the actor property. */
  setOpacity(opacity: number): void;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkSphereContextRepresentation characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ISphereContextRepresentationInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ISphereContextRepresentationInitialValues
): void;

export function newInstance(
  initialValues?: ISphereContextRepresentationInitialValues
): vtkSphereContextRepresentation;

/**
 * vtkSphereContextRepresentation renders a semi transparent sphere per state.
 */
export declare const vtkSphereContextRepresentation: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkSphereContextRepresentation;
