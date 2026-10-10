import vtkWidgetState from '../../Core/WidgetState';
import vtkWidgetRepresentation, {
  IWidgetRepresentationInitialValues,
  IWidgetStyles,
} from '../WidgetRepresentation';

export interface IImplicitPlaneRepresentationInitialValues extends IWidgetRepresentationInitialValues {
  /** Phi and theta resolution of the origin handle sphere. */
  sphereResolution?: number;
  /** Handle size relative to the smallest dimension of the plane bounds. */
  handleSizeRatio?: number;
  /** Radius factor applied on the normal cylinder. */
  axisScale?: number;
  normalVisible?: boolean;
  originVisible?: boolean;
  planeVisible?: boolean;
  outlineVisible?: boolean;
}

export interface vtkImplicitPlaneRepresentation extends vtkWidgetRepresentation {
  /**
   * Cuts the outline cube with the state's plane and updates the outline,
   * plane, origin and normal pipelines.
   */
  requestData(inData: any[], outData: any[]): void;

  getSphereResolution(): number;
  /**
   * Forwards the resolution to the phi and theta resolutions of the origin
   * handle sphere.
   */
  setSphereResolution(sphereResolution: number): boolean;

  getRepresentationStyle(): IWidgetStyles;
  /**
   * Merges the given styles into the current ones and applies them.
   */
  setRepresentationStyle(style: Partial<IWidgetStyles>): void;

  getHandleSizeRatio(): number;
  setHandleSizeRatio(handleSizeRatio: number): boolean;

  getAxisScale(): number;
  setAxisScale(axisScale: number): boolean;

  getNormalVisible(): boolean;
  setNormalVisible(normalVisible: boolean): boolean;

  getOriginVisible(): boolean;
  setOriginVisible(originVisible: boolean): boolean;

  getPlaneVisible(): boolean;
  setPlaneVisible(planeVisible: boolean): boolean;

  getOutlineVisible(): boolean;
  setOutlineVisible(outlineVisible: boolean): boolean;
}

/**
 * Builds the widget state expected by this representation: an `origin`, a
 * `normal`, an `activeHandle` and an `updateMethodName` field.
 *
 * The module carries it on its default object only; there is no named runtime
 * export to declare.
 */
declare function generateState(): vtkWidgetState;

/**
 * Method use to decorate a given object (publicAPI+model) with vtkImplicitPlaneRepresentation characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IImplicitPlaneRepresentationInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IImplicitPlaneRepresentationInitialValues
): void;

export function newInstance(
  initialValues?: IImplicitPlaneRepresentationInitialValues
): vtkImplicitPlaneRepresentation;

/**
 * vtkImplicitPlaneRepresentation renders an implicit plane as the intersection
 * of the plane with the outline of its bounds, together with an origin handle,
 * a normal handle and the bounds outline. The handle picked by the user is
 * reported on the state through `activeHandle` and `updateMethodName`.
 */
export declare const vtkImplicitPlaneRepresentation: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  generateState: typeof generateState;
};
export default vtkImplicitPlaneRepresentation;
