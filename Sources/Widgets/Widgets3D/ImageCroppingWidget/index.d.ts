import { mat4 } from 'gl-matrix';
import vtkImageData from '../../../Common/DataModel/ImageData';
import vtkAbstractWidget from '../../Core/AbstractWidget';
import vtkAbstractWidgetFactory, {
  IAbstractWidgetFactoryInitialValues,
} from '../../Core/AbstractWidgetFactory';
import { ViewTypes } from '../../Core/WidgetManager/Constants';
import { vtkWidgetState } from '../../Core/WidgetState';
import { vtkBoundsMixinState } from '../../Core/StateBuilder/boundsMixin';
import { vtkColorMixinState } from '../../Core/StateBuilder/colorMixin';
import { vtkManipulatorMixinState } from '../../Core/StateBuilder/manipulatorMixin';
import { vtkNameMixinState } from '../../Core/StateBuilder/nameMixin';
import { vtkOriginMixinState } from '../../Core/StateBuilder/originMixin';
import { vtkScale1MixinState } from '../../Core/StateBuilder/scale1Mixin';
import { vtkVisibleMixinState } from '../../Core/StateBuilder/visibleMixin';
import vtkLineManipulator from '../../Manipulators/LineManipulator';
import vtkPlaneManipulator from '../../Manipulators/PlaneManipulator';

/**
 * The cropping planes, in index space, ordered as
 * `[iMin, iMax, jMin, jMax, kMin, kMax]`.
 */
export type CroppingPlanes = [number, number, number, number, number, number];

export interface ImageCroppingPlanesState
  extends vtkWidgetState, vtkBoundsMixinState {
  /**
   * Get the cropping planes, in index space.
   */
  getPlanes(): CroppingPlanes;

  /**
   * Set the cropping planes, in index space.
   */
  setPlanes(planes: CroppingPlanes): boolean;
  setPlanes(
    iMin: number,
    iMax: number,
    jMin: number,
    jMax: number,
    kMin: number,
    kMax: number
  ): boolean;
}

/**
 * The state of a single crop handle. Handles are labelled `'handles'` plus
 * their name and their type (`'corners'`, `'edges'` or `'faces'`).
 */
export type ImageCroppingHandleState = vtkNameMixinState &
  vtkOriginMixinState &
  vtkColorMixinState &
  vtkScale1MixinState &
  vtkVisibleMixinState &
  vtkManipulatorMixinState;

export interface ImageCroppingWidgetState
  extends vtkWidgetState, vtkBoundsMixinState {
  /**
   * Get the index-to-world transform copied from the cropped image.
   */
  getIndexToWorldT(): mat4;

  /**
   * Set the index-to-world transform.
   */
  setIndexToWorldT(transform: mat4): boolean;

  /**
   * Get the world-to-index transform copied from the cropped image.
   */
  getWorldToIndexT(): mat4;

  /**
   * Set the world-to-index transform.
   */
  setWorldToIndexT(transform: mat4): boolean;

  /**
   * Get and set the sub-state holding the cropping planes. It can be observed
   * independently of the rest of the widget state.
   */
  getCroppingPlanes(): ImageCroppingPlanesState;
  setCroppingPlanes(croppingPlanes: ImageCroppingPlanesState): boolean;
}

/**
 * The per-view widget returned by `vtkWidgetManager.addWidget()`.
 */
export interface vtkImageCroppingViewWidget extends vtkAbstractWidget {
  getWidgetState(): ImageCroppingWidgetState;

  /**
   * Set a callback invoked by the sphere handle representation when handles are
   * rendered.
   */
  setDisplayCallback(callback: (coords: any) => void): void;
}

// The three manipulators are deliberately absent: the widget installs its own
// during initialization, unconditionally overwriting anything passed in.
export interface IImageCroppingWidgetInitialValues extends IAbstractWidgetFactoryInitialValues<vtkImageCroppingViewWidget> {}

export interface vtkImageCroppingWidget extends vtkAbstractWidgetFactory<vtkImageCroppingViewWidget> {
  getWidgetState(): ImageCroppingWidgetState;

  /**
   * The representation builders the widget uses in the given view type.
   */
  getRepresentationsForViewType(viewType: ViewTypes): unknown;

  /**
   * Get the manipulator driving the corner handles.
   */
  getCornerManipulator(): vtkPlaneManipulator | undefined;

  /**
   * Set the manipulator driving the corner handles.
   */
  setCornerManipulator(manipulator: vtkPlaneManipulator): void;

  /**
   * Get the manipulator driving the edge handles.
   */
  getEdgeManipulator(): vtkPlaneManipulator | undefined;

  /**
   * Set the manipulator driving the edge handles.
   */
  setEdgeManipulator(manipulator: vtkPlaneManipulator): void;

  /**
   * Get the manipulator driving the face handles.
   */
  getFaceManipulator(): vtkLineManipulator | undefined;

  /**
   * Set the manipulator driving the face handles.
   */
  setFaceManipulator(manipulator: vtkLineManipulator): void;

  /**
   * Copy the transforms and dimensions of the given image into the widget
   * state, resetting the cropping planes to the full extent of the image.
   *
   * @param {vtkImageData} image The image to crop
   */
  copyImageDataDescription(image: vtkImageData): void;

  /**
   * Reposition the handles from the current cropping planes. Called
   * automatically whenever the cropping planes sub-state is modified.
   */
  updateHandles(): void;

  /**
   * Show or hide the six face handles.
   */
  setFaceHandlesEnabled(enabled: boolean): void;

  /**
   * Show or hide the eight corner handles.
   */
  setCornerHandlesEnabled(enabled: boolean): void;

  /**
   * Show or hide the twelve edge handles.
   */
  setEdgeHandlesEnabled(enabled: boolean): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkImageCroppingWidget characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IImageCroppingWidgetInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IImageCroppingWidgetInitialValues
): void;

/**
 * Method used to create a new instance of vtkImageCroppingWidget
 * @param {IImageCroppingWidgetInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IImageCroppingWidgetInitialValues
): vtkImageCroppingWidget;

/**
 * vtkImageCroppingWidget provides a box with corner, edge and face handles that
 * lets the user interactively define cropping planes over a vtkImageData.
 */
declare const vtkImageCroppingWidget: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkImageCroppingWidget;
