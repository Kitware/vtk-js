import { FieldAssociations } from '../../../Common/DataModel/DataSet/Constants';
import vtkSelectionNode from '../../../Common/DataModel/SelectionNode';
import { Nullable } from '../../../types';
import {
  IHardwareSelectorInitialValues,
  vtkHardwareSelector,
} from '../../Core/HardwareSelector';
import vtkProp from '../../Core/Prop';
import vtkRenderer from '../../Core/Renderer';
import vtkWebGPURenderer from '../Renderer';
import vtkWebGPURenderWindow from '../RenderWindow';

/**
 * The region of the selection buffer a capture covers, as
 * `[x1, y1, x2, y2]` in pixels.
 */
export type WebGPUSelectionArea = [number, number, number, number];

/**
 * One capture of the selection buffers, held by value so that overlapping
 * asynchronous captures do not interfere with each other.
 */
export interface IWebGPUSourceData {
  area: WebGPUSelectionArea;
  captureZValues: boolean;
  fieldAssociation: FieldAssociations;

  /**
   * The props hit during the capture, indexed by the prop id written into the
   * selection buffer. An entry is `null` when the mapper did not name a prop.
   */
  props: Nullable<vtkProp>[];
  renderer: vtkRenderer;
  webGPURenderer: vtkWebGPURenderer;
  webGPURenderWindow: vtkWebGPURenderWindow;
  width: number;
  height: number;

  /**
   * The row stride, in texels, of the color buffer. Rounded up so that a row
   * is a multiple of 256 bytes.
   */
  colorBufferWidth: number;
  colorBufferSizeInBytes: number;

  /**
   * The `[propID, compositeID, attributeID + 1, unused]` texels of the
   * capture, row padded to `colorBufferWidth`.
   */
  colorValues: Uint32Array;

  /**
   * The row stride, in texels, of the depth buffer. Only present when
   * z values were captured.
   */
  zbufferBufferWidth?: number;
  zbufferSizeInBytes?: number;

  /**
   * The depth of every texel of the capture, row padded to
   * `zbufferBufferWidth`. Only present when z values were captured.
   */
  depthValues?: Float32Array;

  /**
   * Resolve the props, composite ids and attribute ids hit inside a region of
   * this capture.
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
}

export interface IWebGPUHardwareSelectorInitialValues extends IHardwareSelectorInitialValues {
  WebGPURenderWindow?: vtkWebGPURenderWindow;
  _WebGPURenderWindow?: vtkWebGPURenderWindow;
}

export interface vtkWebGPUHardwareSelector extends vtkHardwareSelector {
  /**
   * Get the index this prop is written to the selection buffer under,
   * assigning it one on first use. The indices are reset at the start of
   * every capture.
   *
   * @param {number} runtimePropID The prop id of the actor view node.
   * @param {vtkProp} [prop] The prop the selection should report (default: null)
   */
  getPropIDForSelection(
    runtimePropID: number,
    prop?: Nullable<vtkProp>
  ): number;

  /**
   * Detach this selector from the renderer it was capturing.
   */
  endSelection(): void;

  /**
   * Render the scene into the selection buffers and read them back. The whole
   * canvas is always captured, so no region is taken.
   *
   * @param {vtkRenderer} renderer The renderer to capture.
   * @returns the capture, or `false` when there is no renderer or view, or the
   * renderer has no view node.
   */
  getSourceDataAsync(renderer: vtkRenderer): Promise<IWebGPUSourceData | false>;

  /**
   * Get the render window view node the capture renders through.
   */
  getWebGPURenderWindow(): Nullable<vtkWebGPURenderWindow>;

  /**
   * Set the render window view node the capture renders through.
   */
  setWebGPURenderWindow(
    webGPURenderWindow: Nullable<vtkWebGPURenderWindow>
  ): boolean;
}

export function newInstance(
  initialValues?: IWebGPUHardwareSelectorInitialValues
): vtkWebGPUHardwareSelector;

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUHardwareSelectorInitialValues
): void;

/**
 * The WebGPU implementation of the hardware selector renders the scene into an
 * rgba32uint texture whose texels hold the prop, composite and attribute ids
 * of the fragment, then copies that texture, and the depth texture when z
 * values are wanted, into mappable buffers. Because the copy covers the whole
 * texture, the capture always spans the full canvas and the picking region is
 * only applied when the read back buffers are decoded.
 */
export declare const vtkWebGPUHardwareSelector: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkWebGPUHardwareSelector;
