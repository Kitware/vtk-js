import vtkGlyphRepresentation, {
  IGlyphRepresentationInitialValues,
} from '../GlyphRepresentation';

export interface ICircleContextRepresentationInitialValues extends IGlyphRepresentationInitialValues {
  glyphResolution?: number;
  drawBorder?: boolean;
  drawFace?: boolean;
}

export interface vtkCircleContextRepresentation extends vtkGlyphRepresentation {
  /** Number of segments of the circle. */
  getGlyphResolution(): number;
  setGlyphResolution(glyphResolution: number): boolean;

  /** Whether the outline of the circle is rendered. */
  getDrawBorder(): boolean;
  setDrawBorder(drawBorder: boolean): boolean;

  /** Whether the interior of the circle is rendered. */
  getDrawFace(): boolean;
  setDrawFace(drawFace: boolean): boolean;

  /** Sets the opacity of the actor property. */
  setOpacity(opacity: number): void;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkCircleContextRepresentation characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ICircleContextRepresentationInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ICircleContextRepresentationInitialValues
): void;

export function newInstance(
  initialValues?: ICircleContextRepresentationInitialValues
): vtkCircleContextRepresentation;

/**
 * vtkCircleContextRepresentation renders a semi transparent circle per state,
 * offset in depth so that it does not fight with coincident geometry.
 */
export declare const vtkCircleContextRepresentation: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkCircleContextRepresentation;
