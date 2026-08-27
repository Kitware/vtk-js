import vtkPiecewiseFunction from '../../../Common/DataModel/PiecewiseFunction';
import vtkColorTransferFunction from '../../../Rendering/Core/ColorTransferFunction';
import { vtkObject, vtkSubscription } from '../../../interfaces';
import { TypedArray, Vector2 } from '../../../types';

/**
 * A single gaussian of the transfer function.
 */
export interface IGaussian {
  /**
   * Center of the gaussian, normalized in [0, 1] over the data range.
   */
  position: number;

  /**
   * Peak opacity of the gaussian, in [0, 1].
   */
  height: number;

  /**
   * Width of the gaussian, normalized over the data range.
   */
  width: number;

  /**
   * Horizontal bias applied to the gaussian.
   */
  xBias: number;

  /**
   * Vertical bias applied to the gaussian.
   */
  yBias: number;
}

/**
 * A node of the piecewise function produced from the gaussians.
 */
export interface IOpacityNode {
  x: number;
  y: number;
  midpoint: number;
  sharpness: number;
}

export interface IPiecewiseGaussianWidgetStyle {
  backgroundColor?: string;
  histogramColor?: string;
  strokeColor?: string;
  activeColor?: string;
  buttonDisableFillColor?: string;
  buttonDisableStrokeColor?: string;
  buttonStrokeColor?: string;
  buttonFillColor?: string;
  handleColor?: string;
  strokeWidth?: number;
  activeStrokeWidth?: number;
  buttonStrokeWidth?: number;
  handleWidth?: number;
  iconSize?: number;
  padding?: number;
  zoomControlHeight?: number;
  zoomControlColor?: string;
}

/**
 * Options describing how to extract a histogram out of a data array.
 */
export interface ISetDataArrayOptions {
  numberOfBinToConsiders?: number;
  numberOfBinsToSkip?: number;
  numberOfComponents?: number;
  component?: number;
}

/**
 *
 */
export interface IPiecewiseGaussianWidgetInitialValues {
  gaussians?: IGaussian[];
  size?: Vector2;
  numberOfBins?: number;
  piecewiseSize?: number;
  gaussianMinimumHeight?: number;
  colorTransferFunction?: vtkColorTransferFunction;
  backgroundImage?: HTMLImageElement;
  enableRangeZoom?: boolean;
  rangeZoom?: Vector2;
  style?: IPiecewiseGaussianWidgetStyle;
}

export interface vtkPiecewiseGaussianWidget extends vtkObject {
  /**
   * Attach the widget canvas to the given DOM element. Pass `null` to detach.
   */
  setContainer(el: HTMLElement | null): void;

  /**
   * Get the canvas the widget draws onto.
   */
  getCanvas(): HTMLCanvasElement;

  /**
   * Get the widget size, as `[width, height]` in pixels.
   */
  getSize(): Vector2;

  /**
   * Resize the widget.
   */
  setSize(width: number, height: number): void;

  /**
   * Get the gaussians currently defined.
   */
  getGaussians(): IGaussian[];

  /**
   * Replace the gaussians.
   */
  setGaussians(gaussians: IGaussian[]): void;

  /**
   * Append a gaussian.
   *
   * @returns The index of the newly added gaussian.
   */
  addGaussian(
    position: number,
    height: number,
    width: number,
    xBias: number,
    yBias: number
  ): number;

  /**
   * Remove the gaussian at the given index.
   */
  removeGaussian(index: number): void;

  /**
   * Merge the given style into the widget style.
   */
  updateStyle(style: IPiecewiseGaussianWidgetStyle): void;

  /**
   * Compute the histogram displayed behind the gaussians from a data array.
   *
   * The histogram is computed on web workers, so it is not available when this
   * call returns. Observe completion through `onModified`.
   *
   * @param array The values to build the histogram from
   * @param {ISetDataArrayOptions} [options] How to interpret the array
   */
  setDataArray(array: TypedArray, options?: ISetDataArrayOptions): void;

  /**
   * Get the number of bins of the histogram.
   * @default 256
   */
  getNumberOfBins(): number;
  setNumberOfBins(numberOfBins: number): boolean;

  /**
   * Get the number of samples the gaussians are discretized into when building
   * the piecewise function.
   * @default 256
   */
  getPiecewiseSize(): number;
  setPiecewiseSize(piecewiseSize: number): boolean;

  /**
   * Get the minimum height a gaussian may be dragged down to.
   * @default 0.05
   */
  getGaussianMinimumHeight(): number;
  setGaussianMinimumHeight(height: number): boolean;

  /**
   * The color transfer function drawn under the chart. Has no default, so it
   * is undefined until set.
   */
  getColorTransferFunction(): vtkColorTransferFunction | undefined;
  setColorTransferFunction(lut: vtkColorTransferFunction): boolean;

  /**
   * An image drawn as the chart background. Has no default, so it is undefined
   * until set.
   */
  getBackgroundImage(): HTMLImageElement | undefined;
  setBackgroundImage(image: HTMLImageElement): boolean;

  /**
   * Whether the zoom control is shown and usable.
   * @default true
   */
  getEnableRangeZoom(): boolean;
  setEnableRangeZoom(enable: boolean): boolean;

  /**
   * The zoomed sub-range, normalized in [0, 1].
   * @default [0, 1]
   */
  getRangeZoom(): Vector2;
  getRangeZoomByReference(): Vector2;
  setRangeZoom(range: Vector2): boolean;
  setRangeZoom(min: number, max: number): boolean;
  setRangeZoomFrom(rangeZoom: Vector2): void;

  /**
   * Build the piecewise function nodes matching the current gaussians.
   *
   * @param {Vector2} [dataRange] Defaults to the range of the histogram array
   */
  getOpacityNodes(dataRange?: Vector2): IOpacityNode[];

  /**
   * Push the current gaussians onto a piecewise function.
   *
   * @param {vtkPiecewiseFunction} piecewiseFunction The function to update
   * @param {Vector2} [dataRange] Defaults to the range of the histogram array
   */
  applyOpacity(
    piecewiseFunction: vtkPiecewiseFunction,
    dataRange?: Vector2
  ): void;

  /**
   * Get the sub-range over which the opacity is non-zero.
   *
   * @param {Vector2} [dataRange] Defaults to the range of the histogram array
   */
  getOpacityRange(dataRange?: Vector2): Vector2;

  /**
   * Mouse handlers, in canvas coordinates. They are wired to the canvas by
   * `bindMouseListeners`, but are also callable directly.
   */
  onClick(x: number, y: number): boolean;
  onHover(x: number, y: number): boolean;
  onDown(x: number, y: number): boolean;
  onDrag(x: number, y: number): boolean;
  onUp(x: number, y: number): boolean;
  onLeave(x: number, y: number): boolean;
  onAddGaussian(x: number, y: number): boolean;
  onRemoveGaussian(x: number, y: number): boolean;

  /**
   * Redraw the widget.
   */
  render(): void;

  /**
   * Attach the mouse listeners to the canvas. Called automatically by
   * `setContainer`.
   */
  bindMouseListeners(): void;

  /**
   * Detach the mouse listeners from the canvas.
   */
  unbindMouseListeners(): void;

  /**
   * Register a callback invoked whenever the opacity changes.
   */
  onOpacityChange(
    cb: (widget: vtkPiecewiseGaussianWidget, createdGaussian?: boolean) => void
  ): vtkSubscription;
  invokeOpacityChange(
    widget: vtkPiecewiseGaussianWidget,
    createdGaussian?: boolean
  ): void;

  /**
   * Register a callback invoked while a gaussian is being dragged.
   */
  onAnimation(cb: (animating: boolean) => void): vtkSubscription;
  invokeAnimation(animating: boolean): void;

  /**
   * Register a callback invoked whenever the zoomed range changes.
   */
  onZoomChange(cb: (rangeZoom: Vector2) => void): vtkSubscription;
  invokeZoomChange(rangeZoom: Vector2): void;
}

/**
 * Sample the given gaussians and push the resulting nodes onto a piecewise
 * function.
 *
 * @param {IGaussian[]} gaussians The gaussians to sample
 * @param {Number} sampling The number of samples
 * @param {Vector2} rangeToUse The data range the samples are spread over
 * @param {vtkPiecewiseFunction} piecewiseFunction The function to update
 */
declare function applyGaussianToPiecewiseFunction(
  gaussians: IGaussian[],
  sampling: number,
  rangeToUse: Vector2,
  piecewiseFunction: vtkPiecewiseFunction
): void;

/**
 * Sample the given gaussians into an array of opacities.
 */
declare function computeOpacities(
  gaussians: IGaussian[],
  sampling?: number
): number[];

/**
 * Index of the gaussian whose position is closest to `x`.
 */
declare function findGaussian(x: number, gaussians: IGaussian[]): number;

export declare const STATIC: {
  applyGaussianToPiecewiseFunction: typeof applyGaussianToPiecewiseFunction;
  computeOpacities: typeof computeOpacities;
  createListener: (
    callback: (x: number, y: number) => void,
    preventDefault?: boolean
  ) => (e: MouseEvent) => void;
  drawChart: (
    ctx: CanvasRenderingContext2D,
    area: number[],
    values: number[],
    style?: {
      lineWidth?: number;
      strokeStyle?: string;
      fillStyle?: string;
      clip?: boolean;
    }
  ) => void;
  findGaussian: typeof findGaussian;
  listenerSelector: (
    condition: () => boolean,
    ok: (e: Event) => void,
    ko: (e: Event) => void
  ) => (e: Event) => void;
  normalizeCoordinates: (
    x: number,
    y: number,
    subRectangeArea: number[],
    zoomRange?: Vector2
  ) => Vector2;
};

/**
 * Method used to decorate a given object (publicAPI+model) with vtkPiecewiseGaussianWidget characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IPiecewiseGaussianWidgetInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IPiecewiseGaussianWidgetInitialValues
): void;

/**
 * Method used to create a new instance of vtkPiecewiseGaussianWidget
 * @param {IPiecewiseGaussianWidgetInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IPiecewiseGaussianWidgetInitialValues
): vtkPiecewiseGaussianWidget;

/**
 * vtkPiecewiseGaussianWidget is a canvas-based editor that lets the user shape
 * a piecewise opacity function as a sum of gaussians, drawn on top of the
 * histogram of the data being rendered.
 */
declare const vtkPiecewiseGaussianWidget: typeof STATIC & {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkPiecewiseGaussianWidget;
