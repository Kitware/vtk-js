import { vtkObject } from "../../../interfaces";
import vtkAnnotatedCubeActor from "../../../Rendering/Core/AnnotatedCubeActor";
import vtkAxesActor from "../../../Rendering/Core/AxesActor";
import vtkRenderer from "../../../Rendering/Core/Renderer";
import vtkRenderWindowInteractor from "../../../Rendering/Core/RenderWindowInteractor";
import { Nullable } from "../../../types";
import { Corners } from "./Constants";


/**
 * 
 */
export interface IOrientationMarkerWidgetInitialValues {
	actor?: vtkAnnotatedCubeActor | vtkAxesActor,
	interactor?: vtkRenderWindowInteractor,
	parentRenderer?: vtkRenderer,
	viewportCorner?: Corners,
	viewportSize?: number,
	minPixelSize?: number,
	maxPixelSize?: number
}

export interface vtkOrientationMarkerWidget extends vtkObject {

	/**
	 * Get the computed viewport size.
	 * The format is `[left, bottom, right, top]`.
	 */
	computeViewport(): [number, number, number, number];

	/**
	 * Dereference any internal object and remove any subscription.
	 * It gives custom class to properly detach themselves from the DOM
	 * or any external dependency that could prevent their deletion
	 * when the GC runs.
	 */
	delete(): void;

	/**
	 * 
	 */
	getActor(): vtkAnnotatedCubeActor | vtkAxesActor;

	/**
	 * Gets the parent renderer, if any.
	 */
	getParentRenderer(): Nullable<vtkRenderer>;

	/**
	 * Get wheter the orientation marker is enabled.
	 */
	getEnabled(): boolean;

	/**
	 * Get the render window interactor associated with the widget.
	 */
	getInteractor(): vtkRenderWindowInteractor;

	/**
	 * Get the maximum side length, in pixels, for the orientation marker widget
	 * viewport.
	 */
	getMaxPixelSize(): number;

	/**
	 * Get the minimum side length, in pixels, for the orientation marker widget
	 * viewport.
	 */
	getMinPixelSize(): number;

	/**
	 * Get the renderer associated with the widget.
	 */
	getRenderer(): vtkRenderer;

	/**
	 * Get the viewport corner.
	 */
	getViewportCorner(): Corners;

	/**
	 * Get the viewport size.
	 */
	getViewportSize(): number;
	
	/**
	 * Get the actor associated with the widget.
	 * @param {vtkAnnotatedCubeActor | vtkAxesActor} actor The actor instance.
	 */
	setActor(actor: vtkAnnotatedCubeActor | vtkAxesActor): void;

	/**
	 * Sets the parent renderer
	 * @param {vtkRenderer} ren The parent renderer
	 */
	setParentRenderer(ren: vtkRenderer): boolean;

	/**
	 * Set the widget enabled status, i.e. to show the widget or not.
	 * @param {Boolean} enabled 
	 */
	setEnabled(enabled: boolean): void;

	/**
	 * Set the render window interactor associated with the widget.
	 * @param {vtkRenderWindowInteractor} interactor 
	 */
	setInteractor(interactor: vtkRenderWindowInteractor): boolean;

	/**
	 * Set the maximum side length, in pixels, for the orientation marker widget
	 * viewport.
	 * @param {Number} pixelSize 
	 * @default 200 
	 */
	setMaxPixelSize(pixelSize: number): boolean;

	/**
	 * Set the minimum side length, in pixels, for the orientation marker widget
	 * viewport.
	 * @param {Number} pixelSize 
	 * @default 50 
	 */
	setMinPixelSize(pixelSize: number): boolean;

	/**
	 * Set which corner to put the widget's viewport.
	 * @param {Corners} viewportCorner 
	 * @default BOTTOM_LEFT
	 */
	setViewportCorner(viewportCorner: Corners): boolean;

	/**
	 * Set the viewport size.
	 * The sizeFactor should be between 0.0 and 1.0.
	 * It says how much of the main render window to color.
	 * @param {Number} sizeFactor 
	 * @default 0.2
	 */
	setViewportSize(sizeFactor: number): void;

	/**
	 * Manually updates the marker's orientation.
	 */
	updateMarkerOrientation(): void;

	/**
	 * Updates the orientation widget viewport size.
	 */
	updateViewport(): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkOrientationMarkerWidget characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IOrientationMarkerWidgetInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IOrientationMarkerWidgetInitialValues): void;

/**
 * Method used to create a new instance of vtkOrientationMarkerWidget
 * @param {IOrientationMarkerWidgetInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IOrientationMarkerWidgetInitialValues): vtkOrientationMarkerWidget;


/**
 * vtkOrientationMarkerWidget is a 2D widget for manipulating a marker prop
 */
export declare const vtkOrientationMarkerWidget: {
	newInstance: typeof newInstance;
	extend: typeof extend;
	Corners: typeof Corners;
}
export default vtkOrientationMarkerWidget;
