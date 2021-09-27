import { vtkObject } from "../../../interfaces";
import vtkColorTransferFunction from "../ColorTransferFunction";

export enum InterpolationType {
	NEAREST,
	LINEAR,
}

interface IComponentData {
	piecewiseFunction: number;
	componentWeight: number;
}

export interface IImageMapperInitialValues {
	independentComponents?: boolean;
	interpolationType?: InterpolationType;
	colorWindow?: number;
	colorLevel?: number;
	ambient?: number;
	diffuse?: number;
	opacity?: number;
	componentData?: IComponentData[];
}

export interface vtkImageProperty extends vtkObject {

	/**
     * Get the lighting coefficient.
	 * @default 1.0
	 */
	getAmbient(): number;

	/**
	 * Get the level value for window/level.
	 * @default 127.5
	 */
	getColorLevel(): number;

	/**
	 * Get the window value for window/level.
	 * @default 255
	 */
	getColorWindow(): number;

	/**
	 * 
	 * @param {Number} index 
	 */
	getComponentWeight(index: number): number;

	/**
     * Get the diffuse lighting coefficient.
	 * @default 1.0
	 */
	getDiffuse(): number;

	/**
	 * 
	 * @default false
	 */
	getIndependentComponents(): boolean;

	/**
	 * Get the interpolation type
	 */
	getInterpolationType(): InterpolationType;

	/**
	 * Get the interpolation type as a string
	 */
	getInterpolationTypeAsString(): string;

	/**
     * Get the opacity of the object.
	 * @default 1.0
	 */
	getOpacity(): number;

	/**
	 * Get the component weighting function.
	 * @param {Number} [idx]
	 */
	getPiecewiseFunction(idx?: number): any;

	/**
	 * Get the currently set RGB transfer function.
	 * @param {Number} [idx]
	 */
	getRGBTransferFunction(idx?: number): any;

	/**
	 * Alias to get the piecewise function (backwards compatibility)
	 * @param {Number} [idx]
	 */
	getScalarOpacity(idx: number): number;

    /**
	 * Set the ambient lighting coefficient.
     * @param {Number} ambient The ambient lighting coefficient.
     */
    setAmbient(ambient: number): boolean;

	/**
	 * Set the level value for window/level.
	 * @param {Number} colorLevel The level value for window/level.
	 */
	setColorLevel(colorLevel: number): boolean;

	/**
	 * Set the window value for window/level.
	 * @param {Number} colorWindow The window value for window/level.
	 */
	setColorWindow(colorWindow: number): boolean;

	/**
	 * 
	 * @param {Number} index 
	 * @param {Number} value 
	 */
	setComponentWeight(index: number, value: number): boolean;

    /**
     * Set the diffuse lighting coefficient.
     * @param {Number} diffuse  The diffuse lighting coefficient.
     */
    setDiffuse(diffuse: number): boolean;

	/**
	 * 
	 * @param {Boolean} independentComponents 
	 */
	setIndependentComponents(independentComponents: boolean): boolean;

	/**
	 * Set the interpolation type.
	 * @param {InterpolationType} interpolationType The interpolation type.
	 */
	setInterpolationType(interpolationType: InterpolationType): boolean;

	/**
	 * Set `interpolationType` to `InterpolationType.LINEAR`.
	 */
	setInterpolationTypeToLinear(): boolean;

	/**
	 * Set `interpolationType` to `InterpolationType.NEAREST`.
	 */
	setInterpolationTypeToNearest(): boolean;

	/**
     * Set the opacity of the object
	 * @param {Number} opacity The opacity value.
	 */
	setOpacity(opacity: number): boolean;

	/**
	 * Set the piecewise function
	 * @param {Number} index 
	 * @param func 
	 */
	setPiecewiseFunction(index: number, func: any): boolean;

	/**
	 * Set the color of a volume to an RGB transfer function
	 * @param {Number} index 
	 * @param {vtkColorTransferFunction} func 
	 */
	setRGBTransferFunction(index: number, func: vtkColorTransferFunction): boolean;

	/**
	 * Alias to set the piecewise function
	 * @param {Number} index 
	 * @param func 
	 */
	setScalarOpacity(index: any, func: any): boolean;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkImageProperty characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IImageMapperInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IImageMapperInitialValues): void;

/**
 * Method use to create a new instance of vtkImageProperty
 * @param {IImageMapperInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IImageMapperInitialValues): vtkImageProperty;

/**
 * vtkImageProperty provides 2D image display support for vtk.
 * It can be associated with a vtkImageSlice prop and placed within a Renderer.
 * 
 * This class resolves coincident topology with the same methods as vtkMapper.
 */
export declare const vtkImageProperty: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkImageProperty;
