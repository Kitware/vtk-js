import { IConeSourceInitialValues } from '../../../Filters/Sources/ConeSource';
import vtkGlyphRepresentation, {
  IGlyphRepresentationInitialValues,
} from '../GlyphRepresentation';

export interface ITranslateTransformHandleRepresentationInitialValues extends IGlyphRepresentationInitialValues {
  /**
   * Height of the cylinder joining the two cones.
   * @default 1
   */
  height?: number;
  /**
   * Radius of the cylinder joining the two cones.
   * @default 1
   */
  radius?: number;
  /**
   * Number of sides of the cylinder joining the two cones.
   * @default 12
   */
  glyphResolution?: number;
  /**
   * Initial values of the two vtkConeSource capping the glyph.
   */
  coneSource?: IConeSourceInitialValues;
}

export interface vtkTranslateTransformHandleRepresentation extends vtkGlyphRepresentation {}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkTranslateTransformHandleRepresentation characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ITranslateTransformHandleRepresentationInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ITranslateTransformHandleRepresentationInitialValues
): void;

export function newInstance(
  initialValues?: ITranslateTransformHandleRepresentationInitialValues
): vtkTranslateTransformHandleRepresentation;

/**
 * vtkTranslateTransformHandleRepresentation is a vtkGlyphRepresentation whose
 * glyph is a double headed arrow: a cylinder capped at both ends by a cone.
 */
export declare const vtkTranslateTransformHandleRepresentation: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkTranslateTransformHandleRepresentation;
