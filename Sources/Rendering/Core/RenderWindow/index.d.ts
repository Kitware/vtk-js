import { VtkObject } from "vtk.js/Sources/macro";
import vtkRenderer from "vtk.js/Sources/Rendering/Core/Renderer";
import vtkRenderWindow from "vtk.js/Sources/Rendering/Core/Viewport";

interface IRenderWindowInitialValues {
    /**
     * 
     */
    renderers?: vtkRenderer[],

    /**
     * 
     */
    views?: vtkRenderWindow[],

    /**
     * 
     */
    interactor?: any,

    /**
     * 
     */
    neverRendered?: boolean,

    /**
     * 
     */
    numberOfLayers?: number
}

interface IStatistics {

    /**
     * 
     */
    propCount: number;

    /**
     * 
     */
    invisiblePropCount: number;

    /**
     * 
     */
    str: string;
}

export interface vtkRenderWindow extends VtkObject {

    /**
     * Add renderer
     * @param renderer 
     */
    addRenderer(renderer: vtkRenderer): void;

    /**
     * Remove renderer
     * @param renderer 
     */
    removeRenderer(renderer: vtkRenderer): void;

    /**
     * 
     * @param ren 
     * @return  
     */
    hasRenderer(ren: vtkRenderer): boolean;

    /**
     * Add renderer
     * @param view 
     */
    addView(view: any): void;

    /**
     * Remove renderer
     * @param view 
     */
    removeView(view: any): void;

    /**
     * 
     * @param view 
     * @return  
     */
    hasView(view: any): boolean;

    /**
     * 
     */
    render(): void;

    /**
     * 
     * @return  
     */
    getStatistics(): IStatistics;

    /**
     * 
     * @param format 
     */
    captureImages(format: string): void;
}


/**
 * Method use to decorate a given object (publicAPI+model) with vtkRenderWindow characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param initialValues (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IRenderWindowInitialValues): void;

/**
 * Method use to create a new instance of vtkRenderWindow 
 */
export function newInstance(initialValues?: IRenderWindowInitialValues): vtkRenderWindow;

/** 
 * vtkRenderWindow represents part or all of a RenderWindow. It holds a
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
export declare const vtkRenderWindow: {
    newInstance: typeof newInstance,
    extend: typeof extend,
};
export default vtkRenderWindow;
