
import { Placement } from "../../../types";
import vtkGenericRenderWindow, { IGenericRenderWindowInitialValues } from "../GenericRenderWindow";

/**
 *
 */
export interface IRenderWindowWithControlBarInitialValues extends IGenericRenderWindowInitialValues{
	rootContainer?: HTMLElement,
	controlPosition?: Placement;
	controlSize?: number;
}

export interface vtkRenderWindowWithControlBar extends vtkGenericRenderWindow {

	/**
	 * Get control bar container element
	 */
	getControlContainer(): HTMLElement;

	/**
	 * Get RenderWindow container element
	 */
	getRenderWindowContainer(): HTMLElement;

	/**
	 * Get root container element
	 */
	getRootContainer(): HTMLElement;

	/**
	 * Set control container element
	 * @param {HTMLElement} el 
	 */
	setContainer(el: HTMLElement): void;

	/**
	 * Set control container element
	 * @param {Number} size Size of the control bar.
	 */
	setControlSize(size: number): void;

	/**
	 * Set control container element
	 * @param {Placement} position Position of the control bar.
	 */
	setControlPosition(position: Placement): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkRenderWindowWithControlBar characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IRenderWindowWithControlBarInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IRenderWindowWithControlBarInitialValues): void;

/**
 * Method used to create a new instance of vtkRenderWindowWithControlBar
 * @param {IRenderWindowWithControlBarInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IRenderWindowWithControlBarInitialValues): vtkRenderWindowWithControlBar;

/**
 * vtkRenderWindowWithControlBar provides a skeleton for implementing a render window
 * with a control bar.
 */
export declare const vtkRenderWindowWithControlBar: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkRenderWindowWithControlBar;
