import vtkWidgetRepresentation, {
  IWidgetRepresentationInitialValues,
} from '../WidgetRepresentation';

export interface IPolyLineRepresentationInitialValues extends IWidgetRepresentationInitialValues {
  threshold?: number;
  /** Adds a segment between the last and the first point. */
  closePolyLine?: boolean;
  /**
   * Radius of the tube generated along the line. Overridden by the input
   * state's `lineThickness` when it provides one.
   */
  lineThickness?: number;
}

export interface vtkPolyLineRepresentation extends vtkWidgetRepresentation {
  /**
   * Builds the poly line from the origins of the input states, dropping
   * invalid and coincident points, then updates the tube radius.
   */
  requestData(inData: any[], outData: any[]): void;

  getThreshold(): number;
  setThreshold(threshold: number): boolean;

  getClosePolyLine(): boolean;
  setClosePolyLine(closePolyLine: boolean): boolean;

  getLineThickness(): number;
  setLineThickness(lineThickness: number): boolean;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkPolyLineRepresentation characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IPolyLineRepresentationInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IPolyLineRepresentationInitialValues
): void;

export function newInstance(
  initialValues?: IPolyLineRepresentationInitialValues
): vtkPolyLineRepresentation;

/**
 * vtkPolyLineRepresentation renders the poly line going through the origins of
 * the widget states as a tube. When `scaleInPixels` is on, the tube radius is
 * scaled to keep a constant size in display coordinates, and it is enlarged
 * while rendering the picking buffer.
 */
export declare const vtkPolyLineRepresentation: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkPolyLineRepresentation;
