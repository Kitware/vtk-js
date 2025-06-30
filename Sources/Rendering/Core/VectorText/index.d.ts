import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { Nullable, RGBColor } from '../../../types';

export interface IVectorTextInitialValues {
  fontSize?: number;
  text?: string;
  depth?: number;
  steps?: number;
  bevelEnabled?: boolean;
  curveSegments?: number;
  bevelThickness?: number;
  bevelSize?: number;
  bevelOffset?: number;
  bevelSegments?: number;
  font?: any;
  earcut?: any; // Earcut module for triangulation
  perLetterFaceColors?: (letterIndex: number) => [number, number, number];
}

type vtkVectorTextBase = vtkObject & vtkAlgorithm;

export interface vtkVectorText extends vtkVectorTextBase {
  /**
   * Returns whether beveling is enabled.
   */
  getBevelEnabled(): boolean;

  /**
   * Returns the number of segments used for the bevel geometry.
   */
  getBevelSegments(): number;

  /**
   * Returns the size of the bevel.
   */
  getBevelSize(): number;

  /**
   * Returns the thickness of the bevel.
   */
  getBevelThickness(): number;

  /**
   * Returns the offset of the bevel.
   */
  getBevelOffset(): number;

  /**
   * Returns the number of curve segments used for the text geometry.
   */
  getCurveSegments(): number;

  /**
   * Returns the extrusion depth of the text.
   */
  getDepth(): number;

  /**
   * Returns the current font size.
   */
  getFontSize(): number;

  /**
   * Returns the number of steps used for the text geometry.
   */
  getSteps(): number;

  /**
   * Returns the current text string.
   */
  getText(): string;

  /**
   * Gets or sets the per-letter face color function.
   * @param fn - Function mapping letter index to [r,g,b] color.
   */
  getPerLetterFaceColors(): Nullable<(letterIndex: number) => RGBColor>;

  /**
   * Enables or disables beveling.
   * @param bevelEnabled - True to enable beveling, false to disable.
   */
  setBevelEnabled(bevelEnabled: boolean): boolean;

  /**
   * Sets the number of segments used for the bevel geometry.
   * @param bevelSegments - The number of bevel segments.
   */
  setBevelSegments(bevelSegments: number): boolean;

  /**
   * Sets the size of the bevel.
   * @param bevelSize - The bevel size.
   */
  setBevelSize(bevelSize: number): boolean;

  /**
   * Sets the thickness of the bevel.
   * @param bevelThickness - The bevel thickness.
   */
  setBevelThickness(bevelThickness: number): boolean;

  /**
   * Sets the offset of the bevel.
   * @param bevelOffset - The bevel offset.
   */
  setBevelOffset(bevelOffset: number): boolean;

  /**
   * Sets the number of curve segments used for the text geometry.
   * @param curveSegments - The number of curve segments.
   */
  setCurveSegments(curveSegments: number): boolean;

  /**
   * Sets the extrusion depth of the text.
   * @param depth - The new depth value.
   */
  setDepth(depth: number): boolean;

  /**
   * Sets the font object used for rendering the text.
   * This should be a parsed font object from opentype.js.
   * @param font - The font object.
   */
  setFont(font: any): boolean;

  /**
   * Sets the font size.
   * @param fontSize - The new font size.
   */
  setFontSize(fontSize: number): boolean;

  /**
   * Sets the number of steps used for the text geometry.
   * @param steps - The number of steps.
   */
  setSteps(steps: number): boolean;

  /**
   * Sets the text string.
   * @param text - The new text to display.
   */
  setText(text: string): boolean;

  /**
   * Sets the per-letter face color function.
   * @param fn - Function mapping letter index to [r,g,b] color.
   */
  setPerLetterFaceColors(fn: (letterIndex: number) => RGBColor): boolean;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkVectorText characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IVectorTextInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IVectorTextInitialValues
): void;

/**
 * Method use to create a new instance of vtkVectorText
 * @param {IVectorTextInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IVectorTextInitialValues
): vtkVectorText;

/**
 * vtkVectorText generates vtkPolyData from an input string.
 * The TTF file needs to be parsed using opentype.js and then passed to
 * vtkVectorText via the setFont method.
 */
export declare const vtkVectorText: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkVectorText;
