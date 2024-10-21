import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import HtmlDataAccessHelper from '../../Core/DataAccessHelper/HtmlDataAccessHelper';
import HttpDataAccessHelper from '../../Core/DataAccessHelper/HttpDataAccessHelper';
import JSZipDataAccessHelper from '../../Core/DataAccessHelper/JSZipDataAccessHelper';
import LiteHttpDataAccessHelper from '../../Core/DataAccessHelper/LiteHttpDataAccessHelper';

import vtkActor from '../../../Rendering/Core/Actor';
import vtkRenderer from '../../../Rendering/Core/Renderer';
import vtkCamera from '../../../Rendering/Core/Camera';

interface IGLTFImporterOptions {
  binary?: boolean;
  compression?: string;
  progressCallback?: any;
}

export interface IGLTFAnimation {
  id: string;
  name: string;
  channels: any[];
  samplers: any[];
}

export interface IGLTFAnimationMixer {
  addAnimation: (glTFAnimation: object) => void;
  play: (name: string, weight?: number) => void;
  stop: (name: string) => void;
  stopAll: () => void;
  update: (deltaTime: number) => void;
}

export interface IGLTFMaterialVariant {
  material: number;
  variants: number[];
}

/**
 *
 */
export interface IGLTFImporterInitialValues {}

type vtkGLTFImporterBase = vtkObject &
  Omit<
    vtkAlgorithm,
    | 'getInputData'
    | 'setInputData'
    | 'setInputConnection'
    | 'getInputConnection'
    | 'addInputConnection'
    | 'addInputData'
  >;

export interface vtkGLTFImporter extends vtkGLTFImporterBase {
  /**
   * Get the actors.
   */
  getActors(): Map<string, vtkActor>;

  /**
   * Get the animation mixer.
   */
  getAnimationMixer(): IGLTFAnimationMixer;

  /**
   * Get the animations.
   */
  getAnimations(): IGLTFAnimation[];

  /**
   * Get the base url.
   */
  getBaseURL(): string;

  /**
   * Get the cameras.
   */
  getCameras(): Map<string, vtkCamera>;

  /**
   *
   */
  getDataAccessHelper():
    | HtmlDataAccessHelper
    | HttpDataAccessHelper
    | JSZipDataAccessHelper
    | LiteHttpDataAccessHelper;

  /**
   * Get the url of the object to load.
   */
  getUrl(): string;

  /**
   * Get the variant array.
   */
  getVariants(): string[];

  /**
   * Get the variant mappings.
   */
  getVariantMappings(): Map<string, IGLTFMaterialVariant[]>;

  /**
   * Import the actors.
   */
  importActors(): void;

  /**
   * Import the animations.
   */
  importAnimations(): void;

  /**
   * Import the cameras.
   */
  importCameras(): void;

  /**
   * Import the lights.
   */
  importLights(): void;

  /**
   * Invoke the ready event.
   */
  invokeReady(): void;

  /**
   * Load the object data.
   * @param {IGLTFImporterOptions} [options]
   */
  loadData(options?: IGLTFImporterOptions): Promise<any>;

  /**
   *
   * @param callback
   */
  onReady(callback: () => void): void;

  /**
   * Parse data.
   * @param {String | ArrayBuffer} content The content to parse.
   */
  parse(content: string | ArrayBuffer): void;

  /**
   * Parse data as ArrayBuffer.
   * @param {ArrayBuffer} content The content to parse.
   */
  parseAsArrayBuffer(content: ArrayBuffer): void;

  /**
   * Parse data as text.
   * @param {String} content The content to parse.
   */
  parseAsText(content: string): void;

  /**
   *
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;

  /**
   *
   * @param dataAccessHelper
   */
  setDataAccessHelper(
    dataAccessHelper:
      | HtmlDataAccessHelper
      | HttpDataAccessHelper
      | JSZipDataAccessHelper
      | LiteHttpDataAccessHelper
  ): boolean;

  /**
   * Set the url of the object to load.
   * @param {String} url the url of the object to load.
   * @param {IGLTFImporterOptions} [option] The Draco reader options.
   */
  setUrl(url: string, option?: IGLTFImporterOptions): Promise<string | any>;

  /**
   * Set the camera id.
   * @param cameraId
   */
  setCamera(cameraId: string): void;

  /**
   * Set the Draco decoder.
   * @param mappings
   */
  setDracoDecoder(decoder: any): void;

  /**
   * Set the vtk Renderer.
   * @param renderer
   */
  setRenderer(renderer: vtkRenderer): void;

  /**
   * Switch to a variant.
   * @param variantIndex
   */
  switchToVariant(variantIndex: number): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkGLTFImporter characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IGLTFImporterInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IGLTFImporterInitialValues
): void;

/**
 * Method used to create a new instance of vtkGLTFImporter
 * @param {IGLTFImporterInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IGLTFImporterInitialValues
): vtkGLTFImporter;

/**
 * Load the WASM decoder from url and set the decoderModule
 * @param url
 * @param binaryName
 */
export function setWasmBinary(
  url: string,
  binaryName: string
): Promise<boolean>;

/**
 * vtkGLTFImporter can import glTF 2.0 files.
 *
 * The GL Transmission Format (glTF) is an API-neutral runtime asset delivery
 * format. A glTF asset is represented by:
 * * A JSON-formatted file (.gltf) containing a full scene description: node
 *   hierarchy, materials, cameras, as well as descriptor information for
 *   meshes, animations, and other constructs
 * * Binary files (.bin) containing geometry and animation data, and other
 *   buffer-based data
 * * Image files (.jpg, .png) for textures
 *
 * Supported extensions:
 * * KHR_draco_mesh_compression
 * * KHR_lights_punctual
 * * KHR_materials_unlit
 * * KHR_materials_ior
 * * KHR_materials_specular
 * * KHR_materials_variants
 * * EXT_texture_webp
 * * EXT_texture_avif
 */
export declare const vtkGLTFImporter: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkGLTFImporter;
