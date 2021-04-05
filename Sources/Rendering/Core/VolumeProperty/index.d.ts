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
	independentComponents?: boolean;

	/**
	 * 
	 */
	shade?: number;

	/**
	 * 
	 */
	ambient?: number;

	/**
	 * 
	 */
	diffuse?: number;

	/**
	 * 
	 */
	specular?: number;

	/**
	 * 
	 */
	specularPower?: number;

	/**
	 * 
	 */
	useLabelOutline?: boolean;

	/**
	 * 
	 */
	labelOutlineThickness?: number;
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
	getOpacityMode(index: number): OpacityMode;

	/**
	 * 
	 */
	getLabelOutlineThickness(): number;

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
	getInterpolationType(): InterpolationType;

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
 * vtkVolumeProperty is used to represent common properties associated
 * with volume rendering. This includes properties for determining the type
 * of interpolation to use when sampling a volume, the color of a volume,
 * the scalar opacity of a volume, the gradient opacity of a volume, and the
 * shading parameters of a volume.

 * When the scalar opacity or the gradient opacity of a volume is not set,
 * then the function is defined to be a constant value of 1.0. When a
 * scalar and gradient opacity are both set simultaneously, then the opacity
 * is defined to be the product of the scalar opacity and gradient opacity
 * transfer functions.
 *
 * Most properties can be set per "component" for volume mappers that
 * support multiple independent components. If you are using 2 component
 * data as LV or 4 component data as RGBV (as specified in the mapper)
 * only the first scalar opacity and gradient opacity transfer functions
 * will be used (and all color functions will be ignored). Omitting the
 * index parameter on the Set/Get methods will access index = 0.
 *
 * When independent components is turned on, a separate feature (useful
 * for volume rendering labelmaps) is available.  By default all components
 * have an "opacityMode" of `FRACTIONAL`, which results in the usual
 * addition of that components scalar opacity function value to the final
 * opacity of the fragment.  By setting one or more components to have a
 * `PROPORTIONAL` "opacityMode" instead, the scalar opacity lookup value
 * for those components will not be used to adjust the fragment opacity,
 * but rather used to multiply the color of that fragment.  This kind of
 * rendering makes sense for labelmap components because the gradient of
 * those fields is meaningless and should not be used in opacity
 * computation.  At the same time, multiplying the color value by the
 * piecewise scalar opacity function value provides an opportunity to
 * design piecewise constant opacity functions (step functions) that can
 * highlight any subset of label values.
 *
 * vtkColorTransferFunction is a color mapping in RGB or HSV space that
 * uses piecewise hermite functions to allow interpolation that can be
 * piecewise constant, piecewise linear, or somewhere in-between
 * (a modified piecewise hermite function that squishes the function
 * according to a sharpness parameter). The function also allows for
 * the specification of the midpoint (the place where the function
 * reaches the average of the two bounding nodes) as a normalize distance
 * between nodes.
 *
 * See the description of class vtkPiecewiseFunction for an explanation of
 * midpoint and sharpness.
 *
 * ## Usage
 *
 * ```js
 * // create color and opacity transfer functions
 * const ctfun = vtkColorTransferFunction.newInstance();
 * ctfun.addRGBPoint(200.0, 1.0, 1.0, 1.0);
 * ctfun.addRGBPoint(2000.0, 0.0, 0.0, 0.0);
 * const ofun = vtkPiecewiseFunction.newInstance();
 * ofun.addPoint(200.0, 0.0);
 * ofun.addPoint(1200.0, 0.2);
 * ofun.addPoint(4000.0, 0.4);
 *
 * // set them on the property
 * volume.getProperty().setRGBTransferFunction(0, ctfun);
 * volume.getProperty().setScalarOpacity(0, ofun);
 * volume.getProperty().setScalarOpacityUnitDistance(0, 4.5);
 * volume.getProperty().setInterpolationTypeToLinear();
 * ```
 */
export declare const vtkVolumeProperty: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkVolumeProperty;
