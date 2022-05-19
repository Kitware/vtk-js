import { vtkObject, vtkProperty } from "../../../interfaces";
import vtkRenderer from '../Renderer';
import { Coordinate } from "./Constants";


/**
 *
 */
export interface ICoordinateInitialValues {
	coordinateSystem?: number,
	value?: number[],
	renderer?: vtkRenderer,
	referenceCoordinate?: any,
	computing?: number,
	computedWorldValue?: number[],
	computedDoubleDisplayValue?: number[],
}

export interface vtkCoordinate extends vtkObject {

	/**
	 *
	 * @param {vtkRenderer} ren 
	 */
	getComputedWorldValue(ren: vtkRenderer): number[];

	/**
	 *
	 * @param {vtkRenderer} ren 
	 */
	getComputedViewportValue(ren: vtkRenderer): number[];

	/**
	 *
	 * @param {vtkRenderer} ren 
	 */
	getComputedDisplayValue(ren: vtkRenderer): number[];

	/**
	 *
	 * @param {vtkRenderer} ren 
	 */
	getComputedLocalDisplayValue(ren: vtkRenderer): number[];

	/**
	 *
	 * @param {vtkRenderer} ren 
	 */
	getComputedValue(ren: vtkRenderer): number[];

	/**
	 *
	 * @param {vtkRenderer} ren 
	 */
	getComputedDoubleViewportValue(ren: vtkRenderer): number[];

	/**
	 *
	 * @param {vtkRenderer} ren 
	 */
	getComputedDoubleDisplayValue(ren: vtkRenderer): number[];

	/**
	 * Get the coordinate system which this coordinate is defined in. The
	 * options are Display, Normalized Display, Viewport, Normalized Viewport,
	 * View, and World.
	 */
	getCoordinateSystem(): Coordinate;

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
	getRenderer(): vtkRenderer;

	/**
	 * Set the coordinate system which this coordinate is defined in. The
	 * options are Display, Normalized Display, Viewport, Normalized Viewport,
	 * View, and World.
	 * @param {Coordinate} coordinateSystem 
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
	 * @param {vtkProperty} property 
	 */
	setProperty(property: vtkProperty): boolean;

	/**
	 *
	 * @param {vtkCoordinate} referenceCoordinate 
	 */
	setReferenceCoordinate(referenceCoordinate: vtkCoordinate): boolean;

	/**
	 *
	 * @param {vtkRenderer} renderer 
	 */
	setRenderer(renderer: vtkRenderer): boolean;

	/**
	 * Set the value of this coordinate.
	 * @param value 
	 */
	setValue(value: number[]): boolean;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkCoordinate
 * characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ICoordinateInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ICoordinateInitialValues): void;

/**
 * Method use to create a new instance of vtkCoordinate
 * @param {ICoordinateInitialValues} [initialValues] for pre-setting some of its
 * content
 */
export function newInstance(initialValues?: ICoordinateInitialValues): vtkCoordinate;

/**
 * vtkCoordinate represents position in a variety of coordinate systems, and
 * converts position to other coordinate systems. It also supports relative
 * positioning, so you can create a cascade of vtkCoordinate objects (no loops
 * please!) that refer to each other. The typical usage of this object is to set
 * the coordinate system in which to represent a position (e.g.,
 * SetCoordinateSystemToNormalizedDisplay()), set the value of the coordinate
 * (e.g., SetValue()), and then invoke the appropriate method to convert to
 * another coordinate system (e.g., GetComputedWorldValue()).
 *
 * The coordinate systems in vtk are as follows:
 *
 * - DISPLAY - x-y pixel values in window 0, 0 is the lower left of the first
 *   pixel, size, size is the upper right of the last pixel
 * - NORMALIZED DISPLAY -  x-y (0,1) normalized values 0, 0 is the lower left of
 *   the first pixel, 1, 1 is the upper right of the last pixel
 * - VIEWPORT - x-y pixel values in viewport 0, 0 is the lower left of the first
 *   pixel, size, size is the upper right of the last pixel
 * - NORMALIZED VIEWPORT - x-y (0,1) normalized value in viewport 0, 0 is the
 *   lower left of the first pixel, 1, 1 is the upper right of the last pixel
 * - VIEW - x-y-z (-1,1) values in pose coordinates. (z is depth)
 * - POSE - world coords translated and rotated to the camera position and view
 *   direction
 * - STABILIZED - used by rendering backends to deal with floating point
 *   resolution issues. Similar to world coordinates but with a translation to
 *   try to get the matricies to be well behaved.
 * - WORLD - x-y-z global coordinate values
 * - MODEL - x-y-z coordinate values in the data's coordinates, the actor holds
 *   a matrix to go to world
 * - BUFFER - x-y-x coordinates as stored int he VBO
 * - DATA - x-y-z the original coordintes of the dataset
 * - USERDEFINED - x-y-z in User defined space
 *
 * If you cascade vtkCoordinate objects, you refer to another vtkCoordinate
 * object which in turn can refer to others, and so on. This allows you to
 * create composite groups of things like vtkActor2D that are positioned
 * relative to one another.
 *
 * !!! note 
 *     In cascaded sequences, each vtkCoordinate object may be specified in different coordinate systems!
 *
 * How the data may go from a dataset through the rendering pipeline in steps
 *
 * Dataset -> GPU buffer:  DCBCMatrix usually this is just a shift and/or scale
 * to get the GPU buffer for the points into values that will nto run into
 * floating point resolution issues. This is handled when creating the buffer
 *
 * - Buffer to Model: BCMCMatrix just reverses the shift/scale applied to the
 *   buffer above
 * - Model to World: MCWCMatrix uses the Actor's matrix to transform the points
 *   to World coordinates
 * - World to Stabilized: WCSCMatrix Maps world to the shifted maybe scalede
 *   renderer's stabilized center/matrix
 * - Stabilized to View: SCVCMatrix captures the rest of the transformation to
 *   View coordinates
 * - View to Projection: VCPCMatrix cpatures the ortho/perspective matrix
 * - Projection to ...: done by the GPU hardware as part of the vertex to
 *   fragment
 *
 * Typically the process is simplified into the 4 following steps :
 *
 * - DataSet to Buffer - done when creating the buffer
 * - Buffer To Stabilized - BCSCMatrix done in the vertex shader, part of the
 *   mapperUBO
 * - Stabilized To Projection - SCPCMatrix second matrix mult done in the vertex
 *   shader, part of the rendererUBO
 * - Projection to ...: vertex to fragment shader operations
 *
 * @see [vtkActor](./Rendering_Core_Actor.html)2D
 */
export declare const vtkCoordinate: {
	newInstance: typeof newInstance;
	extend: typeof extend;
	Coordinate: typeof Coordinate;
};
export default vtkCoordinate;
