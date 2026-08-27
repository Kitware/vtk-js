import { vtkObject } from '../../../interfaces';
import { Nullable } from '../../../types';

/**
 * Keys accepted by the template map, one per corner / side of the container.
 */
export type CornerAnnotationCorner =
  | 'nw'
  | 'n'
  | 'ne'
  | 'w'
  | 'e'
  | 'sw'
  | 's'
  | 'se';

export type CornerAnnotationMetadata = Record<string, any>;

export type CornerAnnotationTemplate = (
  metadata: CornerAnnotationMetadata
) => string;

export type ICornerAnnotationTemplates = Partial<
  Record<CornerAnnotationCorner, CornerAnnotationTemplate>
>;

export interface ICornerAnnotationInitialValues {
  templates?: Nullable<ICornerAnnotationTemplates>;
  metadata?: Nullable<CornerAnnotationMetadata>;
}

export interface vtkCornerAnnotation extends vtkObject {
  /**
   * Root element holding the nine annotation slots.
   */
  getAnnotationContainer(): HTMLElement;

  getNorthWestContainer(): HTMLElement;

  getNorthContainer(): HTMLElement;

  getNorthEastContainer(): HTMLElement;

  getWestContainer(): HTMLElement;

  getEastContainer(): HTMLElement;

  getSouthWestContainer(): HTMLElement;

  getSouthContainer(): HTMLElement;

  getSouthEastContainer(): HTMLElement;

  getMetadata(): CornerAnnotationMetadata;

  /**
   * Attach the annotation container to the given DOM element, detaching it
   * from any previously set one.
   * @param el
   */
  setContainer(el: Nullable<HTMLElement>): void;

  /**
   * No-op kept for API symmetry with the other UI widgets.
   */
  resize(): void;

  /**
   * Merge the given templates into the current ones and re-render.
   * @param {ICornerAnnotationTemplates} templates
   */
  updateTemplates(templates: ICornerAnnotationTemplates): void;

  /**
   * Merge the given metadata into the current one and re-render.
   * @param {CornerAnnotationMetadata} metadata
   */
  updateMetadata(metadata: CornerAnnotationMetadata): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with
 * vtkCornerAnnotation characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ICornerAnnotationInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ICornerAnnotationInitialValues
): void;

/**
 * Method used to create a new instance of vtkCornerAnnotation.
 * @param {ICornerAnnotationInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: ICornerAnnotationInitialValues
): vtkCornerAnnotation;

/**
 * Replace every `${path}` occurrence of the template by the value found at
 * that dotted path inside `map`.
 *
 * @param template the string containing `${...}` placeholders
 * @param map the object to resolve the placeholder paths against
 * @param {String} [fallback] value used when a path cannot be resolved
 */
declare function applyTemplate(
  template: string,
  map: Record<string, any>,
  fallback?: string
): string;

/**
 * vtkCornerAnnotation is a DOM overlay that displays text in the four corners
 * and the four sides of a container. Each slot is filled by a template
 * function evaluated against the annotation metadata.
 */
export declare const vtkCornerAnnotation: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  applyTemplate: typeof applyTemplate;
};
export default vtkCornerAnnotation;
