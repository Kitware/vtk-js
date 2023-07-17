import { mat4 } from 'gl-matrix';
import vtkAbstractWidgetFactory from '../../Core/AbstractWidgetFactory';
import vtkImageData from '../../../Common/DataModel/ImageData';
import vtkImageReslice from '../../../Imaging/Core/ImageReslice';
import vtkPlaneSource from '../../../Filters/Sources/PlaneSource';
import vtkRenderer from '../../../Rendering/Core/Renderer';
import vtkPlaneManipulator from '../../Manipulators/PlaneManipulator';
import { ViewTypes } from '../../../Widgets/Core/WidgetManager/Constants';
import { Vector2, Vector3 } from '../../../types';

export interface IDisplayScaleParams {
  dispHeightFactor: number,
  cameraPosition: Vector3,
  cameraDir: Vector3,
  isParallel: false,
  rendererPixelDims: Vector2
}

export interface vtkResliceCursorWidget extends vtkAbstractWidgetFactory {

  /**
   * @param {ViewTypes} viewType
   */
  getRepresentationsForViewType(viewType: ViewTypes): unknown;

  setImage(image: vtkImageData): void;

  setCenter(center: Vector3): void;

  updateCameraPoints(
    renderer: vtkRenderer,
    viewType: ViewTypes,
    resetFocalPoint: boolean,
    keepCenterFocalDistance: boolean,
    computeFocalPointOffset: boolean
  ): void;

  resetCamera(
    renderer: vtkRenderer,
    viewType: ViewTypes,
    resetFocalPoint: boolean,
    keepCenterFocalDistance: boolean
  ): void;


  getPlaneSource(viewType: ViewTypes): vtkPlaneSource;

  getResliceAxes(viewType: ViewTypes): mat4;

  updateReslicePlane(imageReslice: vtkImageReslice, viewType: ViewTypes): boolean;

  getPlaneSourceFromViewType(type: ViewTypes): vtkPlaneSource;

  getPlaneNormalFromViewType(viewType: ViewTypes): Vector3;

  getOtherPlaneNormals(viewType: ViewTypes): Array<Vector3>;

  getResliceMatrix(): mat4;

  getDisplayScaleParams(): IDisplayScaleParams;

  setScaleInPixels(scale: boolean): boolean;

  getScaleInPixels(): boolean;

  setRotationHandlePosition(position: number): boolean;

  getRotationHandlePosition(): number;

  setManipulator(manipulator: vtkPlaneManipulator): boolean;

  getManipulator(): vtkPlaneManipulator;

}

export interface IResliceCursorWidgetInitialValues {}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkResliceCursorWidget characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param initialValues (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IResliceCursorWidgetInitialValues
): vtkResliceCursorWidget;

/**
 * Method used to create a new instance of vtkResliceCursorWidget
 * 
 * @param initialValues for pre-setting some of its content
 */
export function newInstance(initialValues?: IResliceCursorWidgetInitialValues): vtkResliceCursorWidget;

export declare const vtkResliceCursorWidget: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkResliceCursorWidget;
