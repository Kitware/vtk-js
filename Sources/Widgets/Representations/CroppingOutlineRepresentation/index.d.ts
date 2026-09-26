import { RGBColor } from '../../../types';
import vtkActor from '../../../Rendering/Core/Actor';
import vtkMapper from '../../../Rendering/Core/Mapper';
import vtkContextRepresentation, {
  IContextRepresentationInitialValues,
} from '../ContextRepresentation';

export interface ICroppingOutlineRepresentationInitialValues extends IContextRepresentationInitialValues {
  edgeColor?: RGBColor;
}

export interface vtkCroppingOutlineRepresentation extends vtkContextRepresentation {
  /**
   * Expects exactly 8 states carrying an origin; logs an error otherwise.
   */
  requestData(inData: any[], outData: any[]): void;

  getEdgeColor(): RGBColor;
  getEdgeColorByReference(): RGBColor;
  setEdgeColor(edgeColor: RGBColor): boolean;
  setEdgeColorFrom(edgeColor: RGBColor): void;

  getMapper(): vtkMapper;
  getActor(): vtkActor;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkCroppingOutlineRepresentation characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ICroppingOutlineRepresentationInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ICroppingOutlineRepresentationInitialValues
): void;

export function newInstance(
  initialValues?: ICroppingOutlineRepresentationInitialValues
): vtkCroppingOutlineRepresentation;

/**
 * vtkCroppingOutlineRepresentation renders the 12 edges of a box given its 8
 * corners as widget state origins. It does not handle an arbitrary set of
 * points.
 */
export declare const vtkCroppingOutlineRepresentation: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkCroppingOutlineRepresentation;
