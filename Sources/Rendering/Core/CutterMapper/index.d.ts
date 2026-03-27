import vtkImplicitFunction from '../../../Common/DataModel/ImplicitFunction';
import vtkMapper, { IMapperInitialValues } from '../Mapper';
import { Nullable } from '../../../types';

export interface ICutterMapperInitialValues extends IMapperInitialValues {
  /** Implicit function evaluated by the GPU cut shader. */
  cutFunction?: Nullable<vtkImplicitFunction>;
  /** Offset applied to the implicit function isosurface. */
  cutValue?: number;
  /** Screen-space thickness multiplier for the displayed cut contour. */
  cutWidth?: number;
}

export interface vtkCutterMapper extends vtkMapper {
  /**
   * Returns the current implicit cut function.
   */
  getCutFunction(): Nullable<vtkImplicitFunction>;

  /**
   * Returns the scalar offset applied to the implicit function.
   *
   * For a plane this acts as an additional displacement along the plane normal.
   */
  getCutValue(): number;

  /**
   * Returns the screen-space cut width multiplier used by the shader.
   */
  getCutWidth(): number;

  /**
   * Sets the implicit function used to generate the cut on the GPU.
   *
   * Supported implicit functions are currently plane, sphere, box, cylinder,
   * and cone.
   */
  setCutFunction(cutFunction: Nullable<vtkImplicitFunction>): boolean;

  /**
   * Sets the scalar offset applied to the implicit function.
   *
   * For a plane, changing the plane origin only changes the cut when the
   * displacement has a component along the plane normal. Moving the origin
   * parallel to the plane describes the same plane in 3D, so the cut does not
   * move. `cutValue` can also be used to offset the plane along its normal.
   */
  setCutValue(cutValue: number): boolean;

  /**
   * Sets the screen-space cut width multiplier used by the shader.
   */
  setCutWidth(cutWidth: number): boolean;

  /**
   * Returns the VTK.js class name of the supported implicit function currently in
   * use, or `null` when the cut function is missing or unsupported.
   */
  getSupportedImplicitFunctionName(): Nullable<string>;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkCutterMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ICutterMapperInitialValues} [initialValues] (default: {})
 *
 * @note Scalar visibility is enabled by default. The cut surface is colored by data scalars
 * from the underlying mesh. Call `setScalarVisibility(false)` to use uniform Actor property
 * color instead via `setColor()`.
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ICutterMapperInitialValues
): void;

/**
 * Method used to create a new instance of vtkCutterMapper
 * @param {ICutterMapperInitialValues} initialValues for pre-setting some of its content
 */
export function newInstance(
  initialValues?: ICutterMapperInitialValues
): vtkCutterMapper;

/**
 * vtkCutterMapper renders the zero-isosurface of a supported implicit
 * function on the GPU. Supported implicit functions are currently plane,
 * sphere, box, cylinder, and cone.
 *
 * The mapper generates the cut surface geometry. By default, the cut surface is colored
 * by data scalars from the underlying mesh. For uniform coloring, disable scalar visibility
 * and use the Actor's property color instead.
 *
 * - For a plane, only displacement along the plane normal changes the cut.
 *   Moving the plane origin parallel to the plane still describes the same
 *   plane in 3D, so the cut does not move.
 * - For a sphere, box, cylinder, or cone, translating the center changes the
 *   position of the implicit function, so the cut follows that translation.
 *
 * @example
 * ```javascript
 * const mapper = vtkCutterMapper.newInstance({
 *   cutFunction: plane,
 *   cutValue: 0.0,
 *   cutWidth: 1.5,
 * });
 * mapper.setScalarVisibility(false); // Use uniform color
 * actor.setMapper(mapper);
 * actor.getProperty().setColor(0, 1, 0); // Set cut color to green
 * ```
 */
export declare const vtkCutterMapper: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkCutterMapper;
