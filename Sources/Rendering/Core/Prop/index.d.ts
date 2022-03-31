import { vtkObject } from "../../../interfaces";
import vtkActor from "../Actor";
import vtkActor2D from "../Actor2D";
import vtkTexture from "../Texture";
import vtkVolume from "../Volume";


export interface IPropInitialValues {
    visibility?: boolean;
    pickable?: boolean;
    dragable?: boolean;
    useBounds?: boolean;
    allocatedRenderTime?: number;
    estimatedRenderTime?: number;
    savedEstimatedRenderTime?: number;
    renderTimeMultiplier?: number;
    textures?: vtkTexture[];
}

export interface vtkProp extends vtkObject {

    /**
     * 
     * @param estimatedRenderTime 
     */
    addEstimatedRenderTime(estimatedRenderTime: number): void;

    /**
     * To be reimplemented by subclasses.
     * For some exporters and other other operations we must be able
     * to collect all the actors or volumes.
     */
    getActors(): vtkActor[];

    /**
     * Not implemented yet
     */
    getActors2D(): vtkActor2D[];

    /**
     * Get the value of the dragable instance variable.
     * @see getNestedDragable
     * @see getPickable
     */
    getDragable(): boolean;

    /**
     * Combine dragabe property with optional ancestor props dragable properties.
     * It is used to decide whether the prop can be mouse dragged.
     * @see getDragable
     * @see getParentProp
     */
    getNestedDragable(): boolean;

    /**
     * Get visibility of this vtkProp.
     * @see getNestedVisibility
     * @see getPickable
     */
    getVisibility(): boolean;

    /**
     * Combine visibility property with optional ancestor props visibility properties.
     * It is used to decide whether the prop should be rendered.
     * @see getVisibility
     * @see getParentProp
     */
    getNestedVisibility(): boolean;

    /**
     * Get the pickable instance variable.
     * @see getNestedPickable
     * @see getDragable
     */
    getPickable(): boolean;

    /**
     * Combine pickable property with optional ancestor props pickable properties.
     * It is used to decide whether the prop should be rendered during a selection rendering.
     * @see getPickable
     * @see getParentProp
     */
    getNestedPickable(): boolean;

    /**
     * Return the mtime of anything that would cause the rendered image to appear differently. 
     * Usually this involves checking the mtime of the prop plus anything else it depends on such as properties, 
     * textures etc.
     */
    getRedrawMTime(): number

    /**
     * 
     */
    getRendertimemultiplier(): number;

    /**
     * The value is returned in seconds. For simple geometry the accuracy may not be great
     * due to buffering. For ray casting, which is already multi-resolution, 
     * the current resolution of the image is factored into the time. We need the viewport 
     * for viewing parameters that affect timing. The no-arguments version simply returns the value of the variable with no estimation.
     */
    getEstimatedRenderTime(): number;

    /**
     * 
     */
    getAllocatedRenderTime(): number;

    /**
     * 
     */
    getNestedProps(): any;

    /**
     * Return parent prop set by setParentProp
     * @see setParentProp
     */
    getParentProp(): vtkProp;

    /**
     * 
     * Not implemented yet
     */
    getVolumes(): vtkVolume[];

    /**
     * 
     */
    getUseBounds(): boolean;

    /**
     * 
     */
    getSupportsSelection(): boolean;

    /**
     * 
     */
    getTextures(): vtkTexture[];

    /**
     * 
     * @param {vtkTexture} texture The vtkTexture instance.
     *
     */
    hasTexture(texture: vtkTexture): boolean;

    /**
     * 
     * @param {vtkTexture} texture The vtkTexture instance.
     */
    addTexture(texture: vtkTexture): void;

    /**
     * 
     * @param {vtkTexture} texture The vtkTexture instance.
     */
    removeTexture(texture: vtkTexture): void;

    /**
     * 
     */
    removeAllTextures(): void;

    /**
     * This method is used to restore that old value should the render be aborted.
     */
    restoreEstimatedRenderTime(): void;

    /**
     * 
     * @param allocatedRenderTime 
     */
    setAllocatedRenderTime(allocatedRenderTime: number): void;

    /**
     * Set whether prop is dragable.
     * Even if true, prop may not be dragable if an ancestor prop is not dragable.
     * @param dragable 
     * @default true
     * @see getDragable
     * @see combineDragable
     */
    setDragable(dragable: boolean): boolean;

    /**
     * 
     * @param estimatedRenderTime 
     */
    setEstimatedRenderTime(estimatedRenderTime: number): void;

    /**
     * Set parent prop used by combineVisibility(), combinePickable(), combineDragable()
     * @param parentProp
     * @see combineVisibility
     * @see combinePickable
     * @see combineDragable
     * @default null
     */
     setParentProp(parentProp: vtkProp): void;

    /**
     * Set whether prop is pickable.
     * Even if true, prop may not be pickable if an ancestor prop is not pickable.
     * @param pickable
     * @default true
     * @see getPickable
     * @see combinePickable
     */
     setPickable(pickable: boolean): boolean;

     /**
      * Set whether prop is visible.
      * Even if true, prop may not be visible if an ancestor prop is not visible.
      * @param visibility
      * @default true
      * @see getVisibility
      * @see combineVisibility
      */
    setVisibility(visibility: boolean): boolean;

    /**
     * In case the Visibility flag is true, tell if the bounds of this prop should be taken into 
     * account or ignored during the computation of other bounding boxes, like in vtkRenderer::ResetCamera().
     * @param useBounds
     * @default true
     */
    setUseBounds(useBounds: boolean): boolean;

    /**
     * This is used for culling and is a number between 0 and 1. It is used to create the allocated render time value.
     * @param {Number} renderTimeMultiplier 
     */
    setRenderTimeMultiplier(renderTimeMultiplier: number): boolean;

    /**
     * Not Implemented yet
     * Method fires PickEvent if the prop is picked.
     */
    pick(): any;

    /**
     * Not Implemented yet
     */
    hasKey(): any;
}


/**
 * Method use to decorate a given object (publicAPI+model) with vtkProp characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IPropInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IPropInitialValues): void;

/**
 * Method use to create a new instance of vtkProp
 * @param {IPropInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IPropInitialValues): vtkProp;


/** 
 * vtkProp is an abstract superclass for any objects that can exist in a
 * rendered scene (either 2D or 3D). Instances of vtkProp may respond to
 * various render methods (e.g., RenderOpaqueGeometry()). vtkProp also
 * defines the API for picking, LOD manipulation, and common instance
 * variables that control visibility, picking, and dragging.
 */
export declare const vtkProp: {
    newInstance: typeof newInstance,
    extend: typeof extend,
};
export default vtkProp;
