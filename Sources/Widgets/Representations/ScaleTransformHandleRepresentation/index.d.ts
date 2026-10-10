import { ICubeSourceInitialValues } from '../../../Filters/Sources/CubeSource';
import vtkGlyphRepresentation, {
  IGlyphRepresentationInitialValues,
} from '../GlyphRepresentation';

export interface IScaleTransformHandleRepresentationInitialValues extends IGlyphRepresentationInitialValues {
  /**
   * Height of the cylinder joining the two cubes.
   * @default 1
   */
  height?: number;
  /**
   * Radius of the cylinder joining the two cubes.
   * @default 1
   */
  radius?: number;
  /**
   * Number of sides of the cylinder joining the two cubes.
   * @default 12
   */
  glyphResolution?: number;
  /**
   * Initial values of the two vtkCubeSource capping the glyph.
   */
  cubeSource?: ICubeSourceInitialValues;
}

export interface vtkScaleTransformHandleRepresentation extends vtkGlyphRepresentation {}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkScaleTransformHandleRepresentation characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IScaleTransformHandleRepresentationInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IScaleTransformHandleRepresentationInitialValues
): void;

export function newInstance(
  initialValues?: IScaleTransformHandleRepresentationInitialValues
): vtkScaleTransformHandleRepresentation;

/**
 * vtkScaleTransformHandleRepresentation is a vtkGlyphRepresentation whose
 * glyph is a cylinder capped at both ends by a cube.
 */
export declare const vtkScaleTransformHandleRepresentation: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkScaleTransformHandleRepresentation;
