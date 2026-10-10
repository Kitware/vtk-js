import vtkDataArray from '../../../Common/Core/DataArray';
import vtkPolyData from '../../../Common/DataModel/PolyData';
import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import vtkProp, { IPropInitialValues } from '../../../Rendering/Core/Prop';
import vtkActor from '../../../Rendering/Core/Actor';
import { IDisplayScaleParams } from '../../../Widgets/Core/WidgetManager';
import { RenderingTypes } from '../../../Widgets/Core/WidgetManager/Constants';
import vtkWidgetState from '../../../Widgets/Core/WidgetState';
import { Behavior } from './Constants';

export interface IWidgetRepresentationInitialValues extends IPropInitialValues {
  labels?: Array<any>;
  coincidentTopologyParameters?: object;
  displayScaleParams?: IDisplayScaleParams;
  scaleInPixels?: boolean;
  behavior?: Behavior;
  actors?: Array<vtkActor>;
  activeScaleFactor?: number;
  activeColor?: number;
  useActiveColor?: boolean;
}

export interface vtkWidgetRepresentation extends vtkProp, vtkAlgorithm {
  /** Add an actor and apply the representation's mapper settings. */
  addActor(actor: vtkActor): void;

  /** Update actor visibility for the current rendering pass. */
  updateActorVisibility(
    renderingType?: RenderingTypes,
    ctxVisible?: boolean,
    handleVisible?: boolean
  ): void;

  getLabels(): Array<any>;
  setLabels(labels: Array<any>): void;

  getRepresentationStates(input?: vtkWidgetState): vtkWidgetState[];
  getSelectedState(prop: vtkProp, compositeID: number): vtkWidgetState | null;

  /**
   * Gets the coincident topology parameters applied on the actor mappers
   */
  getCoincidentTopologyParameters(): object;
  /**
   * Sets the coincident topology parameters applied on the actor mappers
   */
  setCoincidentTopologyParameters(parameters: object): boolean;

  /**
   * Sets the current view and camera scale parameters.
   * Called by the WidgetManager.
   * @see setScaleInPixels()
   */
  setDisplayScaleParams(params: object): boolean;

  /**
   * Gets the current view and camera scale parameters.
   */
  getDisplayScaleParams(): IDisplayScaleParams;

  /**
   * Gets the scale applied to the representation while it is active.
   */
  getActiveScaleFactor(): number;
  setActiveScaleFactor(activeScaleFactor: number): boolean;

  /**
   * Gets the scalar value the mapper turns into the active color.
   */
  getActiveColor(): number;
  setActiveColor(activeColor: number): boolean;

  getUseActiveColor(): boolean;
  setUseActiveColor(useActiveColor: boolean): boolean;

  /**
   * Gets wether actors should have a fix size in display coordinates.
   * @see setScaleInPixels()
   */
  getScaleInPixels(): boolean;

  /**
   * Sets wether actors should have a fix size in display coordinates.
   * @see getScaleInPixels()
   */
  setScaleInPixels(scale: boolean): boolean;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkWidgetRepresentation characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWidgetRepresentationInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWidgetRepresentationInitialValues
): void;

export interface IWidgetPipeline {
  source?: object;
  filter?: object;
  glyph?: object;
  mapper: object;
  actor: object;
}

export interface IWidgetStyles {
  active: any;
  inactive: any;
  static: any;
}

/**
 * Merge the given styles together for the given element names.
 * @param {string[]} elementNames The names of the elements to merge styles for.
 * @param {...any} stylesToMerge The styles to merge.
 */
export function mergeStyles(
  elementNames: string[],
  ...stylesToMerge: any[]
): IWidgetStyles;

/**
 * Apply the given styles to the given pipelines.
 * @param {Record<string, IWidgetPipeline>} pipelines The pipelines to apply styles to.
 * @param {IWidgetStyles} styles The styles to apply.
 * @param {any} [activeActor] The currently active actor.
 */
export function applyStyles(
  pipelines: Record<string, IWidgetPipeline>,
  styles: IWidgetStyles,
  activeActor?: any
): void;

/**
 * If provided, connects `source` (dataset or filter) to `filter`.
 * If provided, connects `filter` (otherwise `source`) to mapper
 * If provided, connects glyph as 2nd input to mapper. This is typically for the glyph mapper.
 * Connects mapper to actor.
 * @param {IWidgetPipeline} pipeline of source, filter, mapper and actor to connect
 */
export function connectPipeline(pipeline: IWidgetPipeline): void;

/**
 * Allocate or resize a vtkPoint(name='point'), vtkCellArray (name=
 * 'line'|'poly') or vtkDataArray (name=any) and add it to the vtkPolyData.
 * If allocated, the array is automatically added to the polydata
 * Connects mapper to actor.
 * @param {vtkPolyData} polyData The polydata to add array to
 * @param {string} name The name of the array to add (special handling for
 * 'point', 'line, 'poly')
 * @param {Number} numberOfTuples The number of tuples to (re)allocate.
 * @param {String} dataType The typed array type name.
 * @param {Number} numberOfComponents The number of components of the array.
 */
export function allocateArray(
  polyData: vtkPolyData,
  name: string,
  numberOfTuples: number,
  dataType?: string,
  numberOfComponents?: number
): vtkDataArray | null;

export declare const vtkWidgetRepresentation: {
  extend: typeof extend;
  mergeStyles: typeof mergeStyles;
  applyStyles: typeof applyStyles;
  connectPipeline: typeof connectPipeline;
};
export default vtkWidgetRepresentation;
