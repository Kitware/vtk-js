import { VtkObject } from "vtk.js/Sources/macro";

export enum InterpolationType {
	NEAREST,
	LINEAR,
}

interface IComponentData {
	piecewiseFunction: number;
	componentWeight: number;
}

interface IImageMapperInitialValues {
	independentComponents: boolean;
	interpolationType: InterpolationType;
	colorWindow: number;
	colorLevel: number;
	ambient: number;
	diffuse: number;
	opacity: number;
	componentData: IComponentData[];
}

export interface vtkImageProperty extends VtkObject {

	/**
	 * 
	 * @default 1.0
	 */
	getAmbient(): number;

	/**
	 * 
	 * @default 127.5
	 */
	getColorLevel(): number;

	/**
	 * 
	 * @default 255
	 */
	getColorWindow(): number;

	/**
	 * 
	 * @param {Number} index 
	 */
	getComponentWeight(index: number): number;

	/**
	 * 
	 * @default 1.0
	 */
	getDiffuse(): number;

	/**
	 * 
	 * @default false
	 */
	getIndependentComponents(): boolean;

	/**
	 * 
	 */
	getInterpolationTypeAsString(): InterpolationType;

	/**
	 * 
	 */
	getInterpolationTypeAsString(): string;

	/**
	 * 
	 * @default 1.0
	 */
	getOpacity(): number;

	/**
	 * Get the component weighting function.
	 * @param idx 
	 */
	getPiecewiseFunction(idx: number): number;

	/**
	 * Get the currently set RGB transfer function.
	 * @param {Number} idx
	 */
	getRGBTransferFunction(idx: number): any;

	/**
	 * Alias to get the piecewise function (backwards compatibility)
	 * @param idx 
	 */
	getScalarOpacity(idx: any): number;

    /**
     * Set the lighting coefficient.
     * @param {Number} ambient 
     */
	setAmbient(ambient: number): boolean;

	/**
	 * 
	 */
	setColorLevel(colorLevel: number): boolean;

	/**
	 * 
	 */
	setColorWindow(colorWindow: number): boolean;

	/**
	 * 
	 * @param {Number} index 
	 * @param value 
	 */
	setComponentWeight(index: number, value: number): boolean;

	/**
	 * 
	 */
	setDiffuse(diffse: number): boolean;

	/**
	 * 
	 */
	setIndependentComponents(independentComponents: boolean): boolean;

	/**
	 * 
	 */
	setInterpolationType(interpolationType: InterpolationType): boolean;

	/**
	 * 
	 */
	setInterpolationTypeToLinear(): boolean;

	/**
	 * 
	 */
	setInterpolationTypeToNearest(): boolean;

	/**
	 * 
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
	 * @param func 
	 */
	setRGBTransferFunction(index: number, func: any): boolean;


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
