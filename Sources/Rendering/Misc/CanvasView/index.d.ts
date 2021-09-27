import { vtkObject } from "../../../interfaces";
import { Size } from "../../../types";


/**
 *
 */
export interface ICanvasViewInitialValues {
	canvas?: HTMLCanvasElement;
	size?: Size;
	cursorVisibility?: boolean;
	cursor?: string;
	useOffScreen?: boolean;
	useBackgroundImage?: boolean;
}


export interface vtkCanvasView extends vtkObject {

	/**
	 * Get the canvas element
	 */
	getCanvas(): HTMLCanvasElement;

	/**
	 * Get the used cursor
	 */
	getCursor(): string;

	/**
	 * 
	 */
	getInteractive(): boolean;

	/**
	 * Get the interactor
	 */
	getInteractor(): any;

	/**
	 * 
	 */
	getRenderable(): any;

	/**
	 * 
	 */
	getRenderers(): any[];

	/**
	 * 
	 */
	getRenderersByReference(): any[];

	/**
	 * Get the size of the canvas view
	 */
	getSize(): Size;

	/**
	 * Get the size of the canvas view
	 */
	getSizeByReference(): boolean;

	/**
	 * 
	 */
	getUseBackgroundImage(): boolean;

	/**
	 * 
	 */
	getUseOffScreen(): boolean;

	/**
	 * 
	 */
	isInViewport(): boolean;

	/**
	 * 
	 * @param {HTMLImageElement} backgroundImage The background image HTML element.
	 */
	setBackgroundImage(backgroundImage: HTMLImageElement): boolean;

	/**
	 * 
	 * @param {HTMLCanvasElement} canvas The canvas HTML element.
	 */
	setCanvas(canvas: HTMLCanvasElement): boolean;

	/**
	 * 
	 * @param {HTMLElement} container The container HTML element.
	 */
	setContainer(container: HTMLElement): boolean;

	/**
	 * 
	 * @param {String} cursor The used cursor.
	 */
	setCursor(cursor: string): boolean;

	/**
	 * 
	 * @param interactor 
	 */
	setInteractor(interactor: any): boolean;

	/**
	 * Set the size of the canvas view.
	 * @param {Size} size The size of the canvas view.
	 */
	setSize(size: Size): boolean;

	/**
	 * Set the size of the canvas view.
	 * @param {Number} width The width of the canvas view.
	 * @param {Number} height The height of the canvas view.
	 */
	setSize(width: number, height: number): boolean;

	/**
	 * Set the size of the canvas view.
	 * @param {Size} size The size of the canvas view.
	 */
	setSizeFrom(size: Size): boolean;

	/**
	 * 
	 * @param useBackgroundImage 
	 */
	setUseBackgroundImage(useBackgroundImage: boolean): void;

	/**
	 * 
	 * @param useOffScreen 
	 */
	setUseOffScreen(useOffScreen: boolean): boolean;

	/**
	 * 
	 * @param viewStream 
	 */
	setViewStream(viewStream: any): boolean; // viewStream is vtkViewStream

	/**
	 * 
	 */
	traverseAllPasses(): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkCanvasView characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ICanvasViewInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ICanvasViewInitialValues): void;

/**
 * Method used to create a new instance of vtkCanvasView
 * @param {ICanvasViewInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ICanvasViewInitialValues): vtkCanvasView;

/**
 * vtkCanvasView provides a way to create a canvas view.
 */
export declare const vtkCanvasView: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkCanvasView;
