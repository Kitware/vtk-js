import vtkDataArray from "../../../Common/Core/DataArray";
import vtkPolyData from "../../../Common/DataModel/PolyData";
import { vtkObject } from "../../../interfaces";
import vtkProp from "../../../Rendering/Core/Prop";
export interface IDisplayScaleParams {
	dispHeightFactor: number,
	cameraPosition: number[],
	cameraDir: number[],
	isParallel: boolean,
	rendererPixelDims: number[],
}

export interface IWidgetRepresentationInitialValues {
    labels?: Array<any>,
    coincidentTopologyParameters?: object,
    displayScaleParams?: IDisplayScaleParams,
    scaleInPixels?: boolean
}

export interface vtkWidgetRepresentation extends vtkProp {
    getLabels(): Array<any>;
    setLabels(labels: Array<any>): void;

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
export function extend(publicAPI: object, model: object, initialValues?: IWidgetRepresentationInitialValues): void;

/**
 * Method use to create a new instance of vtkWidgetRepresentation
 * @param {IWidgetRepresentationInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IWidgetRepresentationInitialValues): vtkWidgetRepresentation;

/**
 * Static function to get the pixel size of a 3D point.
 * @param {Number[]} worldCoord 3D point in world coordinates
 * @param {IDisplayScaleParams} displayScaleParams Display and camera information
 */
export function getPixelWorldHeightAtCoord(worldCoord: number[], displayScaleParams: IDisplayScaleParams): number[];

export interface IWidgetPipeline {
	source?: object,
	filter?: object,
	glyph?: object,
	mapper: object,
	actor: object
}
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
 export function allocateArray(polyData: vtkPolyData,
    name: string,
    numberOfTuples: number,
    dataType?: string,
    numberOfComponents?: number): vtkDataArray|null;

export declare const vtkWidgetRepresentation: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkWidgetRepresentation;
