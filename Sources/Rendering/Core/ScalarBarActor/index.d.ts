import { vtkObject } from '../../../interfaces';
import vtkScalarsToColors from '../../../Common/Core/ScalarsToColors';
import { Nullable, Range, Size, Vector2, Vector3 } from '../../../types';
import vtkActor, { IActorInitialValues } from '../Actor';
import vtkCamera from '../Camera';
import { Orientation } from './Constants';

export type { Orientation };

export interface ITextSizes {
  titleWidth: number;
  titleHeight: number;
  tickWidth: number;
  tickHeight: number;
}

export interface IResult {
  ptIdx: number;
  cellIdx: number;
  polys: Uint16Array;
  points: Float64Array;
  tcoords: Float32Array;
}

export interface IStyle {
  fontColor?: string;
  fontStyle?: string;
  fontFamily?: string;
  fontSize?: number | string;
}

/**
 *
 */
export interface IScalarBarActorInitialValues extends Omit<
  IActorInitialValues,
  'orientation'
> {
  automated?: boolean;
  autoLayout?: (helper: vtkScalarBarActorHelper) => void;
  axisLabel?: string;
  barPosition?: Vector2;
  barSize?: Size;
  boxPosition?: Vector2;
  boxSize?: Size;
  scalarToColors?: null;
  axisTitlePixelOffset?: number;
  axisTextStyle?: IStyle;
  tickLabelPixelOffset?: number;
  tickTextStyle?: IStyle;
  generateTicks?: (helper: vtkScalarBarActorHelper) => void;
  drawBelowRangeSwatch?: boolean;
  drawAboveRangeSwatch?: boolean;
  drawNanAnnotation?: boolean;
  orientation?: Orientation | null;
}

export interface vtkScalarBarActor extends Omit<
  vtkActor,
  'getOrientation' | 'setOrientation'
> {
  /**
   *
   */
  getActors(): vtkActor[];

  /**
   *
   */
  getAutoLayout(): (helper: vtkScalarBarActorHelper) => void;

  /**
   *
   */
  getGenerateTicks(): (helper: vtkScalarBarActorHelper) => void;

  /**
   *
   */
  getAutomated(): boolean;

  /**
   *
   */
  getAxisLabel(): string;

  /**
   *
   */
  getAxisTextStyle(): IStyle;

  /**
   *
   */
  getAxisTitlePixelOffset(): number;

  /**
   *
   */
  getBoxPosition(): Vector2;

  /**
   *
   */
  getBoxPositionByReference(): Vector2;

  /**
   *
   */
  getBoxSize(): Size;

  /**
   *
   */
  getBoxSizeByReference(): Size;

  /**
   *
   */
  getBarPosition(): Vector2;

  /**
   *
   */
  getBarPositionByReference(): Vector2;

  /**
   *
   */
  getBarSize(): Size;

  /**
   *
   */
  getBarSizeByReference(): Size;

  /**
   *
   */
  getNestedProps(): vtkActor[];

  /**
   *
   */
  getScalarsToColors(): vtkScalarsToColors;

  /**
   *
   */
  getDrawNanAnnotation(): boolean;

  /**
   *
   */
  getDrawBelowRangeSwatch(): boolean;

  /**
   *
   */
  getDrawAboveRangeSwatch(): boolean;

  /**
   *
   */
  getTickLabelPixelOffset(): number;

  /**
   *
   */
  getTickTextStyle(): IStyle;

  /**
   *
   */
  resetAutoLayoutToDefault(): void;

  /**
   *
   */
  resetGenerateTicksToDefault(): void;

  /**
   *
   * @param autoLayout
   */
  setAutoLayout(autoLayout: (helper: vtkScalarBarActorHelper) => void): boolean;

  /**
   * Sets the function used to generate legend ticks.
   *
   * This function takes a vtkScalarBarActorHelper and returns true on success.
   * To have the desired effect, the function must call: `helper.setTicks(ticks: num[])` and `helper.setTickStrings(tickStrings: string[])`.
   *
   * After setting the generateTicks function you must regenerate the vtkScalarBarActor for your changes to take effect.
   * One way to do that is:
   * ```
   *  const mapper = scalarBarActor.getMapper()
   *  if (mapper) {
   *    mapper.getLookupTable().resetAnnotations()
   *  }
   * ```
   * @param generateTicks
   */
  setGenerateTicks(
    generateTicks: (helper: vtkScalarBarActorHelper) => void
  ): boolean;

  /**
   *
   * @param {Boolean} automated
   */
  setAutomated(automated: boolean): boolean;

  /**
   *
   * @param {String} axisLabel
   */
  setAxisLabel(axisLabel: string): boolean;

  /**
   *
   * @param {IStyle} axisTextStyle
   */
  setAxisTextStyle(axisTextStyle: IStyle): void;

  /**
   * Get the current bar orientation setting
   */
  getOrientation(): Orientation | null;

  /**
   * Forces the scalar bar to use horizontal orientation regardless of aspect ratio
   */
  setOrientationToHorizontal(): boolean;

  /**
   * Forces the scalar bar to use vertical orientation regardless of aspect ratio
   */
  setOrientationToVertical(): boolean;

  /**
   * Set the orientation of the scalar bar
   * @param orientation 'horizontal' to force horizontal, 'vertical' to force vertical, or null/undefined for auto
   */
  setOrientation(orientation: Orientation | null): boolean;

  /**
   *
   * @param {Number} axisTitlePixelOffset
   */
  setAxisTitlePixelOffset(axisTitlePixelOffset: number): boolean;

  /**
   *
   * @param {Vector2} boxPosition
   */
  setBoxPosition(boxPosition: Vector2): boolean;

  /**
   *
   * @param {Vector2} boxPosition
   */
  setBoxPositionFrom(boxPosition: Vector2): void;

  /**
   *
   * @param {Size} boxSize
   */
  setBoxSize(boxSize: Size): boolean;

  /**
   *
   * @param {Size} boxSize
   */
  setBoxSizeFrom(boxSize: Size): void;

  /**
   *
   * @param {Vector2} barPosition
   */
  setBarPosition(barPosition: Vector2): boolean;

  /**
   *
   * @param {Vector2} barPosition
   */
  setBarPositionFrom(barPosition: Vector2): void;

  /**
   *
   * @param {Size} barSize
   */
  setBarSize(barSize: Size): boolean;

  /**
   *
   * @param {Size} barSize
   */
  setBarSizeFrom(barSize: Size): void;

  /**
   *
   * @param {vtkScalarsToColors} scalarsToColors
   */
  setScalarsToColors(scalarsToColors: vtkScalarsToColors): boolean;

  /**
   * Set whether the NaN annotation should be rendered or not.
   * @param {Boolean} drawNanAnnotation
   */
  setDrawNanAnnotation(drawNanAnnotation: boolean): boolean;

  /**
   * Set whether the Below range swatch should be rendered or not
   * @param {Boolean} drawBelowRangeSwatch
   */
  setDrawBelowRangeSwatch(drawBelowRangeSwatch: boolean): boolean;

  /**
   * Set whether the Above range swatch should be rendered or not
   * @param {Boolean} drawAboveRangeSwatch
   */
  setDrawAboveRangeSwatch(drawAboveRangeSwatch: boolean): boolean;

  /**
   *
   * @param tickLabelPixelOffset
   */
  setTickLabelPixelOffset(tickLabelPixelOffset: number): boolean;

  /**
   *
   * @param {IStyle} tickStyle
   */
  setTickTextStyle(tickStyle: IStyle): void;

  /**
   *
   */
  setVisibility(visibility: boolean): boolean;
}

export interface IScalarBarActorHelperInitialValues {
  renderable?: Nullable<vtkScalarBarActor>;
}

/**
 * View dependent half of vtkScalarBarActor.
 *
 * One helper is instantiated per API specific view, and holds the properties
 * that depend on view specific values such as the view resolution. API
 * specific views (vtkOpenGLScalarBarActor, vtkWebGPUScalarBarActor) delegate
 * most of their work to it.
 */
export interface vtkScalarBarActorHelper extends vtkObject {
  /**
   * Get the actor drawing the colored bar segments.
   */
  getBarActor(): vtkActor;

  /**
   * Get the actor drawing the text label quads.
   */
  getTmActor(): vtkActor;

  /**
   *
   */
  getAxisTextStyle(): IStyle;

  /**
   *
   */
  getTickTextStyle(): IStyle;

  /**
   * Pixel offset between the bar and the axis title, as used for this view.
   */
  getAxisTitlePixelOffset(): number;

  /**
   * Pixel offset between the bar and the axis title, as used for this view.
   * @param {Number} axisTitlePixelOffset
   */
  setAxisTitlePixelOffset(axisTitlePixelOffset: number): boolean;

  /**
   * Pixel offset between the bar and the tick labels, as used for this view.
   */
  getTickLabelPixelOffset(): number;

  /**
   * Pixel offset between the bar and the tick labels, as used for this view.
   * @param {Number} tickLabelPixelOffset
   */
  setTickLabelPixelOffset(tickLabelPixelOffset: number): boolean;

  /**
   * Get the actor this helper renders for.
   */
  getRenderable(): Nullable<vtkScalarBarActor>;

  /**
   * Bind this helper to an actor. Rebinds the internal actors' property,
   * parent prop and coordinate system, and copies the actor's text styles.
   * @param {vtkScalarBarActor} renderable
   */
  setRenderable(renderable: vtkScalarBarActor): void;

  /**
   * Whether the axis title is drawn above the bar rather than beside it.
   */
  getTopTitle(): boolean;

  /**
   * Whether the axis title is drawn above the bar rather than beside it.
   * @param {Boolean} topTitle
   */
  setTopTitle(topTitle: boolean): boolean;

  /**
   * The scalar values the ticks are drawn at.
   */
  getTicks(): number[];

  /**
   * The scalar values the ticks are drawn at.
   * @param {Number[]} ticks
   */
  setTicks(ticks: number[]): boolean;

  /**
   * The label drawn for each entry of `getTicks()`.
   */
  getTickStrings(): string[];

  /**
   * The label drawn for each entry of `getTicks()`.
   * @param {String[]} tickStrings
   */
  setTickStrings(tickStrings: string[]): boolean;

  /**
   * Normalized position along the tick segment for each tick. When unset, the
   * position is derived from the tick value and the mapping range.
   */
  getTickPositions(): number[] | undefined;

  /**
   * Normalized position along the tick segment for each tick.
   * @param {Number[]} tickPositions
   */
  setTickPositions(tickPositions: number[]): boolean;

  /**
   * The view size in pixels recorded at the last `updateAPISpecificData()`.
   */
  getLastSize(): Vector2;

  /**
   * The view aspect ratio recorded at the last `updateAPISpecificData()`.
   */
  getLastAspectRatio(): number;

  /**
   * The scalar range the bar was last built for.
   */
  getLastTickBounds(): Range;

  /**
   * Position of the box the bar and its labels are laid out in, in normalized
   * viewport coordinates.
   */
  getBoxPosition(): Vector2;

  /**
   *
   */
  getBoxPositionByReference(): Vector2;

  /**
   *
   * @param {Vector2} boxPosition
   */
  setBoxPosition(boxPosition: Vector2): boolean;

  /**
   *
   * @param {Vector2} boxPosition
   */
  setBoxPositionFrom(boxPosition: Vector2): void;

  /**
   * Size of the box the bar and its labels are laid out in, in normalized
   * viewport coordinates.
   */
  getBoxSize(): Size;

  /**
   *
   */
  getBoxSizeByReference(): Size;

  /**
   *
   * @param {Size} boxSize
   */
  setBoxSize(boxSize: Size): boolean;

  /**
   *
   * @param {Size} boxSize
   */
  setBoxSizeFrom(boxSize: Size): void;

  /**
   * Record the view resolution, camera and render window, and rebuild the
   * texture atlas, bar segments and polydata when anything they depend on has
   * changed.
   * @param {Vector2} size the view size in pixels
   * @param {vtkCamera} camera
   * @param renderWindow
   */
  updateAPISpecificData(
    size: Vector2,
    camera: vtkCamera,
    renderWindow: unknown
  ): void;

  /**
   * Render every label into the texture atlas and return the resulting text
   * measurements. Only needs to be called when the strings change.
   */
  updateTextureAtlas(): ITextSizes;

  /**
   * Compute the bar position and size within the box, and return the size of a
   * single bar segment in normalized bar coordinates.
   * @param {ITextSizes} textSizes
   */
  computeBarSize(textSizes: ITextSizes): Vector2;

  /**
   * Rebuild the bar segments (NaN, Below, ticks, Above) from the current
   * settings.
   * @param {ITextSizes} textSizes
   */
  recomputeBarSegments(textSizes: ITextSizes): void;

  /**
   * Append the quad for a single label to `results`, advancing its point and
   * cell indices. Does nothing when the text is absent from the texture atlas.
   * @param {String} text
   * @param {Vector3} pos anchor point in normalized viewport coordinates
   * @param alignment horizontal and vertical anchoring of the text
   * @param orientation text orientation
   * @param {Vector2} offset pixel offset applied to the anchor point
   * @param {IResult} results accumulator that is mutated in place
   */
  createPolyDataForOneLabel(
    text: string,
    pos: Vector3,
    alignment: ['left' | 'middle' | 'right', 'bottom' | 'middle' | 'top'],
    orientation: 'horizontal' | 'vertical',
    offset: Vector2,
    results: IResult
  ): void;

  /**
   * Rebuild the polydata holding the label quads and their texture
   * coordinates.
   */
  updatePolyDataForLabels(): void;

  /**
   * Rebuild the polydata holding the colored bar segments.
   */
  updatePolyDataForBarSegments(): void;
}

/**
 * Create a view dependent helper for a vtkScalarBarActor.
 * @param {IScalarBarActorHelperInitialValues} [initialValues] for pre-setting some of its content
 */
declare function newScalarBarActorHelper(
  initialValues?: IScalarBarActorHelperInitialValues
): vtkScalarBarActorHelper;

/**
 * Method use to decorate a given object (publicAPI+model) with vtkScalarBarActor characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IScalarBarActorInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IScalarBarActorInitialValues
): void;

/**
 * Method use to create a new instance of vtkScalarBarActor
 */
export function newInstance(
  initialValues?: IScalarBarActorInitialValues
): vtkScalarBarActor;

/**
 * vtkScalarBarActor creates a scalar bar with tick marks. A
 * scalar bar is a legend that indicates to the viewer the correspondence
 * between color value and data value. The legend consists of a rectangular bar
 * made of rectangular pieces each colored a constant value. Since
 * vtkScalarBarActor is a subclass of vtkActor2D, it is drawn in the image plane
 * (i.e., in the renderer's viewport) on top of the 3D graphics window.
 */
export declare const vtkScalarBarActor: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  newScalarBarActorHelper: typeof newScalarBarActorHelper;
  Orientation: typeof Orientation;
};
export default vtkScalarBarActor;
