import vtkGlyphRepresentation, {
  IGlyphRepresentationInitialValues,
} from '../GlyphRepresentation';

export interface ICubeHandleRepresentationInitialValues extends IGlyphRepresentationInitialValues {}

export interface vtkCubeHandleRepresentation extends vtkGlyphRepresentation {}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkCubeHandleRepresentation characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ICubeHandleRepresentationInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ICubeHandleRepresentationInitialValues
): void;

export function newInstance(
  initialValues?: ICubeHandleRepresentationInitialValues
): vtkCubeHandleRepresentation;

/**
 * vtkCubeHandleRepresentation is a vtkGlyphRepresentation using a
 * vtkCubeSource as glyph.
 */
export declare const vtkCubeHandleRepresentation: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkCubeHandleRepresentation;
