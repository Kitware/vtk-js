import { vtkAlgorithm, vtkObject } from "../../../interfaces";
import { Vector2, Vector3 } from "../../../types";

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
	getContainerSize(): Array</* ?,? */ any>;

	/**
	 * 
	 */
	getFramebufferSize(): Array<number>;

	/**
	 * 
	 * @param x 
	 * @param y 
	 * @param viewport 
	 */
	isInViewport(x : any, y : any, viewport : any): boolean;

	/**
	 * 
	 * @param viewport 
	 */
	getViewportSize(viewport : any): VtkOpenGLRenderWindow0.GetViewportSizeRet;

	/**
	 * 
	 * @param viewport 
	 */
	getViewportCenter(viewport : any): VtkOpenGLRenderWindow0.GetViewportCenterRet;

	/**
	 * 
	 * @param x 
	 * @param y 
	 * @param z 
	 */
	displayToNormalizedDisplay(x : any, y : any, z : any): VtkOpenGLRenderWindow0.DisplayToNormalizedDisplayRet;

	/**
	 * 
	 * @param x 
	 * @param y 
	 * @param z 
	 */
	normalizedDisplayToDisplay(x : number, y : number, z : number): VtkOpenGLRenderWindow0.NormalizedDisplayToDisplayRet;

	/**
	 * 
	 * @param x 
	 * @param y 
	 * @param z 
	 * @param renderer 
	 */
	worldToView(x : any, y : any, z : any, renderer : any): void;

	/**
	 * 
	 * @param x 
	 * @param y 
	 * @param z 
	 * @param renderer 
	 */
	viewToWorld(x : any, y : any, z : any, renderer : any): void;

	/**
	 * 
	 * @param x 
	 * @param y 
	 * @param z 
	 * @param renderer 
	 */
	worldToDisplay(x : any, y : any, z : any, renderer : any): Array</* number,number,number */ any>;

	/**
	 * 
	 * @param x 
	 * @param y 
	 * @param z 
	 * @param renderer 
	 */
	displayToWorld(x : any, y : any, z : any, renderer : any): void;

	/**
	 * 
	 * @param x 
	 * @param y 
	 * @param z 
	 * @param renderer 
	 */
	normalizedDisplayToViewport(x : any, y : any, z : any, renderer : any): VtkOpenGLRenderWindow0.NormalizedDisplayToViewportRet;

	/**
	 * 
	 * @param x 
	 * @param y 
	 * @param z 
	 * @param renderer 
	 */
	viewportToNormalizedViewport(x : any, y : any, z : any, renderer : any): VtkOpenGLRenderWindow0.ViewportToNormalizedViewportRet;

	/**
	 * 
	 * @param x 
	 * @param y 
	 * @param z 
	 */
	normalizedViewportToViewport(x : any, y : any, z : any): VtkOpenGLRenderWindow0.NormalizedViewportToViewportRet;

	/**
	 * 
	 * @param x 
	 * @param y 
	 * @param z 
	 */
	displayToLocalDisplay(x : any, y : any, z : any): VtkOpenGLRenderWindow0.DisplayToLocalDisplayRet;

	/**
	 * 
	 * @param x 
	 * @param y 
	 * @param z 
	 * @param renderer 
	 */
	viewportToNormalizedDisplay(x : any, y : any, z : any, renderer : any): Array</* number,number,? */ any>;

	/**
	 * 
	 * @param x1 
	 * @param y1 
	 * @param x2 
	 * @param y2 
	 */
	getPixelData(x1 : any, y1 : any, x2 : any, y2 : any): Float32Array;

	/**
	 * 
	 * @param options 
	 */
	get3DContext(options : object): void;

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
	captureNextImage(format : any, options: object): /* VtkOpenGLRenderWindow0.+Promise */ any;

	/**
	 * 
	 */
	getGLInformations(): VtkOpenGLRenderWindow0.GetGLInformationsRet;

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

/**
 * vtkOpenGLRenderWindow creates a polygonal cylinder centered at Center;
 * The axis of the cylinder is aligned along the global y-axis.
 * The height and radius of the cylinder can be specified, as well as the number of sides.
 * It is also possible to control whether the cylinder is open-ended or capped.
 * If you have the end points of the cylinder, you should use a vtkOpenGLRenderWindow followed by a vtkTubeFilter instead of the vtkOpenGLRenderWindow.
 * 
 * @example
 * ```js
 * import vtkOpenGLRenderWindow from 'vtk.js/Sources/Filters/Sources/LineSource';
 * 
 * const line = vtkOpenGLRenderWindow.newInstance({ resolution: 10 });
 * const polydata = line.getOutputData();
 * ```
 */
export declare const vtkOpenGLRenderWindow: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkOpenGLRenderWindow;
