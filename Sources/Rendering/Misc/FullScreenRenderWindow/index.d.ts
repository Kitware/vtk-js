import { vtkObject } from "../../../interfaces";
import { RGBColor } from "../../../types";
import vtkRenderer from "../../Core/Renderer";
import vtkRenderWindow from "../../Core/RenderWindow";
import vtkRenderWindowInteractor from "../../Core/RenderWindowInteractor";

// import vtkOpenGLRenderWindow from "../../../OpenGL/RenderWindow";
// import vtkWebGPURenderWindow from "../../../WebGPU/RenderWindow";


/**
 *
 */
export interface IFullScreenRenderWindowInitialValues {
	background?: RGBColor;
	container?: HTMLElement
	containerStyle?: object;
	controlPanelStyle?: object;
	controllerVisibility?: boolean;
	listenWindowResize?: boolean;
	resizeCallback?: any;
}


export interface vtkFullScreenRenderWindow extends vtkObject {

	/**
	 * 
	 * @param {HTMLElement} html 
	 */
	addController(html : HTMLElement): void;
		
	/**
	 * Representation API
	 * @param representation 
	 */
	addRepresentation(representation : any): void;

	/**
	 * Release GL context
	 */
	delete(): void;

	/**
	 * 
	 */
	getApiSpecificRenderWindow(): any; // vtkOpenGLRenderWindow || vtkWebGPURenderWindow

	/**
	 * Get container element
	 */
	getContainer(): HTMLElement;

	/**
	 * Get control container element
	 */
	getControlContainer(): HTMLElement;

	/**
	 * Get interactor object
	 */
	getInteractor(): vtkRenderWindowInteractor;

	/**
	 * Get Render windows object
	 */
	getRenderWindow(): vtkRenderWindow;

	/**
	 * Get Renderer object
	 */
	getRenderer(): vtkRenderer;

	/**
	 * Get root container element
	 */
	getRootContainer(): HTMLElement;

	/**
	 * Remove controller
	 */
	removeController(): void;

	/**
	 * Remove representation
	 * @param representation 
	 */
	removeRepresentation(representation : any): void;

	/**
	 * Handle window resize
	 */
	resize(): void;

	/**
	 * Set background color
	 * @param {Number[]} background The background color.
	 */
	setBackground(background: number[]): boolean;

	/**
	 * Hide or show controller
	 * @param {Boolean} visible 
	 */
	setControllerVisibility(visible : boolean): void;

	/**
	 * 
	 * @param cb 
	 */
	setResizeCallback(cb : any): void;

	/**
	 * Toggle controller visibility
	 */
	toggleControllerVisibility(): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkFullScreenRenderWindow characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IFullScreenRenderWindowInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IFullScreenRenderWindowInitialValues): void;

/**
 * Method used to create a new instance of vtkFullScreenRenderWindow
 * @param {IFullScreenRenderWindowInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IFullScreenRenderWindowInitialValues): vtkFullScreenRenderWindow;

/**
 * vtkFullScreenRenderWindow provides a skeleton for implementing a fullscreen
 * render window.
 */
export declare const vtkFullScreenRenderWindow: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkFullScreenRenderWindow;
