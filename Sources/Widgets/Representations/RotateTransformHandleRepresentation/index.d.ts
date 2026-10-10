import vtkGlyphRepresentation, {
  IGlyphRepresentationInitialValues,
} from '../GlyphRepresentation';

export interface IRotateTransformHandleRepresentationInitialValues extends IGlyphRepresentationInitialValues {}

export interface vtkRotateTransformHandleRepresentation extends vtkGlyphRepresentation {}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkRotateTransformHandleRepresentation characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IRotateTransformHandleRepresentationInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IRotateTransformHandleRepresentationInitialValues
): void;

export function newInstance(
  initialValues?: IRotateTransformHandleRepresentationInitialValues
): vtkRotateTransformHandleRepresentation;

/**
 * vtkRotateTransformHandleRepresentation is a vtkGlyphRepresentation using a
 * vtkTorusSource as glyph.
 */
export declare const vtkRotateTransformHandleRepresentation: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkRotateTransformHandleRepresentation;
