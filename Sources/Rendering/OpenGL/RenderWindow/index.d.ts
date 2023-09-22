import { Nullable, Size, Vector2, Vector3 } from '../../../types';
import { VtkDataTypes } from '../../../Common/Core/DataArray';
import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import vtkBufferObject from '../../OpenGL/BufferObject';
import vtkCellArray from '../../../Common/Core/CellArray';
import vtkDataArray from '../../../Common/Core/DataArray';
import vtkOpenGLTexture from '../../OpenGL/Texture';
import vtkPoints from '../../../Common/Core/Points';
import vtkRenderer from '../../Core/Renderer';
import vtkTexture from '../../Core/Texture';
import vtkViewStream from '../../../IO/Core/ImageStream/ViewStream';

/**
 *
 */
export interface IOpenGLRenderWindowInitialValues {
	cullFaceEnabled?: boolean;
	shaderCache?: null;
	initialized?: boolean;
	context?: WebGLRenderingContext | WebGL2RenderingContext;
	canvas?: HTMLCanvasElement;
	cursorVisibility?: boolean;
	cursor?: string;
	textureUnitManager?: null;
	textureResourceIds?: null;
	containerSize?: Size;
	renderPasses?: any[];
	notifyStartCaptureImage?: boolean;
	webgl2?: boolean;
	defaultToWebgl2?: boolean;
	activeFramebuffer?: any;
	imageFormat?: 'image/png';
	useOffScreen?: boolean;
	useBackgroundImage?: boolean;
}

export interface ICaptureOptions {
	resetCamera?: boolean;
	size?: Size;
	scale?: number
}

export interface I3DContextOptions {
    preserveDrawingBuffer?: boolean;
    depth?: boolean;
    alpha?: boolean;
    powerPreference?: string;
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
	 * @param {Boolean} prepass
	 */
	buildPass(prepass: boolean): void;

	/**
     * Initialize the rendering window. This will setup all system-specific
	 * resources. This method and Finalize() must be symmetric and it should be
	 * possible to call them multiple times, even changing WindowId in-between.
	 * This is what WindowRemap does.
	 */
	initialize(): void;

	/**
	 *
	 */
	makeCurrent(): void;

	/**
	 *
	 * @param {HTMLElement} el The container element.
	 */
	setContainer(el: HTMLElement): void;

	/**
	 * Get the container element.
	 */
	getContainer(): Nullable<HTMLElement>;

	/**
	 * Get the container size.
	 */
	getContainerSize(): Vector2;

	/**
	 * Get the frame buffer size.
	 */
	getFramebufferSize(): Vector2;

	/**
	 * Get the webgl canvas.
	 */
	getCanvas(): Nullable<HTMLCanvasElement>;

	/**
	 * Check if a point is in the viewport.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {vtkRenderer} viewport The viewport vtk element.
	 */
	isInViewport(x: number, y: number, viewport: vtkRenderer): boolean;

	/**
	 * Get the viewport size.
	 * @param {vtkRenderer} viewport The viewport vtk element.
	 */
	getViewportSize(viewport: vtkRenderer): Vector2;

	/**
	 * Get the center of the viewport.
	 * @param {vtkRenderer} viewport The viewport vtk element.
	 */
	getViewportCenter(viewport: vtkRenderer): Vector2;

	/**
	 *
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} z
	 */
	displayToNormalizedDisplay(x: number, y: number, z: number): Vector3;

	/**
	 *
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} z
	 */
	normalizedDisplayToDisplay(x: number, y: number, z: number): Vector3;

	/**
	 *
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} z
	 * @param {vtkRenderer} renderer The vtkRenderer instance.
	 */
	worldToView(x: number, y: number, z: number, renderer: vtkRenderer): Vector3;

	/**
	 *
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} z
	 * @param {vtkRenderer} renderer The vtkRenderer instance.
	 */
	viewToWorld(x: number, y: number, z: number, renderer: vtkRenderer): Vector3;

	/**
	 *
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} z
	 * @param {vtkRenderer} renderer The vtkRenderer instance.
	 */
	worldToDisplay(x: number, y: number, z: number, renderer: vtkRenderer): Vector3;

	/**
	 *
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} z
	 * @param {vtkRenderer} renderer The vtkRenderer instance.
	 */
	displayToWorld(x: number, y: number, z: number, renderer: vtkRenderer): Vector3;

	/**
	 *
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} z
	 * @param {vtkRenderer} renderer The vtkRenderer instance.
	 */
	normalizedDisplayToViewport(x: number, y: number, z: number, renderer: vtkRenderer): Vector3;

	/**
	 *
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} z
	 * @param {vtkRenderer} renderer The vtkRenderer instance.
	 */
	viewportToNormalizedViewport(x: number, y: number, z: number, renderer: vtkRenderer): Vector3;

	/**
	 *
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} z
	 */
	normalizedViewportToViewport(x: number, y: number, z: number): Vector3;

	/**
	 *
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} z
	 */
	displayToLocalDisplay(x: number, y: number, z: number): Vector3;

	/**
	 *
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} z
	 * @param {vtkRenderer} renderer The vtkRenderer instance.
	 */
	viewportToNormalizedDisplay(x: number, y: number, z: number, renderer: vtkRenderer): Vector3;

	/**
	 *
	 * @param {Number} x1
	 * @param {Number} y1
	 * @param {Number} x2
	 * @param {Number} y2
	 */
	getPixelData(x1: number, y1: number, x2: number, y2: number): Uint8Array;

	/**
	 *
	 * @param {I3DContextOptions} options
	 */
	get3DContext(options: I3DContextOptions): Nullable<WebGLRenderingContext>;

	/**
	 *
	 */
	restoreContext(): void;

	/**
	 *
	 * @param {vtkTexture} texture
	 */
	activateTexture(texture: vtkTexture): void;

	/**
	 *
	 * @param {vtkTexture} texture
	 */
	deactivateTexture(texture: vtkTexture): void;

	/**
	 *
	 * @param {vtkTexture} texture
	 */
	getTextureUnitForTexture(texture: vtkTexture): number;

	/**
	 *
	 * @param {VtkDataTypes} vtktype 
	 * @param {Number} numComps 
	 * @param {Boolean} useFloat 
	 * @param {unknown} oglNorm16Ext The WebGL EXT_texture_norm16 extension context
	 * @param {Boolean} useHalfFloat
	 */
	getDefaultTextureInternalFormat(vtktype: VtkDataTypes, numComps: number, oglNorm16Ext?: unknown, useHalfFloat?: boolean): void;

	/**
	 * 
	 * @param {HTMLImageElement} img The background image.
	 */
	setBackgroundImage(img: HTMLImageElement): void;

	/**
	 * 
	 * @param {Boolean} value
	 */
	setUseBackgroundImage(value: boolean): void;

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
	 * @param {String} format
	 * @param {ICaptureOptions} options
	 */
	captureNextImage(format: string, options?: ICaptureOptions): Nullable<Promise<string>>;

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
	disableCullFace(): void;

	/**
	 *
	 */
	enableCullFace(): void;

	/**
	 *
	 * @param {vtkViewStream} stream The vtkViewStream instance.
	 */
	setViewStream(stream: vtkViewStream): boolean;

	/**
	 * Sets the pixel width and height of the rendered image.  
	 * 
	 * WebGL and WebGPU render windows apply these values to 
	 * the width and height attribute of the canvas element.
	 * 
	 * To match the device resolution in browser environments, 
	 * multiply the container size by `window.devicePixelRatio`
	 * `apiSpecificRenderWindow.setSize(Math.floor(containerWidth * devicePixelRatio), Math.floor(containerHeight * devicePixelRatio));
	 * See the VTK.js FullscreenRenderWindow class for an example.
	 * 
	 * @see getComputedDevicePixelRatio()
	 * 
	 * @param {Vector2} size 
	 */
	setSize(size: Vector2): void;

	/**
	 *
	 * @param {Number} x 
	 * @param {Number} y 
	 */
	setSize(x: number, y: number): void;

	/**
	 *
	 */
	getSize(): Vector2;

	/**
	 * Scales the size of a browser CSS pixel to a rendered canvas pixel.  
	 * `const renderedPixelWidth = cssPixelWidth * apiRenderWindow.getComputedDevicePixelRatio()`
	 * Use to scale rendered objects to a consistent perceived size or DOM pixel position.
	 * 
	 * Rather than using window.devicePixelRatio directly, the device pixel ratio is inferred
	 * from the container CSS pixel size and rendered image pixel size. The user directly sets the rendered pixel size.
	 * 
	 * @see setSize()
	 * @see getContainerSize()
	 */
	getComputedDevicePixelRatio(): number;

	/**
	 * Set graphics resources for vtk objects to be cached at the context level.
	 * This provides mappers with a convenient API to re-use allocated GPU resources
	 * without duplication.
	 *
	 * @param {Object} vtkObj VTK data object / array with resources on the GPU
	 * @param {Object} gObj Container object that maintains a handle to the graphics resource on the GPU
	 * @param {String} hash String hash that can be used by mappers to decide whether to discard or re-allocate
	 * the cached resource.
	 */
	setGraphicsResourceForObject(vtkObj: vtkCellArray | vtkDataArray | vtkPoints, gObj: vtkOpenGLTexture | vtkBufferObject, hash: string): void;

	/**
	 * Get graphics resources for vtk objects cached at the context level.
	 * This provides mappers with a convenient API to re-use allocated GPU resources
	 * without duplication.
	 *
	 * @param {Object} vtkObj VTK data object / array with resources on the GPU
	 * the cached resource.
	 * @return {Object} Dictionary with the graphics resource and string hash
	 */
	getGraphicsResourceForObject(vtkObj: vtkCellArray | vtkDataArray | vtkPoints): {gObj: vtkOpenGLTexture | vtkBufferObject, hash: string};

	/**
	 * Get approximate graphics memory usage, in bytes, for the context. This is a simple computation
	 * that analyzes how much memory is allocated on the GPU for textures, VBOs, etc. to give an
	 * application a view of its graphics memory consumption.
	 * Note that this ignores page resources.
	 */
	getGraphicsMemoryInfo(): number;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkOpenGLRenderWindow characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IOpenGLRenderWindowInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IOpenGLRenderWindowInitialValues): void;

/**
 * Method used to create a new instance of vtkOpenGLRenderWindow.
 * @param {IOpenGLRenderWindowInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IOpenGLRenderWindowInitialValues): vtkOpenGLRenderWindow;

/**
 *
 * @param cb
 */
export function pushMonitorGLContextCount(cb: any): void;

/**
 *
 * @param cb
 */
export function popMonitorGLContextCount(cb: any): void;

/**
 * WebGL rendering window
 *
 * vtkOpenGLRenderWindow is designed to view/render a vtkRenderWindow.
 */
export declare const vtkOpenGLRenderWindow: {
	newInstance: typeof newInstance,
	extend: typeof extend,
	pushMonitorGLContextCount: typeof pushMonitorGLContextCount,
	popMonitorGLContextCount: typeof popMonitorGLContextCount,
};
export default vtkOpenGLRenderWindow;
