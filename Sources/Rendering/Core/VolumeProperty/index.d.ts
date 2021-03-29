import { VtkObject } from "vtk.js/Sources/macro";

export enum InterpolationType {
    NEAREST,
    LINEAR,
    FAST_LINEAR,
}

export enum OpacityMode {
    FRACTIONAL,
    PROPORTIONAL,
}

interface IVolumePropertyInitialValues  {

    /**
     * 
     */
    independentComponents: boolean;

    /**
     * 
     */
    shade: number;

    /**
     * 
     */
    ambient: number;

    /**
     * 
     */
    diffuse: number;

    /**
     * 
     */
    specular: number;

    /**
     * 
     */
    specularPower: number;

    /**
     * 
     */
    useLabelOutline: boolean;

    /**
     * 
     */
    labelOutlineThickness: number;
}

export interface vtkVolumeProperty extends VtkObject {

    /**
     * 
     */
    getAmbient(): number;

    /**
     * 
     */
    getMTime(): number;

    /**
     * 
     * @param index 
     */
    getColorChannels(index: number): number;

    /**
     * 
     */
    getDiffuse(): number;

    /**
     * 
     * @param index 
     */
    getGradientOpacityMaximumOpacity(index: number): number;

    /**
     * 
     * @param index 
     */
    getGradientOpacityMaximumValue(index: number): number;

    /**
     * 
     * @param index 
     */
    getGradientOpacityMinimumOpacity(index: number): number;

    /**
     * 
     * @param index 
     */
    getGradientOpacityMinimumValue(index: number): number;

    /**
     * 
     */
    getIndependentComponents(): boolean;

    /**
     * 
     * @param index 
     */
    getScalarOpacityUnitDistance(index: number): number;

    /**
     * Get the currently set gray transfer function. Create one if none set.
     * @param index 
     */
    getGrayTransferFunction(index: number): any;
    
    /**
     * 
     * @default FRACTIONAL
     */
     getOpacityMode(): OpacityMode;

    /**
     * Get the currently set RGB transfer function. Create one if none set.
     * @param index 
     */
    getRGBTransferFunction(index: number): any;

    /**
     * Get the scalar opacity transfer function. Create one if none set.
     * @param index 
     */
    getScalarOpacity(index: number): any;

    /**
     * 
     */
    getShade(): number;

    /**
     * 
     */
    getSpecular(): number;

    /**
     * 
     */
    getSpecularPower(): number;

    /**
     * 
     * @param index 
     */
    getUseGradientOpacity(index: number): boolean;

    /**
     * 
     */
    getUseLabelOutline(): boolean;

    /**
     * 
     * @param shade 
     */
    setAmbient(ambient: number): boolean;

    /**
     * 
     * @param diffuse 
     */
    setDiffuse(diffuse: number): boolean;

    /**
     * 
     * @param index 
     * @param value 
     */
    setGradientOpacityMaximumOpacity(index: number, value: number): boolean;

    /**
     * 
     * @param index 
     * @param value 
     */
    setGradientOpacityMaximumValue(index: number, value: number): boolean;

    /**
     * 
     * @param index 
     * @param value 
     */
    setGradientOpacityMinimumOpacity(index: number, value: number): boolean;

    /**
     * 
     * @param index 
     * @param value 
     */
    setGradientOpacityMinimumValue(index: number, value: number): boolean;

    /**
     * Set the color of a volume to a gray transfer function
     * @param index 
     * @param func 
     */
    setGrayTransferFunction(index: number, func: any): boolean;

    /**
     * 
     * @param independentComponents 
     */
    setIndependentComponents(independentComponents: boolean): boolean;

    /**
     * 
     * @param labelOutlineThickness 
     */
    setLabelOutlineThickness(labelOutlineThickness: number): boolean;

    /**
     * 
     * @param index 
     * @param value 
     */
    setOpacityMode(index: number, value: number): boolean;

    /**
     * 
     * @param index 
     * @param value 
     */
    setScalarOpacityUnitDistance(index: number, value: number): boolean;
    
    
    /**
     * 
     * @param shade 
     */
    setShade(shade: number): boolean;

    /**
     * 
     * @param specular 
     */
    setSpecular(specular: number): boolean;

    /**
     * 
     * @param specularPower 
     */
    setSpecularPower(specularPower: number): boolean;

    /**
     * 
     * @param index 
     * @param value 
     */
    setUseGradientOpacity(index: number, value: number): boolean;

    /**
     * 
     * @param useLabelOutline 
     */
    setUseLabelOutline(useLabelOutline: boolean): boolean;

    /**
     * Set the color of a volume to an RGB transfer function
     * @param index 
     * @param func 
     */
    setRGBTransferFunction(index: number, func: any): boolean;

    /**
     * Set the scalar opacity of a volume to a transfer function
     * @param index 
     * @param func 
     */
    setScalarOpacity(index: number, func: any): boolean;

    /**
     * 
     * @param index 
     * @param value 
     */
    setComponentWeight(index: number, value: any): boolean;

    /**
     * 
     * @param index 
     */
    getComponentWeight(index: number): number;

    /**
     * 
     * @param interpolationType 
     */
    setInterpolationType(interpolationType: InterpolationType): boolean;

    /**
     * Set interpolation type to NEAREST
     */
    setInterpolationTypeToNearest(): boolean;

    /**
     * Set interpolation type to LINEAR
     */
    setInterpolationTypeToLinear(): boolean;

    /**
     * Set interpolation type to FAST_LINEAR
     */
    setInterpolationTypeToFastLinear(): boolean;

    /**
     * 
     */
    getInterpolationTypeAsString(): string;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkVolumeProperty characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param initialValues (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IVolumePropertyInitialValues): void;

/**
 * Method use to create a new instance of vtkVolumeProperty 
 */
export function newInstance(initialValues?: IVolumePropertyInitialValues): vtkVolumeProperty;

/** 
 * vtkVolumeProperty inherits from vtkMapper.
 * A volume mapper that performs ray casting on the GPU using fragment programs.
 */
export declare const vtkVolumeProperty: {
    newInstance: typeof newInstance,
    extend: typeof extend,
};
export default vtkVolumeProperty;
