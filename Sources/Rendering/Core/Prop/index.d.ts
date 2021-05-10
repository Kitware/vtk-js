import { vtkAlgorithm, vtkObject } from "vtk.js/Sources/interfaces";
import vtkActor from "vtk.js/Sources/Rendering/Core/Actor";
import vtkActor2D from "vtk.js/Sources/Rendering/Core/Actor2D";
import vtkTexture from "vtk.js/Sources/Rendering/Core/Texture";
import vtkVolume from "vtk.js/Sources/Rendering/Core/Volume";


interface IPropInitialValues {

    /**
     * Set/Get visibility of this vtkProp. Initial value is true.
     */
    visibility?: boolean;

    /**
     * Set/Get the pickable instance variable. This determines if the vtkProp
     * can be picked (typically using the mouse). Also see dragable.
     * @default true.
     */
    pickable?: boolean;

    /**
     * This determines if an Prop, once picked, can be dragged (translated) through space.
     * This is typically done through an interactive mouse interface.
     * This does not affect methods such as SetPosition, which will continue
     * to work. It is just intended to prevent some vtkProp’ss from being
     * dragged from within a user interface.
     * @default true.
     */
    dragable?: boolean;

    /**
     * In case the Visibility flag is true, tell if the bounds of this prop
     * should be taken into account or ignored during the computation of other
     * bounding boxes, like in vtkRenderer::ResetCamera().
     */
    useBounds?: boolean;

    /**
     * 
     */
    allocatedRenderTime?: number;

    /**
     * 
     */
    estimatedRenderTime?: number;

    /**
     * 
     */
    savedEstimatedRenderTime?: number;

    /**
     * 
     */
    renderTimeMultiplier?: number;

    /**
     * 
     */
    textures?: Array<any>;
}

export interface vtkProp extends vtkObject {

    /**
     * 
     * @param estimatedRenderTime 
     */
    addEstimatedRenderTime(estimatedRenderTime: number): void;

    /**
     * Not implemented yet
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
     */
    getDragable(): boolean;

    /**
     * Get visibility of this vtkProp.
     */
    getVisibility(): boolean;

    /**
     * Get the pickable instance variable.
     */
    getPickable(): boolean;

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
    getNestedProps(): null;

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
     * @param texture 
     *
     */
    hasTexture(texture: vtkTexture): boolean;

    /**
     * 
     * @param texture 
     */
    addTexture(texture: vtkTexture): void;

    /**
     * 
     * @param texture 
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
     * 
     * @param dragable 
     * @default true
     */
    setDragable(dragable: boolean): boolean;

    /**
     * 
     * @param estimatedRenderTime 
     */
    setEstimatedRenderTime(estimatedRenderTime: number): void;

    /**
     * 
     * @param visibility 
     * @default true
     */
    setVisibility(visibility: boolean): boolean;

    /**
     * 
     * @param pickable 
     * @default true
     */
    setPickable(pickable: boolean): boolean;

    /**
     * In case the Visibility flag is true, tell if the bounds of this prop should be taken into 
     * account or ignored during the computation of other bounding boxes, like in vtkRenderer::ResetCamera().
     * @param useBounds
     * @default true
     */
    setUseBounds(useBounds: boolean): boolean;

    /**
     * This is used for culling and is a number between 0 and 1. It is used to create the allocated render time value.
     * @param renderTimeMultiplier 
     */
    setRendertimemultiplier(renderTimeMultiplier): boolean;

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
