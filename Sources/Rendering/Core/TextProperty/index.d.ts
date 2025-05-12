import { RGBColor } from '../../../types';
import vtkProperty2D, { IProperty2DInitialValues } from '../Property2D';

export interface ITextPropertyInitialValues extends IProperty2DInitialValues {
  backgroundColor?: RGBColor;
  fillStyle?: string;
  fontColor?: RGBColor;
  fontFamily?: string;
  fontSizeScale?: (resolution: number) => number;
  fontStyle?: string;
  resolution?: number;
  shadowBlur?: number;
  shadowColor?: RGBColor;
  shadowOffset?: [number, number];
}

export interface vtkTextProperty extends vtkProperty2D {
  /**
   * Get the background color.
   */
  getBackgroundColor(): RGBColor;

  /**
   * Get the background color by reference.
   */
  getBackgroundColorByReference(): RGBColor;

  /**
   * Get the fill style.
   */
  getFillStyle(): string;

  /**
   * Get the font color.
   */
  getFontColor(): RGBColor;

  /**
   * Get the font color by reference.
   */
  getFontColorByReference(): RGBColor;

  /**
   * Get the font family.
   */
  getFontFamily(): string;

  /**
   * Get the font size scale.
   */
  getFontSizeScale(): (resolution: number) => number;

  /**
   * Get the font style.
   */
  getFontStyle(): string;

  /**
   * Get the resolution.
   */
  getResolution(): number;

  /**
   * Get the shadow blur radius.
   */
  getShadowBlur(): number;

  /**
   * Get the shadow color.
   */
  getShadowColor(): RGBColor;

  /**
   * Get the shadow color by reference.
   */
  getShadowColorByReference(): RGBColor;

  /**
   * Get the shadow offset.
   */
  getShadowOffset(): [number, number];

  /**
   * Get the shadow offset by reference.
   */
  getShadowOffsetByReference(): [number, number];

  /**
   * Set the background color.
   * @param {RGBColor} backgroundColor The background color to set.
   */
  setBackgroundColor(backgroundColor: RGBColor): boolean;

  /**
   * Set the fill style.
   * @param {string} fillStyle The fill style to set.
   */
  setFillStyle(fillStyle: string): boolean;

  /**
   * Set the font color from RGB values.
   * @param {number} r Red component (0-255)
   * @param {number} g Green component (0-255)
   * @param {number} b Blue component (0-255)
   */
  setFontColor(r: number, g: number, b: number): boolean;

  /**
   * Set the font color.
   * @param {RGBColor} fontColor The font color to set.
   */
  setFontColorFrom(fontColor: RGBColor): boolean;

  /**
   * Set the font family.
   * @param {string} fontFamily The font family to set.
   */
  setFontFamily(fontFamily: string): boolean;

  /**
   * Set the font size scale.
   * Scales the font size based on the given resolution.
   * Dividing by 1.8 ensures the font size is proportionate and not too large.
   * The value 1.8 is a chosen scaling factor for visual balance.
   * @param {number} resolution The resolution to set.
   */
  setFontSizeScale(resolution: number): number;

  /**
   * Set the font style.
   * @param {string} fontStyle The font style to set.
   */
  setFontStyle(fontStyle: string): boolean;

  /**
   * Set the resolution.
   * @param {number} resolution The resolution to set.
   */
  setResolution(resolution: number): boolean;

  /**
   * Set the shadow blur radius.
   * @param {number} shadowBlur The shadow blur radius to set.
   */
  setShadowBlur(shadowBlur: number): boolean;

  /**
   * Set the shadow color from RGB values.
   * @param {number} r Red component (0-255)
   * @param {number} g Green component (0-255)
   * @param {number} b Blue component (0-255)
   */
  setShadowColor(r: number, g: number, b: number): boolean;

  /**
   * Set the shadow color.
   * @param {RGBColor} shadowColor The shadow color to set.
   */
  setShadowColorFrom(shadowColor: RGBColor): boolean;

  /**
   * Set the shadow offset from x and y values.
   * @param {number} x Horizontal offset
   * @param {number} y Vertical offset
   */
  setShadowOffset(x: number, y: number): boolean;

  /**
   * Set the shadow offset.
   * @param {Array} shadowOffset The shadow offset to set, as an array of [x, y].
   */
  setShadowOffsetFrom(shadowOffset: [number, number]): boolean;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkProperty characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ITextPropertyInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ITextPropertyInitialValues
): void;

/**
 * Method use to create a new instance of vtkTextProperty.
 * @param {ITextPropertyInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: ITextPropertyInitialValues
): vtkTextProperty;

/**
 * vtkTextProperty is an object that represents text properties. The primary
 * properties that can be set are color, opacity, font size, font family
 * horizontal and vertical justification, bold/italic/shadow styles.
 */
export declare const vtkTextProperty: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkTextProperty;
