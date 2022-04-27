import { Bounds, Nullable } from '../../../types';

import vtkCamera from '../Camera';
import vtkLight from '../Light';
import vtkRenderWindow from '../RenderWindow';
import vtkProp3D from '../Prop3D';
import vtkViewport, { IViewportInitialValues } from '../Viewport';
import vtkVolume from '../Volume';
import vtkTexture from '../Texture';
import vtkActor from '../Actor';


export interface IRendererInitialValues extends IViewportInitialValues {
	allBounds?: Bounds[];
	ambient?: number[];
	allocatedRenderTime?: number;
	timeFactor?: number;
	automaticLightCreation?: boolean;
	twoSidedLighting?: boolean;
	lastRenderTimeInSeconds?: number;
	lights?: vtkLight[];
	actors?: vtkProp3D[];
	volumes?: vtkVolume[];
	lightFollowCamera?: boolean;
	numberOfPropsRendered?: number;
	layer?: number;
	preserveColorBuffer?: boolean;
	preserveDepthBuffer?: boolean;
	interactive?: boolean;
	nearClippingPlaneTolerance?: number;
	clippingRangeExpansion?: number;
	erase?: boolean;
	draw?: boolean;
	useShadows?: boolean;
	useDepthPeeling?: boolean;
	occlusionRatio?: number;
	maximumNumberOfPeels?: number;
	texturedBackground?: boolean;
	pass?: number;
}

export interface vtkRenderer extends vtkViewport {

	/**
	 * 
	 */
	isActiveCameraCreated(): boolean;

	/**
	 * Add different types of props to the renderer.
	 * @param {vtkActor} actor The vtkActor instance.
	 */
	addActor(actor: vtkActor): boolean;

	/**
	 * Add a light to the list of lights.
	 * @param {vtkLight} light The vtkLight instance.
	 */
	addLight(light: vtkLight): void;

	/**
	 * Not Implemented yet
	 */
	allocateTime(): any;

	/**
	 * Add a volume to the renderer..
	 * @param volume The vtkVolume instance.
	 */
	addVolume(volume: vtkVolume): boolean;

	/**
	 * Create and add a light to renderer.
	 */
	createLight(): vtkLight;

	/**
	 * Compute the bounding box of all the visible props Used in ResetCamera() and ResetCameraClippingRange()
	 */
	computeVisiblePropBounds(): Bounds;

	/**
	 * Get the active camera
	 */
	getActiveCamera(): vtkCamera;

	/**
	 * 
	 */
	getActiveCameraAndResetIfCreated(): vtkCamera;

	/**
	 * Return any actors in this renderer.
	 *   
	 */
	getActors(): vtkActor[];

	/**
	 * Return any actors in this renderer.
	 *   
	 */
	getActorsByReference(): vtkActor[];

	/**
	 * 
	 * @default 100
	 */
	getAllocatedRenderTime(): number;

	/**
	 * 
	 */
	getAutomaticLightCreation(): boolean;

	/**
	 * 
	 * @default null
	 */
	getBackgroundTexture(): vtkTexture;

	/**
	 * 
	 * @default null
	 */
	getBackingStore(): any;

	/**
	 * 
	 */
	getClippingRangeExpansion(): number;

	/**
	 * 
	 * @default null
	 */
	getDelegate(): any;

	/**
	 * 
	 * @default true
	 */
	getDraw(): boolean;

	/**
	 * 
	 * @default true
	 */
	getErase(): boolean;

	/**
	 * 
	 * @default true
	 */
	getInteractive(): boolean;

	/**
	 * 
	 * @default -1
	 */
	getLastRenderTimeInSeconds(): number;

	/**
	 * 
	 * @default 0
	 */
	getNumberOfPropsRendered(): number;

	/**
	 * 
	 * @default 
	 */
	getLastRenderingUsedDepthPeeling(): any

	/**
	 * 
	 * @default 0
	 */
	getLayer(): number;

	/**
	 * 
	 * @default true
	 */
	getLightFollowCamera(): boolean;

	/**
	 * 
	 */
	getLights(): vtkLight[];

	/**
	 * 
	 */
	getLightsByReference(): vtkLight[];

	/**
	 * 
	 * @default 4
	 */
	getMaximumNumberOfPeels(): number;

	/**
	 * Return the `Modified Time` which is a monotonic increasing integer
	 * global for all vtkObjects.
	 *
	 * This allow to solve a question such as:
	 *  - Is that object created/modified after another one?
	 *  - Do I need to re-execute this filter, or not? ...
	 *
	 * @return {Number} the global modified time.
	 */
	getMTime(): number;

	/**
	 * 
	 * @default 0
	 */
	getNearClippingPlaneTolerance(): number;

	/**
	 * 
	 * @default 0
	 */
	getOcclusionRatio(): number;

	/**
	 * 
	 * @default null
	 */
	getRenderWindow(): Nullable<vtkRenderWindow>;

	/**
	 * 
	 * @default 0
	 */
	getPass(): number;

	/**
	 * 
	 * @default false
	 */
	getPreserveColorBuffer(): boolean;

	/**
	 * 
	 * @default false
	 */
	getPreserveDepthBuffer(): boolean;

	/**
	 * 
	 * @default null
	 */
	getSelector(): any;

	/**
	 * 
	 * @default 1
	 */
	getTimeFactor(): number;

	/**
	 * 
	 * @default true
	 */
	getTransparent(): boolean;

	/**
	 * 
	 * @default false
	 */
	getTexturedbackground(): boolean;

	/**
	 * 
	 * @default true
	 */
	getTwosidedlighting(): boolean;

	/**
	 * 
	 * @default false
	 */
	getUsedepthpeeling(): boolean;

	/**
	 * 
	 * @default false
	 */
	getUseshadows(): boolean;

	/**
	* 
	*/
	getVTKWindow(): vtkRenderWindow;

	/**
	 * Return the collection of volumes.
	 *  
	 */
	getVolumes(): vtkVolume[];

	/**
	 * Return the collection of volumes.
	 *  
	 */
	getVolumesByReference(): vtkVolume[];

	/**
	 * Create a new Camera sutible for use with this type of Renderer.
	 */
	makeCamera(): vtkCamera;

	/**
	 * Create a new Light sutible for use with this type of Renderer.
	 */
	makeLight(): vtkLight;

	/**
	 * requires the aspect ratio of the viewport as X/Y
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 * @param {Number} aspect 
	 */
	normalizedDisplayToWorld(x: number, y: number, z: number, aspect: number): number[];

	/**
	 * 
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 * @param {Number} aspect 
	 */
	projectionToView(x: number, y: number, z: number, aspect: number): number[];

	/**
	 * Specify the camera to use for this renderer.
	 * @param {vtkCamera} camera The camera object to use.
	 */
	setActiveCamera(camera: vtkCamera): boolean;

	/**
	 * 
	 * @param {Boolean} automaticLightCreation 
	 */
	setAutomaticLightCreation(automaticLightCreation: boolean): boolean;

	/**
	 * 
	 * @param {vtkTexture} backgroundTexture 
	 */
	setBackgroundTexture(backgroundTexture: vtkTexture): boolean;

	/**
	 * 
	 * @param {*} backingStore 
	 */
	setBackingStore(backingStore: any): boolean;

	/**
	 * 
	 * @param {Number} clippingRangeExpansion 
	 */
	setClippingRangeExpansion(clippingRangeExpansion: number): boolean;

	/**
	 * 
	 * @param delegate 
	 */
	setDelegate(delegate: any): boolean;

	/**
	 * 
	 * @param {Boolean} draw 
	 */
	setDraw(draw: boolean): boolean;

	/**
	 * 
	 * @param {Boolean} erase 
	 */
	setErase(erase: boolean): boolean;

	/**
	 * 
	 * @param {Boolean} interactive 
	 */
	setInteractive(interactive: boolean): boolean;

	/**
	 * 
	 * @param {Number} layer 
	 */
	setLayer(layer: number): void;

	/**
	 * Set the collection of lights.
	 * @param {vtkLight[]} lights 
	 */
	setLightCollection(lights: vtkLight[]): void;

	/**
	 * 
	 * @param {Boolean} lightFollowCamera 
	 */
	setLightFollowCamera(lightFollowCamera: boolean): boolean;

	/**
	 * 
	 * @param {Number} maximumNumberOfPeels 
	 */
	setMaximumNumberOfPeels(maximumNumberOfPeels: number): boolean;

	/**
	 * 
	 * @param {Number} nearClippingPlaneTolerance 
	 */
	setNearClippingPlaneTolerance(nearClippingPlaneTolerance: number): boolean;

	/**
	 * 
	 * @param {Number} occlusionRatio 
	 */
	setOcclusionRatio(occlusionRatio: number): boolean;

	/**
	 * 
	 * @param {Number} pass 
	 */
	setPass(pass: number): boolean;

	/**
	 * 
	 * @param {Boolean} preserveColorBuffer 
	 */
	setPreserveColorbuffer(preserveColorBuffer: boolean): boolean;

	/**
	 * 
	 * @param {Boolean} preserveDepthBuffer 
	 */
	setPreserveDepthbuffer(preserveDepthBuffer: boolean): boolean;

	/**
	 * 
	 * @param {Boolean} texturedBackground 
	 */
	setTexturedBackground(texturedBackground: boolean): boolean;

	/**
	 * 
	 * @param {Boolean} twoSidedLighting 
	 */
	setTwoSidedLighting(twoSidedLighting: boolean): boolean;

	/**
	 * 
	 * @param {Boolean} useDepthPeeling 
	 */
	setUseDepthPeeling(useDepthPeeling: boolean): boolean;

	/**
	 * 
	 * @param {Boolean} useShadows 
	 */
	setUseShadows(useShadows: boolean): boolean;

	/**
	 * 
	 * @param {vtkRenderWindow} renderWindow 
	 */
	setRenderWindow(renderWindow: vtkRenderWindow): void;

	/**
	 * 
	 * @param {vtkActor} actor 
	 */
	removeActor(actor: vtkActor): void;

	/**
	 * 
	 */
	removeAllActors(): void;

	/**
	 * 
	 * @param {vtkVolume} volume 
	 */
	removeVolume(volume: vtkVolume): void;

	/**
	 * 
	 */
	removeAllVolumes(): void;

	/**
	 * Remove a light from the list of lights.
	 * @param {vtkLight} light The light object to remove.
	 */
	removeLight(light: vtkLight): void;

	/**
	 * Remove all lights from the list of lights.
	 */
	removeAllLights(): void;

	/**
	 * requires the aspect ratio of the viewport as X/Y
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 * @param {Number} aspect 
	 */
	worldToNormalizedDisplay(x: number, y: number, z: number, aspect: number): number[];

	/**
	 * requires the aspect ratio of the viewport as X/Y
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	viewToWorld(x: number, y: number, z: number): number[];

	/**
	 * Convert world point coordinates to view coordinates.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	worldToView(x: number, y: number, z: number): number[];

	/**
	 * Convert world point coordinates to view coordinates.
	 * requires the aspect ratio of the viewport as X/Y
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 * @param {Number} aspect 
	 */
	viewToProjection(x: number, y: number, z: number, aspect: number): number[];

	/**
	 * Automatically set up the camera based on the visible actors.
	 * 
	 * The camera will reposition itself to view the center point of the actors,
	 * and move along its initial view plane normal (i.e., vector defined from
	 * camera position to focal point) so that all of the actors can be seen.
	 * @param {Bounds} [bounds] 
	 */
	resetCamera(bounds?: Bounds): boolean;

	/**
	 * Reset the camera clipping range based on a bounding box.
	 * @param {Bounds} [bounds] 
	 */
	resetCameraClippingRange(bounds?: Bounds): boolean;

	/**
	 * Get the number of visible actors.
	 */
	visibleActorCount(): number;

	/**
	 * Not Implemented yet
	 */
	updateGeometry(): any;

	/**
	 * Ask the active camera to do whatever it needs to do prior to rendering.
	 */
	updateCamera(): boolean;

	/**
	 * Ask the lights in the scene that are not in world space
	 * (for instance, Headlights or CameraLights that are attached to the
	 * camera) to update their geometry to match the active camera.
	 */
	updateLightsGeometryToFollowCamera(): void;

	/**
	 * Update the geometry of the lights in the scene that are not in world
	 * space (for instance, Headlights or CameraLights that are attached to the
	 * camera).
	 */
	updateLightGeometry(): boolean;

	/**
	 * Not Implemented yet
	 */
	visibleVolumeCount(): any;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkRenderer characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IRendererInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IRendererInitialValues): void;

/**
 * Method use to create a new instance of vtkRenderer.
 * @param {IRendererInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IRendererInitialValues): vtkRenderer;

/** 
 * vtkRenderer is a Viewport designed to hold 3D properties. It contains
 * an instance of vtkCamera, a collection of vtkLights, and vtkActors. It exists
 * within a RenderWindow. A RenderWindow may have multiple Renderers
 * representing different viewports of the Window and Renderers can be layered
 * on top of each other as well.
 */
export declare const vtkRenderer: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkRenderer;
