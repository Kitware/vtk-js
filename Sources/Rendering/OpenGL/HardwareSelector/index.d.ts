import vtkSelectionNode from '../../../Common/DataModel/SelectionNode';
import {
  IHardwareSelectorInitialValues,
  vtkHardwareSelector,
} from '../../../Rendering/Core/HardwareSelector';
import vtkProp from '../../../Rendering/Core/Prop';
import vtkRenderer from '../../../Rendering/Core/Renderer';
import vtkOpenGLRenderWindow from '../../../Rendering/OpenGL/RenderWindow';
import { FieldAssociations } from '../../../Common/DataModel/DataSet/Constants';
import { EventHandler, vtkSubscription } from '../../../interfaces';
import { Nullable, Vector2, Vector3 } from '../../../types';
import { PassTypes } from './Constants';

type Area = [number, number, number, number];

export interface BufferData {
  area: Area;
  pixBuffer: Uint8Array[];
}

export interface SourceData {
  area: Area;
  pixBuffer: Uint8Array[];
  captureZValues: boolean;
  zBuffer: Uint8Array;
  props: vtkProp[];
  fieldAssociation: FieldAssociations;
  renderer: vtkRenderer;
  openGLRenderWindow: vtkOpenGLRenderWindow;
  generateSelection(
    buffdata: BufferData,
    fx1: number,
    fy1: number,
    fx2: number,
    fy2: number
  ): vtkSelectionNode[];
}

export interface PixelInformation {
  valid: boolean;
  prop: vtkProp;
  propID: number;
  compositeID: number;
  zValue: number;
  displayPosition: Vector2;
  attributeID?: number;
}

// TODO extends vtkHardwareSelector
export interface vtkOpenGLHardwareSelector extends vtkHardwareSelector {
  /**
   * Releases internal pixel buffer memory.
   */
  releasePixBuffers(): void;

  /**
   * Preps for picking the scene.
   *
   * Call endSelection() afterwards.
   */
  beginSelection(): void;

  /**
   * Cleans up picking state.
   *
   * Should be after a call to beginSelection();
   */
  endSelection(): void;

  /**
   * Runs a pre-capture pass.
   */
  preCapturePass(): void;

  /**
   * Runs a post-capture pass.
   */
  postCapturePass(): void;

  /**
   * Generates a selection.
   */
  select(): Nullable<vtkSelectionNode[]>;

  /**
   * Get the picking source data.
   *
   * @param {vtkRenderer} renderer
   * @param {number} fx1 top left x coord
   * @param {number} fy1 top left y coord
   * @param {number} fx2 bottom right x coord
   * @param {number} fy2 bottom right y coord
   */
  getSourceDataAsync(
    renderer: vtkRenderer,
    fx1: number,
    fy1: number,
    fx2: number,
    fy2: number
  ): Promise<SourceData>;

  /**
   * Captures the scene for picking.
   * @returns whether the capture succeeded.
   */
  captureBuffers(): boolean;

  /**
   * Processes the pixel buffers for actors.
   */
  processPixelBuffers(): void;

  /**
   * Determines if a pass is required.
   * @param {PassTypes} pass
   */
  passRequired(pass: PassTypes): boolean;

  /**
   * Saves the pixel buffer from the view.
   * @param {PassTypes} pass
   */
  savePixelBuffer(pass: PassTypes): void;

  /**
   * Builds the prop hit list.
   * @param {Uint8Array} pixelBuffer
   */
  buildPropHitList(pixelBuffer: Uint8Array): void;

  /**
   * Renders a prop for picking.
   * @param {vtkProp} prop
   */
  renderProp(prop: vtkProp): void;

  /**
   * Sets the current prop's color value for the composite index.
   * @param {number} index
   */
  renderCompositeIndex(index: number): void;

  /**
   * Renders an attribute ID.
   * @param {number} attribId
   */
  renderAttributeId(attribId: number): void;

  /**
   * Returns the pass type name as a string.
   * @param {PassTypes} type
   */
  passTypeToString(type: PassTypes): string;

  /**
   * Has the prop with the given internal ID been hit.
   * @param {number} id
   */
  isPropHit(id: number): boolean;

  /**
   * Sets the internal color used for coloring the current prop.
   * @param {number} val
   */
  setPropColorValueFromInt(val: number): void;

  /**
   * Gets the selection information for a given pixel.
   *
   * @param inDispPos The input diplay position.
   * @param maxDistance The max distance to consider from the input position.
   * @param outDispPos The output display position.
   */
  getPixelInformation(
    inDispPos: Vector2,
    maxDistance: number,
    outDispPos: Vector2
  ): Nullable<PixelInformation>;

  /**
   * Generates selections in a given area.
   *
   * @param {number} fx1 top left x coord
   * @param {number} fy1 top left y coord
   * @param {number} fx2 bottom right x coord
   * @param {number} fy2 bottom right y coord
   */
  generateSelection(
    fx1: number,
    fy1: number,
    fx2: number,
    fy2: number
  ): vtkSelectionNode[];

  /**
   * Get the raw pixel buffer for a pass type.
   * @param {PassTypes} passNo
   */
  getRawPixelBuffer(passNo: PassTypes): Uint8Array;

  /**
   * Get the pixel buffer for a pass type.
   * @param {PassTypes} passNo
   */
  getPixelBuffer(passNo: PassTypes): Uint8Array;

  /**
   * Attaches a render window + renderer to this hardware selector.
   * @param {Nullable<vtkOpenGLRenderWindow>} openglRenderWindow
   * @param {Nullable<vtkRenderer>} renderer
   */
  attach(
    openglRenderWindow: Nullable<vtkOpenGLRenderWindow>,
    renderer: Nullable<vtkRenderer>
  ): void;

  /**
   * Sets the current renderer.
   * @param {vtkRenderer} ren
   */
  setRenderer(ren: vtkRenderer): boolean;

  /**
   * Gets the current renderer.
   */
  getRenderer(): vtkRenderer;

  /**
   * Sets the current pass type.
   * @param {PassTypes} pass
   */
  setCurrentPass(pass: PassTypes): boolean;

  /**
   * Gets the current pass type.
   */
  getCurrentPass(): PassTypes;

  /**
   * Sets the current opengl render window.
   * @param {vtkOpenGLRenderWindow} oglrw
   */
  setOpenGLRenderWindow(oglrw: vtkOpenGLRenderWindow): boolean;

  getOpenGLRenderWindow(): vtkOpenGLRenderWindow;

  /**
   * Sets the maximum point ID.
   * @param {number} id
   */
  setMaximumPointId(id: number): boolean;

  /**
   * Gets the maximum point ID.
   */
  getMaximumPointId(): number;

  /**
   * Sets the maximum cell ID.
   * @param {number} id
   */
  setMaximumCellId(id: number): boolean;

  /**
   * Gets the maximum cell ID.
   */
  getMaximumCellId(): number;

  /**
   * Sets the prop's color value.
   * @param {Vector3} color
   */
  setPropColorValue(color: Vector3): boolean;

  /**
   * Sets the prop's color value.
   * @param {number} r
   * @param {number} g
   * @param {number} b
   */
  setPropColorValue(r: number, g: number, b: number): boolean;

  /**
   * Gets the prop color value.
   */
  getPropColorValue(): Vector3;

  /**
   * Sets the selection area.
   *
   * @param area An area bounding box
   */
  setArea(area: Area): boolean;

  /**
   * Sets the selection area.
   * @param {number} fx1 top left x coord
   * @param {number} fy1 top left y coord
   * @param {number} fx2 bottom right x coord
   * @param {number} fy2 bottom right y coord
   */
  setArea(fx1: number, fy1: number, fx2: number, fy2: number): boolean;

  /**
   * Gets the selection area.
   */
  getArea(): Area;

  /**
   * Listen to the start/stop events.
   * @param cb
   * @param priority
   */
  onEvent(cb: EventHandler, priority?: number): Readonly<vtkSubscription>;
}

export interface IOpenGLHardwareSelectorInitialValues
  extends IHardwareSelectorInitialValues {
  maximumPointId?: number;
  maximumCellId?: number;
  idOffset?: number;
}

export function newInstance(
  initialValues?: IOpenGLHardwareSelectorInitialValues
): vtkOpenGLHardwareSelector;

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IOpenGLHardwareSelectorInitialValues
): void;

export const vtkOpenGLHardwareSelector: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkOpenGLHardwareSelector;
