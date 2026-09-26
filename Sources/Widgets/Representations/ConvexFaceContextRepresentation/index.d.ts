import { RGBColor } from '../../../types';
import vtkActor from '../../../Rendering/Core/Actor';
import vtkMapper from '../../../Rendering/Core/Mapper';
import vtkContextRepresentation, {
  IContextRepresentationInitialValues,
} from '../ContextRepresentation';

export interface IConvexFaceContextRepresentationInitialValues extends IContextRepresentationInitialValues {
  defaultColor?: RGBColor;
  opacity?: number;
}

export interface vtkConvexFaceContextRepresentation extends vtkContextRepresentation {
  requestData(inData: any[], outData: any[]): void;

  getDefaultColor(): RGBColor;
  getDefaultColorByReference(): RGBColor;
  setDefaultColor(defaultColor: RGBColor): boolean;
  setDefaultColorFrom(defaultColor: RGBColor): void;

  getMapper(): vtkMapper;
  getActor(): vtkActor;

  /**
   * Opacity applied on the face actor. While picking, a `HANDLE` behaved
   * representation is temporarily made fully opaque.
   */
  getOpacity(): number;
  setOpacity(opacity: number): boolean;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkConvexFaceContextRepresentation characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IConvexFaceContextRepresentationInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IConvexFaceContextRepresentationInitialValues
): void;

export function newInstance(
  initialValues?: IConvexFaceContextRepresentationInitialValues
): vtkConvexFaceContextRepresentation;

/**
 * vtkConvexFaceContextRepresentation renders the convex polygon whose corners
 * are the origins of the widget states it is given.
 */
export declare const vtkConvexFaceContextRepresentation: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkConvexFaceContextRepresentation;
