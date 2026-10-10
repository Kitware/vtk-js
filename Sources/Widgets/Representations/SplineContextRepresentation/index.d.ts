import { Nullable, RGBColor } from '../../../types';
import { BoundaryCondition } from '../../../Common/DataModel/Spline1D/Constants';
import vtkMapper from '../../../Rendering/Core/Mapper';
import vtkWidgetState from '../../Core/WidgetState';
import vtkContextRepresentation, {
  IContextRepresentationInitialValues,
} from '../ContextRepresentation';

export interface ISplineContextRepresentationInitialValues extends IContextRepresentationInitialValues {
  /** Number of segments generated between two consecutive control points. */
  resolution?: number;
  fill?: boolean;
  outputBorder?: boolean;
  borderColor?: RGBColor;
  /** Border color used when the triangulation of the area failed. */
  errorBorderColor?: RGBColor;
}

export interface vtkSplineContextRepresentation extends vtkContextRepresentation {
  /**
   * Samples the spline defined by the origins of the input states, using the
   * spline parameters carried by the input widget state.
   */
  requestData(inData: any[], outData: any[]): void;

  /** Only the visible states carrying an origin are kept. */
  getRepresentationStates(input?: vtkWidgetState): vtkWidgetState[];

  /** No mapper is stored on the model: each internal pipeline owns its own. */
  getMapper(): Nullable<vtkMapper>;

  getResolution(): number;
  setResolution(resolution: number): boolean;

  getBoundaryCondition(): BoundaryCondition;
  setBoundaryCondition(boundaryCondition: BoundaryCondition): boolean;

  /** Whether the area enclosed by the spline is triangulated and rendered. */
  getFill(): boolean;
  setFill(fill: boolean): boolean;

  /** Whether the spline itself is rendered as a line. */
  getOutputBorder(): boolean;
  setOutputBorder(outputBorder: boolean): boolean;

  getBorderColor(): RGBColor;
  getBorderColorByReference(): RGBColor;
  setBorderColor(borderColor: RGBColor): boolean;
  setBorderColorFrom(borderColor: RGBColor): void;

  getErrorBorderColor(): RGBColor;
  getErrorBorderColorByReference(): RGBColor;
  setErrorBorderColor(errorBorderColor: RGBColor): boolean;
  setErrorBorderColorFrom(errorBorderColor: RGBColor): void;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkSplineContextRepresentation characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ISplineContextRepresentationInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ISplineContextRepresentationInitialValues
): void;

export function newInstance(
  initialValues?: ISplineContextRepresentationInitialValues
): vtkSplineContextRepresentation;

/**
 * vtkSplineContextRepresentation renders the spline going through the origins
 * of the widget states, as a filled area and/or as a border line.
 */
export declare const vtkSplineContextRepresentation: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkSplineContextRepresentation;
