import vtkSelectionNode from '../../../Common/DataModel/SelectionNode';
import {
  IHardwareSelectorInitialValues,
  vtkHardwareSelector,
} from '../../../Rendering/Core/HardwareSelector';
import vtkProp from '../../../Rendering/Core/Prop';
import vtkRenderer from '../../../Rendering/Core/Renderer';
import { FieldAssociations } from '../../../Common/DataModel/DataSet/Constants';
import { Nullable, Vector2 } from '../../../types';
import { PixelInformation } from '../../OpenGL/HardwareSelector';

type Area = [number, number, number, number];

/**
 * The pixels that getSourceDataAsync read back, with the functions that use
 * them. The color buffer holds only the area. The depth buffer holds all
 * the window.
 */
export interface WebGPUSourceData {
  area: Area;
  width: number;
  height: number;
  colorValues: Uint32Array;
  colorBufferWidth: number;
  depthValues?: Float32Array;
  zbufferBufferWidth?: number;
  captureZValues: boolean;
  fieldAssociation: FieldAssociations;
  props: vtkProp[];
  renderer: vtkRenderer;
  generateSelection(
    fx1: number,
    fy1: number,
    fx2: number,
    fy2: number
  ): vtkSelectionNode[];
  getPixelInformation(
    inDispPos: Vector2,
    maxDistance: number,
    outDispPos: Vector2
  ): Nullable<PixelInformation>;
  isPropHit(propID: number): boolean;
}

export interface vtkWebGPUHardwareSelector extends vtkHardwareSelector {
  /**
   * Attaches a render window and a renderer to this selector.
   */
  attach(webGPURenderWindow: unknown, renderer: vtkRenderer): void;

  /**
   * Renders the selection pass and reads back the pixels of the area. With
   * no area, all the window is read.
   */
  getSourceDataAsync(
    renderer?: vtkRenderer,
    fx1?: number,
    fy1?: number,
    fx2?: number,
    fy2?: number
  ): Promise<WebGPUSourceData | false>;

  /**
   * Reads the area of setArea() and keeps the data for getPixelInformation,
   * generateSelection and isPropHit. WebGPU has no synchronous
   * captureBuffers() or select().
   */
  captureBuffersAsync(): Promise<boolean>;

  /**
   * The data of the last captureBuffersAsync() call.
   */
  getCapturedData(): Nullable<WebGPUSourceData>;

  /**
   * Gets the selection information for a pixel of the captured data.
   */
  getPixelInformation(
    inDispPos: Vector2,
    maxDistance: number,
    outDispPos: Vector2
  ): Nullable<PixelInformation>;

  /**
   * Generates selections in an area of the captured data.
   */
  generateSelection(
    fx1: number,
    fy1: number,
    fx2: number,
    fy2: number
  ): vtkSelectionNode[];

  /**
   * True if the captured data has a pixel of the prop.
   */
  isPropHit(propID: number): boolean;

  /**
   * Removes the captured data.
   */
  releasePixBuffers(): void;

  releaseGraphicsResources(): void;

  endSelection(): void;

  /**
   * The area in display pixels, with y up. The values are rounded down.
   */
  setArea(area: Area): boolean;
  setArea(fx1: number, fy1: number, fx2: number, fy2: number): boolean;
  getArea(): Area;
}

export function newInstance(
  initialValues?: IHardwareSelectorInitialValues
): vtkWebGPUHardwareSelector;

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IHardwareSelectorInitialValues
): void;

/**
 * Gives read back selection buffers the functions that use them.
 */
export function newSourceData(fields: object): WebGPUSourceData;

/**
 * The WebGPU hardware selector renders the prop, composite and attribute ids
 * to one rgba32uint texture in one pass.
 */
export const vtkWebGPUHardwareSelector: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  newSourceData: typeof newSourceData;
};

export default vtkWebGPUHardwareSelector;
