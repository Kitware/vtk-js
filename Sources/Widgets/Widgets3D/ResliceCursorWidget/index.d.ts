import { mat4 } from 'gl-matrix';
import {
  vtkAbstractWidgetFactory,
  IAbstractWidgetFactoryInitialValues,
} from '../../Core/AbstractWidgetFactory';
import { vtkResliceCursorWidgetDefaultInstance } from './behavior';
import { vtkAbstractWidget } from '../../Core/AbstractWidget';
import { vtkImageData } from '../../../Common/DataModel/ImageData';
import { vtkImageReslice } from '../../../Imaging/Core/ImageReslice';
import { vtkPlaneSource } from '../../../Filters/Sources/PlaneSource';
import { vtkRenderer } from '../../../Rendering/Core/Renderer';
import { vtkPlaneManipulator } from '../../Manipulators/PlaneManipulator';
import { ViewTypes } from '../../../Widgets/Core/WidgetManager/Constants';
import { Nullable, Vector2, Vector3 } from '../../../types';
import { IDisplayScaleParams } from '../../../Widgets/Core/WidgetManager';
import { vtkWidgetState } from '../../Core/WidgetState';
import { vtkBoundsMixinState } from '../../Core/StateBuilder/boundsMixin';
import { PlaneName, PlaneViewType, ScrollingMethods } from './Constants';

/**
 * The orientation of one of the three reslice planes.
 */
export interface IResliceCursorPlane {
  normal: Vector3;
  viewUp: Vector3;
}

export interface vtkResliceCursorWidgetState
  extends vtkWidgetState, vtkBoundsMixinState {
  /**
   * The world-space point the three planes intersect at.
   */
  getCenter(): Vector3;
  getCenterByReference(): Vector3;
  setCenter(center: Vector3): boolean;
  setCenter(x: number, y: number, z: number): boolean;
  setCenterFrom(center: Vector3): void;

  /**
   * The image the widget reslices.
   */
  getImage(): Nullable<vtkImageData>;
  setImage(image: vtkImageData): boolean;

  /**
   * The orientation of each reslice plane, keyed by view type.
   */
  getPlanes(): Partial<Record<PlaneViewType, IResliceCursorPlane>>;
  setPlanes(
    planes: Partial<Record<PlaneViewType, IResliceCursorPlane>>
  ): boolean;

  /**
   * Which mouse button scrolls through the slices.
   */
  getScrollingMethod(): ScrollingMethods;
  setScrollingMethod(method: ScrollingMethods): boolean;

  /**
   * The view type currently being interacted with, if any.
   */
  getActiveViewType(): Nullable<ViewTypes>;
  setActiveViewType(viewType: Nullable<ViewTypes>): boolean;

  getCameraOffsets(): Record<string, unknown>;
  setCameraOffsets(offsets: Record<string, unknown>): boolean;

  getViewUpFromViewType(): Record<string, Vector3>;
  setViewUpFromViewType(viewUps: Record<string, Vector3>): boolean;

  /**
   * The handle sitting at the intersection of the three planes.
   */
  getCenterHandle(): vtkWidgetState;
  setCenterHandle(centerHandle: vtkWidgetState): boolean;
}

export interface vtkResliceCursorWidget<
  WidgetInstance extends vtkAbstractWidget =
    vtkResliceCursorWidgetDefaultInstance,
> extends vtkAbstractWidgetFactory<WidgetInstance> {
  getWidgetState(): vtkResliceCursorWidgetState;

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

  updateReslicePlane(
    imageReslice: vtkImageReslice,
    viewType: ViewTypes
  ): boolean;

  getPlaneSourceFromViewType(type: ViewTypes): vtkPlaneSource;

  getPlaneNormalFromViewType(viewType: ViewTypes): Vector3;

  getOtherPlaneNormals(viewType: ViewTypes): Array<Vector3>;

  getResliceMatrix(): mat4;

  /**
   * The display scale params of the first representation of each reslice view
   * type. A view type with no representation, or whose representation predates
   * the display-scale API, maps to undefined.
   */
  getDisplayScaleParams(): Record<
    PlaneViewType,
    IDisplayScaleParams | undefined
  >;

  setScaleInPixels(scale: boolean): boolean;

  getScaleInPixels(): boolean;

  // holeWidth and infiniteLine are not on the factory: they are forwarded to
  // the per-view widgets through model.methodsToLink, so they live on
  // vtkResliceCursorWidgetDefaultInstance instead.

  setRotationHandlePosition(position: number): boolean;

  getRotationHandlePosition(): number;

  setManipulator(manipulator: vtkPlaneManipulator): boolean;

  getManipulator(): vtkPlaneManipulator;

  /**
   * Return an array of the first and the last possible points of the plane
   * along its normal.
   * @param {ViewTypes} viewType
   * @returns {Array<Vector3>} two Vector3 arrays (first and last points)
   */
  getPlaneExtremities(viewType: ViewTypes): Array<Vector3>;
}

export interface IResliceCursorWidgetInitialValues<
  WidgetInstance extends vtkAbstractWidget,
> extends IAbstractWidgetFactoryInitialValues<WidgetInstance> {
  /**
   * Which planes the widget state is generated for.
   * @default ['X', 'Y', 'Z']
   */
  planes?: PlaneName[];

  /**
   * Whether handle sizes are expressed in pixels rather than world units.
   * @default true
   */
  scaleInPixels?: boolean;

  /**
   * Where the rotation handles sit along their axis, in [0, 1].
   * @default 0.5
   */
  rotationHandlePosition?: number;

  /**
   * The manipulator the view widgets interact through.
   * @default vtkPlaneManipulator.newInstance()
   */
  manipulator?: vtkPlaneManipulator;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkResliceCursorWidget characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param initialValues (default: {})
 */
export function extend<WidgetInstance extends vtkAbstractWidget>(
  publicAPI: object,
  model: object,
  initialValues?: IResliceCursorWidgetInitialValues<WidgetInstance>
): void;

/**
 * Method used to create a new instance of vtkResliceCursorWidget
 *
 * @param initialValues for pre-setting some of its content
 */
export function newInstance<
  WidgetInstance extends vtkAbstractWidget =
    vtkResliceCursorWidgetDefaultInstance,
>(
  initialValues?: IResliceCursorWidgetInitialValues<WidgetInstance>
): vtkResliceCursorWidget<WidgetInstance>;

export declare const vtkResliceCursorWidget: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkResliceCursorWidget;
