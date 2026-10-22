import vtkRenderer from '../../../Rendering/Core/Renderer';
import { vtkObject } from '../../../interfaces';
import { Nullable, RGBColor, Range } from '../../../types';

/**
 * One entry of the animation data: the settings to apply at a given time.
 * Besides `time`, `camera` and `background`, a scene item's settings are keyed
 * by that item's id.
 */
export interface ITimeStepScene {
  time: number;
  camera?: object;
  background?: RGBColor;
  [id: string]: unknown;
}

export interface ITimeStepBasedAnimationData {
  timeSteps: ITimeStepScene[];
}

export interface IAnimationSceneItem {
  id: string;
  source: {
    getTimeSteps?(): number[];
    setUpdateTimeStep?(time: number): void;
  };
  defaultSettings?: object;
}

export type ApplySettings = (
  sceneItem: IAnimationSceneItem,
  settings: object
) => void;

export interface vtkTimeStepBasedAnimationHandler extends vtkObject {
  /**
   * Snaps to the last time step lower than or equal to `time` and applies it.
   * Does nothing when no time step is known.
   * @param time the requested time
   */
  setCurrentTimeStep(time: number): void;

  /**
   * Sets the animation data and refreshes the time steps, time range and
   * current time step from it.
   * @param data the animation data
   */
  setData(data: ITimeStepBasedAnimationData): void;

  /**
   * Sets what the handler animates.
   * @param scene the scene items
   * @param originalMetadata metadata holding the base camera parameters
   * @param applySettings callback applying settings to a scene item
   * @param renderer the renderer
   */
  setScene(
    scene: IAnimationSceneItem[],
    originalMetadata: object,
    applySettings: ApplySettings,
    renderer: vtkRenderer
  ): void;

  /**
   * Applies camera parameters to every registered renderer's active camera.
   * @param params the camera parameters
   */
  setCameraParameters(params: object): void;

  /**
   * Sets the background of every registered renderer.
   * @param color the background color
   */
  setBackground(color: RGBColor): void;

  /**
   * Applies the scene settings of the current time step.
   */
  update(): void;

  /**
   * Registers a renderer, if not already registered.
   * @param renderer the renderer
   */
  addRenderer(renderer: vtkRenderer): void;

  getCurrentTimeStep(): number;
  getTimeSteps(): number[];
  getTimeRange(): Range;
  getData(): Nullable<ITimeStepBasedAnimationData>;
  getScene(): Nullable<IAnimationSceneItem[]>;
  getApplySettings(): Nullable<ApplySettings>;

  /**
   * Gets the metadata passed at construction.
   */
  getOriginalMetada(): object | undefined;

  getRenderers(): vtkRenderer[];
  setRenderers(renderers: vtkRenderer[]): boolean;
}

export interface ITimeStepBasedAnimationHandlerInitialValues {
  timeSteps?: number[];
  timeRange?: Range;
  currentTimeStep?: number;
  scene?: Nullable<IAnimationSceneItem[]>;
  data?: Nullable<ITimeStepBasedAnimationData>;
  renderers?: vtkRenderer[];
  applySettings?: Nullable<ApplySettings>;
  originalMetadata?: object;
}

export function newInstance(
  initialValues?: ITimeStepBasedAnimationHandlerInitialValues
): vtkTimeStepBasedAnimationHandler;

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ITimeStepBasedAnimationHandlerInitialValues
): void;

/**
 * Drives a scene through a discrete list of time steps: each time step carries
 * camera, background and per-scene-item settings that are applied when that
 * step becomes current.
 */
export declare const vtkTimeStepBasedAnimationHandler: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkTimeStepBasedAnimationHandler;
