import { RGBColor } from '../../../types';
import vtkActor from '../../../Rendering/Core/Actor';
import vtkMapper from '../../../Rendering/Core/Mapper';
import vtkContextRepresentation, {
  IContextRepresentationInitialValues,
} from '../ContextRepresentation';

export interface IOutlineContextRepresentationInitialValues extends IContextRepresentationInitialValues {
  edgeColor?: RGBColor;
}

export interface vtkOutlineContextRepresentation extends vtkContextRepresentation {
  /**
   * Renders the outline of the bounding box of every state origin.
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
 * Method use to decorate a given object (publicAPI+model) with vtkOutlineContextRepresentation characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IOutlineContextRepresentationInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IOutlineContextRepresentationInitialValues
): void;

export function newInstance(
  initialValues?: IOutlineContextRepresentationInitialValues
): vtkOutlineContextRepresentation;

/**
 * vtkOutlineContextRepresentation renders the axis-aligned box outline of the
 * bounding box of the origins of the widget states it is given.
 */
export declare const vtkOutlineContextRepresentation: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkOutlineContextRepresentation;
