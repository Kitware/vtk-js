import { VtkObject, VtkSubscription } from "vtk.js/Sources/macro";
import vtkRenderer from "vtk.js/Sources/Rendering/Core/Renderer";
import vtkRenderWindowInteractor from "vtk.js/Sources/Rendering/Core/RenderWindowInteractor";
// import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';

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

export const enum DEFAULT_VIEW_API {
	'WebGL',
	'WebGPU'
} 

export interface vtkRenderWindow extends VtkObject {

	/**
	 * Add renderer
	 * @param renderer 
	 */
	addRenderer(renderer: vtkRenderer): void;

	/**
	 * Add renderer
	 * @param view 
	 */
	addView(view: any): void;

	/**
	 * 
	 * @param format 
	 */
	captureImages(format: string): void;

	/**
	 * 
	 */
	getDefaultViewAPI(): string;

	/**
	 * 
	 */
	getInteractor(): vtkRenderWindowInteractor;

	/**
	 * 
	 */
	getNumberOfLayers(): number;

	/**
	 * 
	 */
	getNeverRendered(): boolean;

	/**
	 * 
	 */
	getRenderers(): vtkRenderer[];

	/**
	 * 
	 */
	getRenderersByReference(): vtkRenderer[];

	/**
	 * 
	 * @return  
	 */
	getStatistics(): IStatistics;

	/**
	 * 
	 */
	getViews(): any[];

	// getViews(): vtkOpenGLRenderWindow[];

	/**
	 * 
	 * @param ren 
	 * @return  
	 */
	hasRenderer(ren: vtkRenderer): boolean;

	/**
	 * 
	 * @param view 
	 * @return  
	 */
	hasView(view: any): boolean;

	//hasView(view: vtkOpenGLRenderWindow): boolean;

	/**
	 * 
	 * @param callback 
	 */
	onCompletion(callback: (instance: VtkObject) => any): VtkSubscription;

	/**
	 * 
	 * @param name 
	 * @param initialValues 
	 */
	newAPISpecificView(name: string, initialValues = {}): any;

	/**
	 * Remove renderer
	 * @param renderer 
	 */
	removeRenderer(renderer: vtkRenderer): void;

	/**
	 * Remove renderer
	 * @param view 
	 */
	removeView(view: any): void;

	/**
	 * 
	 */
	render(): void;

	/**
	 * 
	 * @param defaultViewAPI 
	 */
	setDefaultViewAPI(defaultViewAPI: DEFAULT_VIEW_API): boolean;

	/**
	 * 
	 * @param interactor 
	 */
	setInteractor(interactor: vtkRenderWindowInteractor): boolean;

	/**
	 * 
	 * @param numberOfLayers 
	 */
	setNumberOfLayers(numberOfLayers: number): boolean;

	/**
	 * 
	 * @param views 
	 */
	setViews(views: any[]): boolean;

	// setViews(views: vtkOpenGLRenderWindow[]): boolean;
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
 * 
 */
export function registerViewConstructor(name: string, constructor: any): void;

/**
 * 
 */
export function listViewAPIs(): string[];

/**
 * 
 */
export function newAPISpecificView(name: string, initialValues = {}): any;



/** 
 * vtkRenderWindow represents part or all of a RenderWindow. It holds a
 * colleciton of props that will be rendered into the area it represents.
 * This class also contains methods to convert between coordinate systems
 * commonly used in rendering.
 * 
 * @see [vtkActor](./Rendering_Core_Actor.html)
 * @see vtkCoordinate
 * @see vtkProp
 * @see vtkRenderer
 * @see vtkRenderWindow
 * @see vtkVolume
 */
export declare const vtkRenderWindow: {
	newInstance: typeof newInstance,
	extend: typeof extend,
	registerViewConstructor: typeof registerViewConstructor,
	listViewAPIs: typeof listViewAPIs,
	newAPISpecificView: typeof newAPISpecificView,
};
export default vtkRenderWindow;
