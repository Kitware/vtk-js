import { vtkObject } from "../../../interfaces";
import { InterpolationType, OpacityMode } from "./Constants";

interface IVolumePropertyInitialValues  {
	independentComponents?: boolean;
	shade?: number;
	ambient?: number;
	diffuse?: number;
	specular?: number;
	specularPower?: number;
	useLabelOutline?: boolean;
	labelOutlineThickness?: number;
}

export interface vtkVolumeProperty extends vtkObject {

	/**
	 * Get the ambient lighting coefficient.
	 */
	getAmbient(): number;

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
	 * @param {Number} index 
	 */
	getColorChannels(index: number): number;

	/**
	 * Get the diffuse lighting coefficient.
	 */
	getDiffuse(): number;

	/**
	 *
	 * @param {Number} index 
	 */
	getGradientOpacityMaximumOpacity(index: number): number;

	/**
	 *
	 * @param {Number} index 
	 */
	getGradientOpacityMaximumValue(index: number): number;

	/**
	 *
	 * @param {Number} index 
	 */
	getGradientOpacityMinimumOpacity(index: number): number;

	/**
	 *
	 * @param {Number} index 
	 */
	getGradientOpacityMinimumValue(index: number): number;

	/**
	 *
	 */
	getIndependentComponents(): boolean;

	/**
	 * Get the unit distance on which the scalar opacity transfer function is defined.
	 * @param {Number} index 
	 */
	getScalarOpacityUnitDistance(index: number): number;

	/**
	 * Get the currently set gray transfer function. Create one if none set.
	 * @param {Number} index 
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
	 * @param {Number} index 
	 */
	getRGBTransferFunction(index: number): any;

	/**
	 * Get the scalar opacity transfer function. Create one if none set.
	 * @param {Number} index 
	 */
	getScalarOpacity(index: number): any;

	/**
	 * Get the shading of a volume.
	 */
	getShade(): number;

	/**
	 *
	 */
	getSpecular(): number;

	/**
	 * Get the specular power.
	 */
	getSpecularPower(): number;

	/**
	 *
	 * @param {Number} index 
	 */
	getUseGradientOpacity(index: number): boolean;

	/**
	 *
	 */
	getUseLabelOutline(): boolean;

	/**
	 * Set the ambient lighting coefficient.
	 * @param {Number} ambient The ambient lighting coefficient.
	 */
	setAmbient(ambient: number): boolean;

	/**
	 * Set the diffuse lighting coefficient.
	 * @param {Number} diffuse The diffuse lighting coefficient.
	 */
	setDiffuse(diffuse: number): boolean;

	/**
	 *
	 * @param {Number} index 
	 * @param {Number} value
	 */
	setGradientOpacityMaximumOpacity(index: number, value: number): boolean;

	/**
	 *
	 * @param {Number} index 
	 * @param {Number} value
	 */
	setGradientOpacityMaximumValue(index: number, value: number): boolean;

	/**
	 *
	 * @param {Number} index 
	 * @param {Number} value
	 */
	setGradientOpacityMinimumOpacity(index: number, value: number): boolean;

	/**
	 *
	 * @param {Number} index 
	 * @param {Number} value
	 */
	setGradientOpacityMinimumValue(index: number, value: number): boolean;

	/**
	 * Set the color of a volume to a gray transfer function
	 * @param {Number} index 
	 * @param func
	 */
	setGrayTransferFunction(index: number, func: any): boolean;

	/**
	 * Does the data have independent components, or do some define color only?
	 * If IndependentComponents is On (the default) then each component will be
	 * independently passed through a lookup table to determine RGBA, shaded.
	 *
	 * Some volume Mappers can handle 1 to 4 component unsigned char or unsigned
	 * short data (see each mapper header file to determine functionality). If
	 * IndependentComponents is Off, then you must have either 2 or 4 component
	 * data. For 2 component data, the first is passed through the first color
	 * transfer function and the second component is passed through the first
	 * scalar opacity (and gradient opacity) transfer function. Normals will be
	 * generated off of the second component. When using gradient based opacity
	 * modulation, the gradients are computed off of the second component. For 4
	 * component data, the first three will directly represent RGB (no lookup
	 * table). The fourth component will be passed through the first scalar
	 * opacity transfer function for opacity and first gradient opacity transfer
	 * function for gradient based opacity modulation. Normals will be generated
	 * from the fourth component. When using gradient based opacity modulation,
	 * the gradients are computed off of the fourth component.
	 * @param {Boolean} independentComponents
	 */
	setIndependentComponents(independentComponents: boolean): boolean;

	/**
	 *
	 * @param {Number} labelOutlineThickness
	 */
	setLabelOutlineThickness(labelOutlineThickness: number): boolean;

	/**
	 *
	 * @param {Number} index 
	 * @param {Number} value
	 */
	setOpacityMode(index: number, value: number): boolean;

	/**
	 * Set the unit distance on which the scalar opacity transfer function is
	 * defined.
	 * @param {Number} index 
	 * @param {Number} value
	 */
	setScalarOpacityUnitDistance(index: number, value: number): boolean;

	/**
	 * Set the shading of a volume.
	 * 
	 * If shading is turned off, then the mapper for the volume will not perform
	 * shading calculations. If shading is turned on, the mapper may perform
	 * shading calculations - in some cases shading does not apply (for example,
	 * in a maximum intensity projection) and therefore shading will not be
	 * performed even if this flag is on. For a compositing type of mapper,
	 * turning shading off is generally the same as setting ambient=1,
	 * diffuse=0, specular=0. Shading can be independently turned on/off per
	 * component.
	 * @param {Number} shade
	 */
	setShade(shade: number): boolean;

	/**
	 *
	 * @param {Number} specular
	 */
	setSpecular(specular: number): boolean;

	/**
	 * Set the specular power.
	 * @param {Number} specularPower
	 */
	setSpecularPower(specularPower: number): boolean;

	/**
	 *
	 * @param {Number} index 
	 * @param {Number} value
	 */
	setUseGradientOpacity(index: number, value: number): boolean;

	/**
	 *
	 * @param {Boolean} useLabelOutline
	 */
	setUseLabelOutline(useLabelOutline: boolean): boolean;

	/**
	 * Set the color of a volume to an RGB transfer function
	 * @param {Number} index 
	 * @param func
	 */
	setRGBTransferFunction(index: number, func: any): boolean;

	/**
	 * Set the scalar opacity of a volume to a transfer function
	 * @param {Number} index 
	 * @param func
	 */
	setScalarOpacity(index: number, func: any): boolean;

	/**
	 * Set the scalar component weights.
	 * @param {Number} index 
	 * @param {Number} value
	 */
	setComponentWeight(index: number, value: number): boolean;

	/**
	 * Get the scalar component weights.
	 * @param {Number} index 
	 */
	getComponentWeight(index: number): number;

	/**
	 * Set the interpolation type for sampling a volume.
	 * @param {InterpolationType} interpolationType
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
	 * Get the interpolation type for sampling a volume.
	 */
	getInterpolationType(): InterpolationType;

	/**
	 * Get the interpolation type for sampling a volume as a string.
	 */
	getInterpolationTypeAsString(): string;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkVolumeProperty characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IVolumePropertyInitialValues} [initialValues] (default: {})
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
 * @example
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
	newInstance: typeof newInstance;
	extend: typeof extend;
	InterpolationType: typeof InterpolationType;
	OpacityMode: typeof OpacityMode;
};
export default vtkVolumeProperty;
