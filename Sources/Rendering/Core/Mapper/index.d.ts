import { Bounds, Nullable } from '../../../types';
import {
  vtkAbstractMapper3D,
  IAbstractMapper3DInitialValues,
} from '../AbstractMapper3D';
import { ColorMode, GetArray, ScalarMode } from './Constants';
import {
  CoincidentTopologyHelper,
  StaticCoincidentTopologyMethods,
} from './CoincidentTopologyHelper';
import {
  IScalarColoring,
  IScalarColoringInitialValues,
} from './ScalarColoringHelper';

export interface IPrimitiveCount {
  points: number;
  verts: number;
  lines: number;
  triangles: number;
}

export interface ISelectionWebGLIdsToVTKIds {
  points: Int32Array | null;
  cells: Int32Array | null;
}

export interface IMapperInitialValues
  extends IAbstractMapper3DInitialValues, IScalarColoringInitialValues {
  static?: boolean;
  renderTime?: number;
  forceCompileOnly?: number;
  useInvertibleColors?: boolean;
  customShaderAttributes?: any;
}

export interface vtkMapper
  extends vtkAbstractMapper3D, CoincidentTopologyHelper, IScalarColoring {
  /**
   *
   */
  acquireInvertibleLookupTable(): void;

  /**
   *
   */
  clearInvertibleColor(): void;

  /**
   *
   */
  colorToValue(): void;

  /**
   * Get the bounds for this mapper as [xmin, xmax, ymin, ymax,zmin, zmax].
   * @return {Bounds} The bounds for the mapper.
   */
  getBounds(): Bounds;

  /**
   *
   * @default []
   */
  getCustomShaderAttributes(): any;

  /**
   * Check if the mapper does not expect to have translucent geometry. This
   * may happen when using ColorMode is set to not map scalars i.e. render the
   * scalar array directly as colors and the scalar array has opacity i.e. alpha
   * component. Default implementation simply returns true. Note that even if
   * this method returns true, an actor may treat the geometry as translucent
   * since a constant translucency is set on the property, for example.
   */
  getIsOpaque(): boolean;

  /**
   *
   */
  getPrimitiveCount(): IPrimitiveCount;

  /**
   * Get whether selection ID mappings should be populated.
   */
  getPopulateSelectionSettings(): boolean;

  /**
   * Get the time required for the last render.
   */
  getRenderTime(): number;

  /**
   * Get the mapping from WebGL selection IDs to VTK point and cell IDs.
   */
  getSelectionWebGLIdsToVTKIds(): ISelectionWebGLIdsToVTKIds | null;

  /**
   * Check whether the mapper’s data is static.
   * @default false
   */
  getStatic(): boolean;

  /**
   *
   * @default null
   */
  getViewSpecificProperties(): object;

  /**
   * Convert selector pixel buffers from WebGL IDs to VTK IDs.
   */
  processSelectorPixelBuffers(selector: any, pixelOffsets: number[]): void;

  /**
   * Sets point data array names that will be transferred to the VBO
   * @param {String[]} customShaderAttributes
   */
  setCustomShaderAttributes(customShaderAttributes: string[]): boolean;

  /**
   *
   * @param {Number} forceCompileOnly
   * @default 0
   */
  setForceCompileOnly(forceCompileOnly: number): boolean;

  /**
   * Set whether selection ID mappings should be populated.
   */
  setPopulateSelectionSettings(populateSelectionSettings: boolean): boolean;

  /**
   * Set the time required for the last render.
   */
  setRenderTime(renderTime: number): boolean;

  /**
   * Set the mapping from WebGL selection IDs to VTK point and cell IDs.
   */
  setSelectionWebGLIdsToVTKIds(
    selectionWebGLIdsToVTKIds: Nullable<ISelectionWebGLIdsToVTKIds>
  ): void;

  /**
   * Turn on/off flag to control whether the mapper’s data is static. Static data
   * means that the mapper does not propagate updates down the pipeline, greatly
   * decreasing the time it takes to update many mappers. This should only be
   * used if the data never changes.
   *
   * @param {Boolean} static
   * @default false
   */
  setStatic(static: boolean): boolean;

  /**
   * If you want to provide specific properties for rendering engines you can use
   * viewSpecificProperties.
   *
   * You can go and have a look in the rendering backend of your choice for details
   * on specific properties.
   * For example, for OpenGL/WebGL see OpenGL/PolyDataMapper/api.md
   * If there is no details, viewSpecificProperties is not supported.
   * @param viewSpecificProperties
   */
  setViewSpecificProperties(viewSpecificProperties: object): boolean;

  /**
   *
   */
  useInvertibleColorFor(): void;

  /**
   *
   */
  valueToColor(): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IMapperInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IMapperInitialValues
): void;

/**
 * Method used to create a new instance of vtkMapper
 * @param {IMapperInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IMapperInitialValues): vtkMapper;

/**
 * vtkMapper is an abstract class to specify interface between data and
 * graphics primitives. Subclasses of vtkMapper map data through a
 * lookuptable and control the creation of rendering primitives that
 * interface to the graphics library. The mapping can be controlled by
 * supplying a lookup table and specifying a scalar range to map data
 * through.
 *
 * There are several important control mechanisms affecting the behavior of
 * this object. The ScalarVisibility flag controls whether scalar data (if
 * any) controls the color of the associated actor(s) that refer to the
 * mapper. The ScalarMode ivar is used to determine whether scalar point data
 * or cell data is used to color the object. By default, point data scalars
 * are used unless there are none, then cell scalars are used. Or you can
 * explicitly control whether to use point or cell scalar data. Finally, the
 * mapping of scalars through the lookup table varies depending on the
 * setting of the ColorMode flag. See the documentation for the appropriate
 * methods for an explanation.
 *
 * Another important feature of this class is whether to use immediate mode
 * rendering (ImmediateModeRenderingOn) or display list rendering
 * (ImmediateModeRenderingOff). If display lists are used, a data structure
 * is constructed (generally in the rendering library) which can then be
 * rapidly traversed and rendered by the rendering library. The disadvantage
 * of display lists is that they require additional memory which may affect
 * the performance of the system.
 *
 * Another important feature of the mapper is the ability to shift the
 * Z-buffer to resolve coincident topology. For example, if you’d like to
 * draw a mesh with some edges a different color, and the edges lie on the
 * mesh, this feature can be useful to get nice looking lines. (See the
 * ResolveCoincidentTopology-related methods.)
 */
export declare const vtkMapper: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  ColorMode: typeof ColorMode;
  ScalarMode: typeof ScalarMode;
  GetArray: typeof GetArray;
} & StaticCoincidentTopologyMethods;
export default vtkMapper;
