import vtkActor from '../../../Rendering/Core/Actor';
import vtkMapper from '../../../Rendering/Core/Mapper';
import vtkContextRepresentation, {
  IContextRepresentationInitialValues,
} from '../ContextRepresentation';

export interface IRectangleContextRepresentationInitialValues extends IContextRepresentationInitialValues {
  drawBorder?: boolean;
  drawFace?: boolean;
}

export interface vtkRectangleContextRepresentation extends vtkContextRepresentation {
  /**
   * Builds the rectangle from the origin, corner and up vector of the first
   * state. Only the first state is used.
   */
  requestData(inData: any[], outData: any[]): void;

  getColor(): [number];
  getColorByReference(): [number];
  setColor(color: [number] | number): boolean;
  setColorFrom(color: [number]): void;

  getDrawBorder(): boolean;
  setDrawBorder(drawBorder: boolean): boolean;

  getDrawFace(): boolean;
  setDrawFace(drawFace: boolean): boolean;

  getMapper(): vtkMapper;
  getActor(): vtkActor;

  /** Forwards the opacity to the actor property. */
  setOpacity(opacity: number): void;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkRectangleContextRepresentation characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IRectangleContextRepresentationInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IRectangleContextRepresentationInitialValues
): void;

export function newInstance(
  initialValues?: IRectangleContextRepresentationInitialValues
): vtkRectangleContextRepresentation;

/**
 * vtkRectangleContextRepresentation renders the rectangle spanned by the
 * origin and the corner of a widget state, as a filled face and/or a border.
 */
export declare const vtkRectangleContextRepresentation: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkRectangleContextRepresentation;
