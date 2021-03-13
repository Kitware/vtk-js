import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCamera from 'vtk.js/Sources/Rendering/Core/Camera';
import vtkRendererWindow from 'vtk.js/Sources/Rendering/Core/RendererWindow';
import vtkProp from 'vtk.js/Sources/Rendering/Core/Prop';
import vtkViewport from 'vtk.js/Sources/Rendering/Core/Viewport';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';


interface IRendererInitialValues {
    /**
     * 
     */
    allBounds: Array<any>;

    /**
     * 
     */
    ambient: Array<number>;

    /**
     * 
     */
    allocatedRenderTime: number;

    /**
     * 
     */
    timeFactor: number;

    /**
     * 
     */
    automaticLightCreation: boolean;

    /**
     * 
     */
    twoSidedLighting: boolean;

    /**
     * 
     */
    lastRenderTimeInSeconds: number;

    /**
     * 
     */
    lights: Array<any>;

    /**
     * 
     */
    actors: Array<any>;

    /**
     * 
     */
    volumes: Array<any>;

    /**
     * 
     */
    lightFollowCamera: boolean;

    /**
     * 
     */
    numberOfPropsRendered: number;

    /**
     * 
     */
    layer: number;

    /**
     * 
     */
    preserveColorBuffer: boolean;

    /**
     * 
     */
    preserveDepthBuffer: boolean;

    /**
     * 
     */
    interactive: boolean;

    /**
     * 
     */
    nearClippingPlaneTolerance: number;

    /**
     * 
     */
    clippingRangeExpansion: number;

    /**
     * 
     */
    erase: boolean;

    /**
     * 
     */
    draw: boolean;

    /**
     * 
     */
    useShadows: boolean;

    /**
     * 
     */
    useDepthPeeling: boolean;

    /**
     * 
     */
    occlusionRatio: number;

    /**
     * 
     */
    maximumNumberOfPeels: number;

    /**
     * 
     */
    texturedBackground: boolean;

    /**
     * 
     */
    pass: number;
}

export interface vtkRenderer extends vtkViewport {

    /**
     * 
     */
    isActiveCameraCreated(): boolean;
    /**
     * 
     * @param actor 
     */
    addActor(actor: vtkActor): boolean;

    /**
     * Add a light to the list of lights.
     * @param light 
     */
    addLight(light: vtkLight): void;

    /**
     * Not Implemented yet
     */
    allocateTime(): any;

    /**
     * 
     * @param volume 
     */
    addVolume(volume: vtkVolume): boolean;

    /**
     * Create and add a light to renderer.
     */
    createLight(): vtkLight;

    /**
     * 
     */
    computeVisiblePropBounds(): void;

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
    getBackgroundTexture(): null | vtkTexture;

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
    getLights(): vtkLigth[];

    /**
     * 
     */
    getLightsByReference(): vtkLigth[];

    /**
     * 
     * @default 4
     */
    getMaximumNumberOfPeels(): number;

    /**
     * 
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
    getRenderWindow(): null | vtkRenderWindow;

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
    getVTKWindow(): vtkRendererWindow;

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
     * @param x 
     * @param y 
     * @param z 
     * @param aspect 
     */
    normalizedDisplayToWorld(x: any, y: any, z: any, aspect: any): number[];

    /**
     * 
     * @param x 
     * @param y 
     * @param z 
     * @param aspect 
     */
    projectionToView(x: number, y: number, z: number, aspect: any): number[];

    /**
     * Specify the camera to use for this renderer.
     * @param camera 
     */
    setActiveCamera(camera: vtkCamera): boolean;

    /**
     * 
     * @param automaticLightCreation 
     */
    setAutomaticLightCreation(automaticLightCreation: boolean): boolean;

    /**
     * 
     * @param backgroundTexture 
     */
    setBackgroundTexture(backgroundTexture = vtkTexture): boolean;

    /**
     * 
     * @param backingStore 
     */
    setBackingStore(backingStore: any): boolean;

    /**
     * 
     * @param clippingRangeExpansion 
     */
    setClippingRangeExpansion(clippingRangeExpansion: number): boolean;

    /**
     * 
     * @param delegate 
     */
    setDelegate(delegate: any): boolean;

    /**
     * 
     * @param draw 
     */
    setDraw(draw: boolean): boolean;

    /**
     * 
     * @param erase 
     */
    setErase(erase: boolean): boolean;

    /**
     * 
     * @param interactive 
     */
    setInteractive(interactive: boolean): boolean;

    /**
     * 
     * @param layer 
     */
    setLayer(layer: number): void;

    /**
     * Set the collection of lights.
     * @param lights 
     */
    setLightCollection(lights: vtkLight[]): void;

    /**
     * 
     * @param lightFollowCamera 
     */
    setLightFollowCamera(lightFollowCamera: boolean): boolean;


    /**
     * 
     * @param maximumNumberOfPeels 
     */
    setMaximumNumberOfPeels(maximumNumberOfPeels: number): boolean;

    /**
     * 
     * @param nearClippingPlaneTolerance 
     */
    setNearClippingPlaneTolerance(nearClippingPlaneTolerance: number): boolean;

    /**
     * 
     * @param occlusionRatio 
     */
    setOcclusionRatio(occlusionRatio: number): boolean;

    /**
     * 
     * @param pass 
     */
    setPass(pass: number): boolean;

    /**
     * 
     * @param preserveColorBuffer 
     */
    setPreserveColorbuffer(preserveColorBuffer: boolean): boolean;

    /**
     * 
     * @param preserveDepthBuffer 
     */
    setPreserveDepthbuffer(preserveDepthBuffer: boolean): boolean;

    /**
     * 
     * @param texturedBackground 
     */
    setTexturedBackground(texturedBackground: boolean): boolean;

    /**
     * 
     * @param twoSidedLighting 
     */
    setTwoSidedLighting(twoSidedLighting: boolean): boolean;

    /**
     * 
     * @param useDepthPeeling 
     */
    setUseDepthPeeling(useDepthPeeling: boolean): boolean;

    /**
     * 
     * @param useShadows 
     */
    setUseShadows(useShadows: boolean): boolean;

    /**
     * 
     * @param renderWindow 
     */
    setRenderWindow(renderWindow: any): void;


    /**
     * 
     * @param actor 
     */
    removeActor(actor: vtkProp): void;

    /**
     * 
     */
    removeAllActors(): void;

    /**
     * 
     * @param volume 
     */
    removeVolume(volume: vtkVolume): void;

    /**
     * 
     */
    removeAllVolumes(): void;


    /**
     * Remove a light from the list of lights.
     * @param light 
     */
    removeLight(light: vtkLight): void;

    /**
     * Remove all lights from the list of lights.
     */
    removeAllLights(): void;

    /**
     * requires the aspect ratio of the viewport as X/Y
     * @param x 
     * @param y 
     * @param z 
     * @param aspect 
     */
    worldToNormalizedDisplay(x: any, y: any, z: any, aspect: any): void;



    /**
     * requires the aspect ratio of the viewport as X/Y
     * @param x 
     * @param y 
     * @param z 
     */
    viewToWorld(x: number, y: number, z: number): Array<number>;

    /**
     * Convert world point coordinates to view coordinates.
     * @param x 
     * @param y 
     * @param z 
     */
    worldToView(x: number, y: number, z: number): number[];

    /**
     * Convert world point coordinates to view coordinates.
     * requires the aspect ratio of the viewport as X/Y
     * @param x 
     * @param y 
     * @param z 
     * @param aspect 
     */
    viewToProjection(x: number, y: number, z: number, aspect: number): number[];

    /**
     * 
     * @param bounds 
     */
    resetCamera(bounds: any): boolean;

    /**
     * 
     * @param bounds 
     */
    resetCameraClippingRange(bounds: any): boolean;

    /**
     * 
     */
    visibleActorCount(): void;

    /**
     * Not Implemented yet
     */
    updateGeometry(): any;

    /**
     * 
     */
    updateCamera(): boolean;

    /**
     * Ask the lights in the scene that are not in world space
     * (for instance, Headlights or CameraLights that are attached to the
     * camera) to update their geometry to match the active camera.
     */
    updateLightsGeometryToFollowCamera(): void;

    /**
     * 
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
 * @param initialValues (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IRendererValues): void;

/**
 * Method use to create a new instance of vtkRenderer.
 * @param initialValues for pre-setting some of its content
 */
export function newInstance(initialValues?: IRendererValues): vtkRenderer;

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
