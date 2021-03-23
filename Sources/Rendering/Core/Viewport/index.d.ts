
import { VtkObject } from 'vtk.js/Sources/macro';
import vtkActor2D from 'vtk.js/Sources/Rendering/Core/Actor2D';
import vtkProp from 'vtk.js/Sources/Rendering/Core/Prop';

interface IViewportInitialValues {
    /**
     * 
     */
    background: number[];

    /**
     * 
     */
    background2: number[];

    /**
     * 
     */
    gradientBackground: boolean;

    /**
     * 
     */
    viewport: number[];

    /**
     * 
     */
    aspect: number[];

    /**
     * 
     */
    pixelAspect: number[];

    /**
     * 
     */
    props: vtkProp[];

    /**
     * 
     */
    actors2D: vtkActor2D[];
}

export interface vtkViewport extends VtkObject {


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
    getSize(): any;

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
     * @param x 
     * @param y 
     * @param z 
     */
    normalizedDisplayToProjection(x: number, y: number, z: number): number[];

    /**
     * 
     * @param x 
     * @param y 
     * @param z 
     */
    normalizedDisplayToNormalizedViewport(x: number, y: number, z: number): any;

    /**
     * 
     * @param x 
     * @param y 
     * @param z 
     */
    normalizedViewportToProjection(x: number, y: number, z: any): number[];

    /**
     * 
     * @param x 
     * @param y 
     * @param z 
     */
    projectionToNormalizedDisplay(x: number, y: number, z: number): number[];

    /**
     * 
     * @param x 
     * @param y 
     * @param z 
     */
    normalizedViewportToNormalizedDisplay(x: number, y: number, z: number): number[];

    /**
     * 
     * @param r 
     * @param g 
     * @param b 
     */
    setBackground(r: number, g: number, b: number): boolean;

    /**
     * 
     * @param r 
     * @param g 
     * @param b 
     */
    setBackground2(r: number, g: number, b: number): boolean;

    /**
     * 
     * @param background2 
     */
    setBackground2From(background2: number[]): boolean;

    /**
     * 
     * @param background 
     */
    setBackgroundFrom(background: number[]): boolean;

    /**
     * Specify the viewport for the Viewport to draw in the rendering window.
     * Each coordinate is 0 <= coordinate <= 1.0.
     * @param xmin 
     * @param ymin 
     * @param xmax 
     * @param ymax 
     */
    setViewport(xmin: number, ymin: number, xmax: number, ymax: number): boolean;

    /**
     * Specify the viewport for the Viewport to draw in the rendering window.
     * Coordinates are expressed as [xmin, ymin, xmax, ymax], where each coordinate is 0 <= coordinate <= 1.0.
     * @param viewport 
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
     * @param x 
     * @param y 
     * @param z 
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
 * @param initialValues (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IViewportInitialValues): void;

/**
 * Method use to create a new instance of vtkViewport 
 */
export function newInstance(initialValues?: IViewportInitialValues): vtkViewport;

/** 
 * vtkViewport represents part or all of a RenderWindow. It holds a
 * colleciton of props that will be rendered into the area it represents.
 * This class also contains methods to convert between coordinate systems
 * commonly used in rendering.
 * 
 * @see vtkActor
 * @see vtkCoordinate
 * @see vtkProp
 * @see vtkRenderer
 * @see vtkRenderWindow
 * @see vtkVolume
 */
export declare const vtkViewport: {
    newInstance: typeof newInstance,
    extend: typeof extend,
};
export default vtkViewport;
