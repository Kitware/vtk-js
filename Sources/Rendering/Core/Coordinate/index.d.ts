import { VtkObject, VtkProperty } from "vtk.js/Sources/macro";
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';

export enum Coordinate {
	DISPLAY,
	NORMALIZED_DISPLAY,
	VIEWPORT,
	NORMALIZED_VIEWPORT,
	PROJECTION,
	VIEW,
	WORLD,
}

/**
 * 
 */
interface ICoordinateInitialValues {
	coordinateSystem?: number,
	value?: number[],
	renderer?: vtkRenderer,
	referenceCoordinate?: any,
	computing?: number,
	computedWorldValue?: number[],
	computedDoubleDisplayValue?: number[],
}

export interface vtkCoordinate extends VtkObject {


	/**
	 * 
	 * @param ren 
	 */
	getComputedWorldValue(ren: vtkRenderer): number[];

	/**
	 * 
	 * @param ren 
	 */
	getComputedViewportValue(ren: vtkRenderer): number[];

	/**
	 * 
	 * @param ren 
	 */
	getComputedDisplayValue(ren: vtkRenderer): number[];

	/**
	 * 
	 * @param ren 
	 */
	getComputedLocalDisplayValue(ren: vtkRenderer): number[];

	/**
	 * 
	 * @param ren 
	 */
	getComputedValue(ren: vtkRenderer): number[];

	/**
	 * 
	 * @param ren 
	 */
	getComputedDoubleViewportValue(ren: vtkRenderer): number[];

	/**
	 * 
	 * @param ren 
	 */
	getComputedDoubleDisplayValue(ren: vtkRenderer): number[];

	/**
	 * Get the coordinate system which this coordinate is defined in.
	 * The options are Display, Normalized Display, Viewport, Normalized Viewport, View, and World.
	 */
	getCoordinateSystem(): number;

	/**
	 * Get the coordinate system which this coordinate is defined in as string.
	 */
	getCoordinateSystemAsString(): string;

	/**
	 * Get the value of this coordinate.
	 */
	getValue(): number[];

	/**
	 * 
	 */
	getReferenceCoordinate(): vtkCoordinate;

	/**
	 * Get mapper that was picked (if any)
	 */
	getRenderer(): null | vtkRenderer;

	/**
	 * Set the coordinate system which this coordinate is defined in.
	 * The options are Display, Normalized Display, Viewport, Normalized Viewport, View, and World.
	 * @param coordinateSystem 
	 */
	setCoordinateSystem(coordinateSystem: Coordinate): boolean

	/**
	 * Set the coordinate system to Coordinate.DISPLAY
	 */
	setCoordinateSystemToDisplay(): void;

	/**
	 * Set the coordinate system to Coordinate.NORMALIZED_DISPLAY
	 */
	setCoordinateSystemToNormalizedDisplay(): void;

	/**
	 * Set the coordinate system to Coordinate.NORMALIZED_VIEWPORT
	 */
	setCoordinateSystemToNormalizedViewport(): void;

	/**
	 * Set the coordinate system to Coordinate.PROJECTION
	 */
	setCoordinateSystemToProjection(): void;

	/**
	 * Set the coordinate system to Coordinate.VIEW
	 */
	setCoordinateSystemToView(): void;

	/**
	 * Set the coordinate system to Coordinate.VIEWPORT
	 */
	setCoordinateSystemToViewport(): void;

	/**
	 * Set the coordinate system to Coordinate.WORLD
	 */
	setCoordinateSystemToWorld(): void;

	/**
	 * 
	 * @param property 
	 */
	setProperty(property: VtkProperty): boolean;

	/**
	 * 
	 * @param referenceCoordinate 
	 */
	setReferenceCoordinate(referenceCoordinate: vtkCoordinate): boolean;

	/**
	 * 
	 * @param renderer 
	 */
	setRenderer(renderer: vtkRenderer): boolean;

	/**
	 * Set the value of this coordinate.
	 * @param ...args 
	 */
	setValue(value: number[]): boolean;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkCoordinate characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ICoordinateInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ICoordinateInitialValues): void;

/**
 * Method use to create a new instance of vtkCoordinate
 * @param initialValues for pre-setting some of its content
 */
export function newInstance(initialValues?: ICoordinateInitialValues): vtkCoordinate;

/**
 * vtkCoordinate represents position in a variety of coordinate systems, and converts position to other coordinate systems. 
 * It also supports relative positioning, so you can create a cascade of vtkCoordinate objects (no loops please!) that refer to each other.
 * The typical usage of this object is to set the coordinate system in which to represent a position 
 * (e.g., SetCoordinateSystemToNormalizedDisplay()), set the value of the coordinate (e.g., SetValue()),
 * and then invoke the appropriate method to convert to another coordinate system (e.g., GetComputedWorldValue()).
 *
 * The coordinate systems in vtk are as follows:
 * 
 *   DISPLAY - x-y pixel values in window 0, 0 is the lower left of the first pixel, size, size is the upper right of the last pixel
 * 
 *   NORMALIZED DISPLAY -  x-y (0,1) normalized values 0, 0 is the lower left of the first pixel, 1, 1 is the upper right of the last pixel
 * 
 *   VIEWPORT - x-y pixel values in viewport 0, 0 is the lower left of the first pixel, size, size is the upper right of the last pixel
 * 
 *   NORMALIZED VIEWPORT - x-y (0,1) normalized value in viewport 0, 0 is the lower left of the first pixel, 1, 1 is the upper right of the last pixel
 * 
 *   VIEW - x-y-z (-1,1) values in pose coordinates. (z is depth)
 * 
 *   POSE - world coords translated and rotated to the camera position and view direction
 * 
 *   WORLD - x-y-z global coordinate values
 * 
 *   USERDEFINED - x-y-z in User defined space
 * 
 * If you cascade vtkCoordinate objects, you refer to another vtkCoordinate object which in turn can refer to others, and so on.
 * This allows you to create composite groups of things like vtkActor2D that are positioned relative to one another. 
 * Note that in cascaded sequences, each vtkCoordinate object may be specified in different coordinate systems!
 * 
 * @see [vtkActor](./Rendering_Core_Actor.html)2D
 */
export declare const vtkCoordinate: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkCoordinate;
