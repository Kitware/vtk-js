
import { vtkObject } from "../../../interfaces";
import { RGBColor, Size } from "../../../types";
import vtkActor2D from '../Actor2D';
import vtkProp from '../Prop';

export interface IViewportInitialValues {
    background?: RGBColor;
    background2?: RGBColor;
    gradientBackground?: boolean;
    viewport?: number[];
    aspect?: number[];
    pixelAspect?: number[];
    props?: vtkProp[];
    actors2D?: vtkActor2D[];
}

export interface vtkViewport extends vtkObject {

    /**
     * Not Implemented yet
     */
    addActor2D(): any;

    /**
     * Add a prop to the list of props.
     * @param prop 
     */
    addViewProp(prop: vtkProp): void;

    /**
     * Convert display coordinates to view coordinates.
     */
    displayToView(): any;

    /**
     * 
     */
    getActors2D(): vtkActor2D[];

    /**
     * 
     */
    getBackground2(): number[];

    /**
    * 
    */
    getBackground2ByReference(): number[];

    /**
     * 
     */
    getBackground(): number[];

    /**
     * 
     */
    getBackgroundByReference(): number[];

    /**
     * 
     */
    getSize(): Size;

    /**
     * 
     */
    getViewport(): vtkViewport;

    /**
     * 
     */
    getViewportByReference(): vtkViewport;

    /**
     * 
     */
    getViewPropsWithNestedProps(): any;

    /**
     * 
     */
    getViewProps(): vtkProp[];

    /**
     * 
     * @param prop 
     */
    hasViewProp(prop: vtkProp): boolean;

    /**
     * 
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
     */
    normalizedDisplayToProjection(x: number, y: number, z: number): number[];

    /**
     * 
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
     */
    normalizedDisplayToNormalizedViewport(x: number, y: number, z: number): any;

    /**
     * 
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
     */
    normalizedViewportToProjection(x: number, y: number, z: any): number[];

    /**
     * 
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
     */
    projectionToNormalizedDisplay(x: number, y: number, z: number): number[];

    /**
     * 
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
     */
    normalizedViewportToNormalizedDisplay(x: number, y: number, z: number): number[];

    /**
     * Set the viewport background.
     * @param {Number} r Defines the red component (between 0 and 1).
     * @param {Number} g Defines the green component (between 0 and 1).
     * @param {Number} b Defines the blue component (between 0 and 1).
     */
    setBackground(r: number, g: number, b: number): boolean;

    /**
     * Set the viewport background.
     * @param {Number[]} background The RGB color array. 
     */
    setBackground(background: number[]): boolean;

    /**
     * 
     * @param {Number} r Defines the red component (between 0 and 1).
     * @param {Number} g Defines the green component (between 0 and 1).
     * @param {Number} b Defines the blue component (between 0 and 1).
     */
    setBackground2(r: number, g: number, b: number): boolean;

    /**
     * 
     * @param {Number[]} background 
     */
    setBackground2(background: number[]): boolean;

    /**
     * 
     * @param {Number[]} background 
     */
    setBackground2From(background: number[]): boolean;

    /**
     * 
     * @param {Number[]} background 
     */
    setBackgroundFrom(background: number[]): boolean;

    /**
     * Specify the viewport for the Viewport to draw in the rendering window.
     * Each coordinate is 0 <= coordinate <= 1.0.
     * @param {Number} xmin The xmin coordinate.
     * @param {Number} ymin The ymin coordinate.
     * @param {Number} xmax The xmax coordinate.
     * @param {Number} ymax The ymax coordinate.
     */
    setViewport(xmin: number, ymin: number, xmax: number, ymax: number): boolean;

    /**
     * Specify the viewport for the Viewport to draw in the rendering window.
     * Coordinates are expressed as [xmin, ymin, xmax, ymax], where each coordinate is 0 <= coordinate <= 1.0.
     * @param {Number[]} viewport 
     */
    setViewportFrom(viewport: number[]): boolean;

    /**
     * 
     * @param prop 
     */
    removeViewProp(prop: vtkProp): void;

    /**
     * 
     */
    removeAllViewProps(): void;

    /**
     * 
     * @param prop 
     */
    removeActor2D(prop: vtkProp): void;

    /**
     * 
     */
    viewToDisplay(): any;

    /**
     * 
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
     */
    projectionToNormalizedViewport(x: number, y: number, z: number): number[];


    /**
     * Not Implemented yet
     */
    PickPropFrom(): any;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkViewport characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IViewportInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IViewportInitialValues): void;

/**
 * Method use to create a new instance of vtkViewport 
 */
export function newInstance(initialValues?: IViewportInitialValues): vtkViewport;

/** 
 * vtkViewport represents part or all of a RenderWindow. It holds a
 * collection of props that will be rendered into the area it represents.
 * This class also contains methods to convert between coordinate systems
 * commonly used in rendering.
 * 
 * @see [vtkActor](./Rendering_Core_Actor.html)
 * @see [vtkCoordinate](./Rendering_Core_Coordinate.html)
 * @see [vtkProp](./Rendering_Core_Prop.html)
 * @see [vtkRender](./Rendering_Core_Renderer.html)
 * @see [vtkRenderWindow](./Rendering_Core_RenderWindow.html)
 * @see [vtkVolume](./Rendering_Core_Volume.html)
 */
export declare const vtkViewport: {
    newInstance: typeof newInstance,
    extend: typeof extend,
};
export default vtkViewport;
