import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { HtmlDataAccessHelper } from '../../Core/DataAccessHelper/HtmlDataAccessHelper';
import { HttpDataAccessHelper } from '../../Core/DataAccessHelper/HttpDataAccessHelper';
import { JSZipDataAccessHelper } from '../../Core/DataAccessHelper/JSZipDataAccessHelper';
import { LiteHttpDataAccessHelper } from '../../Core/DataAccessHelper/LiteHttpDataAccessHelper';

import { vtkActor } from '../../../Rendering/Core/Actor';
import { vtkRenderer } from '../../../Rendering/Core/Renderer';
import { vtkCamera } from '../../../Rendering/Core/Camera';
import { vtkArmature } from '../../../Common/DataModel/Armature';
import { vtkAnimationClip } from '../../../Common/DataModel/AnimationClip';

interface IGLTFImporterOptions {
  binary?: boolean;
  compression?: string;
  progressCallback?: any;
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
   * Import the animations (DEPRECATED - use getSkeletons() and getAnimationClips()).
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
   * @param cameraId The camera id.
   */
  setCamera(cameraId: string): void;

  /**
   * Set the Draco decoder.
   * @param dracoDecoder
   */
  setDracoDecoder(dracoDecoder: any): void;

  /**
   * Set the vtk Renderer.
   * @param renderer The vtk Renderer.
   */
  setRenderer(renderer: vtkRenderer): void;

  /**
   * Switch to a variant.
   * @param variantIndex The index of the variant to switch to.
   */
  switchToVariant(variantIndex: number): void;

  /**
   * Get all parsed skeletons from glTF skins
   * @return Array of skeletons with metadata
   */
  getSkeletons(): Array<{ skeleton: vtkArmature; gltfSkinIndex: number }>;

  /**
   * Get skin data for all skinned mesh nodes.
   * Map from node ID to skin info (skinId, jointNodeIds, inverseBindMatrices).
   */
  getSkins(): Map<
    string,
    {
      skinId: string;
      jointNodeIds: string[];
      inverseBindMatrices: Float32Array[];
      skeletonRoot: string | null;
    }
  >;

  /**
   * Get all parsed animation clips from glTF animations
   * @return Array of animation clips
   */
  getAnimationClips(): vtkAnimationClip[];

  /**
   * Get animation clip by name
   * @param name The clip name
   * @return The animation clip or null
   */
  getAnimationClipByName(name: string): vtkAnimationClip | null;

  /**
   * Get all animation clip names
   * @return Array of clip names
   */
  getAnimationClipNames(): string[];

  /**
   * Invoke the skeletonLoaded event
   * @param event Event data with { skeleton, gltfSkinIndex }
   */
  invokeSkeletonLoaded(event: {
    skeleton: vtkArmature;
    gltfSkinIndex: number;
  }): void;

  /**
   * Listen for skeleton loaded events
   * @param callback Function to call when skeleton is loaded
   */
  onSkeletonLoaded(
    callback: (event: { skeleton: vtkArmature; gltfSkinIndex: number }) => void
  ): void;

  /**
   * Invoke the animationClipLoaded event
   * @param event Event data with { clip }
   */
  invokeAnimationClipLoaded(event: { clip: vtkAnimationClip }): void;

  /**
   * Listen for animation clip loaded events
   * @param callback Function to call when animation clip is loaded
   */
  onAnimationClipLoaded(
    callback: (event: { clip: vtkAnimationClip }) => void
  ): void;
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
 * * KHR_animation_pointer
 * * KHR_draco_mesh_compression
 * * KHR_lights_punctual
 * * KHR_materials_anisotropy
 * * KHR_materials_clearcoat
 * * KHR_materials_diffuse_transmission
 * * KHR_materials_dispersion
 * * KHR_materials_emissive_strength
 * * KHR_materials_ior
 * * KHR_materials_iridescence
 * * KHR_materials_pbrSpecularGlossiness
 * * KHR_materials_sheen
 * * KHR_materials_specular
 * * KHR_materials_transmission
 * * KHR_materials_unlit
 * * KHR_materials_variants
 * * KHR_materials_volume
 * * KHR_texture_transform
 * * EXT_texture_webp
 * * EXT_texture_avif
 */
export declare const vtkGLTFImporter: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkGLTFImporter;
