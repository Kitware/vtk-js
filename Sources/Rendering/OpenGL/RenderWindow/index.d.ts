import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { Vector2, Vector3 } from '../../../types';
import { vtkRenderer } from '../../../Rendering/Core/Renderer';

/**
 *
 */
export interface ILineSourceInitialValues {
	resolution?: number;
	point1?: Vector3;
	point2?: Vector3;
	pointType?: string;
}

type vtkOpenGLRenderWindowBase = vtkObject & Omit<vtkAlgorithm,
	| 'getInputData'
	| 'setInputData'
	| 'setInputConnection'
	| 'getInputConnection'
	| 'addInputConnection'
	| 'addInputData'>;

export interface vtkOpenGLRenderWindow extends vtkOpenGLRenderWindowBase {

	/**
	 * Builds myself.
	 * @param prepass 
	 */
	buildPass(prepass : any): void;

	/**
	 * 
	 */
	initialize(): void;

	/**
	 * 
	 */
	makeCurrent(): void;

	/**
	 * 
	 * @param el 
	 */
	setContainer(el : any): void;

	/**
	 * 
	 */
	getContainer(): void;

	/**
	 * 
	 */
	getContainerSize(): Vector2;

	/**
	 * 
	 */
	getFramebufferSize(): Vector2;

	/**
	 * 
	 * @param x 
	 * @param y 
	 * @param viewport 
	 */
	isInViewport(x : number, y : number, viewport : vtkRenderer): boolean;

	/**
	 * 
	 * @param viewport 
	 */
	getViewportSize(viewport : vtkRenderer): Vector2;

	/**
	 * 
	 * @param viewport 
	 */
	getViewportCenter(viewport : vtkRenderer): Vector2;

	/**
	 * 
	 * @param x 
	 * @param y 
	 * @param z 
	 */
	displayToNormalizedDisplay(x : number, y : number, z : number): Vector3;

	/**
	 * 
	 * @param x 
	 * @param y 
	 * @param z 
	 */
	normalizedDisplayToDisplay(x : number, y : number, z : number): Vector3;

	/**
	 * 
	 * @param x 
	 * @param y 
	 * @param z 
	 * @param renderer 
	 */
	worldToView(x : number, y : number, z : number, renderer : vtkRenderer): Vector3;

	/**
	 * 
	 * @param x 
	 * @param y 
	 * @param z 
	 * @param renderer 
	 */
	viewToWorld(x : number, y : number, z : number, renderer : vtkRenderer): Vector3;

	/**
	 * 
	 * @param x 
	 * @param y 
	 * @param z 
	 * @param renderer 
	 */
	worldToDisplay(x : number, y : number, z : number, renderer : vtkRenderer): Vector3;

	/**
	 * 
	 * @param x 
	 * @param y 
	 * @param z 
	 * @param renderer 
	 */
	displayToWorld(x : number, y : number, z : number, renderer : vtkRenderer): Vector3;

	/**
	 * 
	 * @param x 
	 * @param y 
	 * @param z 
	 * @param renderer 
	 */
	normalizedDisplayToViewport(x : number, y : number, z : number, renderer : vtRenderer): Vector3;

	/**
	 * 
	 * @param x 
	 * @param y 
	 * @param z 
	 * @param renderer 
	 */
	viewportToNormalizedViewport(x : number, y : number, z : number, renderer : vtkRenderer): Vector3;

	/**
	 * 
	 * @param x 
	 * @param y 
	 * @param z 
	 */
	normalizedViewportToViewport(x : number, y : number, z : number): Vector3;

	/**
	 * 
	 * @param x 
	 * @param y 
	 * @param z 
	 */
	displayToLocalDisplay(x : number, y : number, z : number): Vector3;

	/**
	 * 
	 * @param x 
	 * @param y 
	 * @param z 
	 * @param renderer 
	 */
	viewportToNormalizedDisplay(x : number, y number, z : number, renderer : vtkRenderer): Vector3;

	/**
	 * 
	 * @param x1 
	 * @param y1 
	 * @param x2 
	 * @param y2 
	 */
	getPixelData(x1 : number, y1 : number, x2 : number, y2 : number): Uint8Array;

	/**
	 * 
	 * @param options 
	 */
	get3DContext(options : object): WebGLRenderingContext | null;

	/**
	 * 
	 */
	startVR(): void;

	/**
	 * 
	 */
	stopVR(): void;

	/**
	 * 
	 */
	vrRender(): void;

	/**
	 * 
	 */
	restoreContext(): void;

	/**
	 * 
	 * @param texture 
	 */
	activateTexture(texture : any): void;

	/**
	 * 
	 * @param texture 
	 */
	deactivateTexture(texture : any): void;

	/**
	 * 
	 * @param texture 
	 */
	getTextureUnitForTexture(texture : any): number;

	/**
	 * 
	 * @param vtktype 
	 * @param numComps 
	 * @param useFloat 
	 */
	getDefaultTextureInternalFormat(vtktype : any, numComps : any, useFloat : any): void;

	/**
	 * 
	 * @param img 
	 */
	setBackgroundImage(img : any): void;

	/**
	 * 
	 * @param value 
	 */
	setUseBackgroundImage(value : boolean): void;

	/**
	 * Capture a screenshot of the contents of this renderwindow.  The options
	 * object can include a `size` array (`[w, h]`) or a `scale` floating point
	 * value, as well as a `resetCamera` boolean.  If `size` is provided, the
	 * captured screenshot will be of the given size (and `resetCamera` could be
	 * useful in this case if the aspect ratio of `size` does not match the
	 * current renderwindow size).  Otherwise, if `scale` is provided, it will
	 * be multiplied by the current renderwindow size to compute the screenshot
	 * size.  If no `size` or `scale` are provided, the current renderwindow
	 * size is assumed.  The default format is "image/png". Returns a promise
	 * that resolves to the captured screenshot.
	 * @param format 
	 * @param options 
	 */
	captureNextImage(format : string, options: object): Promise<string> | null;

	/**
	 * 
	 */
	getGLInformations(): object;

	/**
	 * 
	 */
	traverseAllPasses(): void;

	/**
	 * 
	 */
	disableDepthMask(): void;

	/**
	 * 
	 */
	enableDepthMask(): void;

	/**
	 * 
	 */
	disableCullFace(): void;

	/**
	 * 
	 */
	enableCullFace(): void;

	/**
	 * 
	 * @param stream 
	 */
	setViewStream(stream : any): boolean;

	/**
	 * 
	 * @param size 
	 */
	 setSize(size : Vector2): void;

	/**
	 * 
	 * @param x 
	 * @param y 
	 */
	 setSize(x : number, y : number): void;

	/**
	 * 
	 */
	 getSize(): Vector2;

	/**
	 * 
	 * @param size 
	 */
	 setVrResolution(size : Vector2): void;

	/**
	 * 
	 * @param x 
	 * @param y 
	 */
	 setVrResolution(x : number, y : number): void;

	/**
	 * 
	 */
	 getVrResolution(): Vector2;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkOpenGLRenderWindow characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ILineSourceInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ILineSourceInitialValues): void;

/**
 * Method used to create a new instance of vtkOpenGLRenderWindow.
 * @param {ILineSourceInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ILineSourceInitialValues): vtkOpenGLRenderWindow;

export declare const vtkOpenGLRenderWindow: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkOpenGLRenderWindow;
