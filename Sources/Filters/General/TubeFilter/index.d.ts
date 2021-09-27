import { vtkAlgorithm, vtkObject } from "../../../interfaces";
import { DesiredOutputPrecision } from "../../../Common/DataModel/DataSetAttributes";

export enum VaryRadius {
	VARY_RADIUS_OFF,
	VARY_RADIUS_BY_SCALAR,
	VARY_RADIUS_BY_VECTOR,
	VARY_RADIUS_BY_ABSOLUTE_SCALAR
}

export enum GenerateTCoords {
	TCOORDS_OFF,
	TCOORDS_FROM_NORMALIZED_LENGTH,
	TCOORDS_FROM_LENGTH,
	TCOORDS_FROM_SCALARS
}

/**
 *
 */
export interface ITubeFilterInitialValues {
	outputPointsPrecision?: DesiredOutputPrecision,
	radius?: number;
	varyRadius?: VaryRadius,
	numberOfSides?: number;
	radiusFactor?: number;
	defaultNormal?: number[];
	useDefaultNormal?: boolean;
	sidesShareVertices?: boolean;
	capping?: boolean;
	onRatio?: number;
	offset?: number;
	generateTCoords?: GenerateTCoords,
	textureLength?: number;
}

type vtkTubeFilterBase = vtkObject & vtkAlgorithm;

export interface vtkTubeFilter extends vtkTubeFilterBase {

	/**
	 * Get the desired precision for the output types.
	 */
	getOutputPointsPrecision(): DesiredOutputPrecision;

	/**
	 * Get the minimum tube radius.
	 */
	getRadius(): number;

	/**
	 * Get variation of tube radius with scalar or vector values.
	 */
	getVaryRadius(): VaryRadius;

	/**
	 * Get the number of sides for the tube.
	 */
	getNumberOfSides(): number;

	/**
	 * Get the maximum tube radius in terms of a multiple of the minimum radius.
	 */
	getRadiusFactor(): number;

	/**
	 * Get the default normal value.
	 */
	getDefaultNormal(): number[];

	/**
	 * Get useDefaultNormal value.
	 */
	getUseDefaultNormal(): boolean;

	/**
	 * Get sidesShareVertices value.
	 */
	getSidesShareVertices(): boolean;

	/**
	 * Get whether the capping is enabled or not.
	 */
	getCapping(): boolean;

	/**
	 * Get onRatio value.
	 */
	getOnRatio(): number;

	/**
	 * Get offset value.
	 */
	getOffset(): number;

	/**
	 * Get generateTCoords value.
	 */
	getGenerateTCoords(): GenerateTCoords;

	/**
	 * Get textureLength value.
	 */
	getTextureLength(): number;

	/**
	 *
	 * @param inData 
	 * @param outData 
	 */
	requestData(inData: any, outData: any): void;

	/**
	 * Set the desired precision for the output types.
	 * @param {DesiredOutputPrecision} outputPointsPrecision 
	 */
	setOutputPointsPrecision(outputPointsPrecision: DesiredOutputPrecision): boolean;

	/**
	 * Set the minimum tube radius (minimum because the tube radius may vary).
	 * @param {Number} radius
	 */
	setRadius(radius: number): boolean;

	/**
	 * Enable or disable variation of tube radius with scalar or vector values.
	 * @param {VaryRadius} varyRadius 
	 */
	setVaryRadius(varyRadius: VaryRadius): boolean;

	/**
	 * Set the number of sides for the tube. At a minimum, number of sides is 3.
	 * @param {Number} numberOfSides 
	 */
	setNumberOfSides(numberOfSides: number): boolean;

	/**
	 * Set the maximum tube radius in terms of a multiple of the minimum radius.
	 * @param {Number} radiusFactor 
	 */
	setRadiusFactor(radiusFactor: number): boolean;

	/**
	 * Set the default normal to use if no normals are supplied. Requires that
	 * useDefaultNormal is set.
	 * @param defaultNormal 
	 */
	setDefaultNormal(defaultNormal: number[]): boolean;

	/**
	 * Control whether to use the defaultNormal.
	 * @param {Boolean} useDefaultNormal 
	 */
	setUseDefaultNormal(useDefaultNormal: boolean): boolean;

	/**
	 * Control whether the tube sides should share vertices. This creates
	 * independent strips, with constant normals so the tube is always faceted
	 * in appearance.
	 * @param {Boolean} sidesShareVertices 
	 */
	setSidesShareVertices(sidesShareVertices: boolean): boolean;

	/**
	 * Enable / disable capping the ends of the tube with polygons.
	 * @param {Boolean} capping 
	 */
	setCapping(capping: boolean): boolean;

	/**
	 * Control the stripping of tubes. If OnRatio is greater than 1, then every
	 * nth tube side is turned on, beginning with the offset side.
	 * @param {Number} onRatio 
	 */
	setOnRatio(onRatio: number): boolean;

	/**
	 * Control the stripping of tubes. The offset sets the first tube side that
	 * is visible. Offset is generally used with onRatio to create nifty
	 * stripping effects.
	 * @param {Number} offset 
	 */
	setOffset(offset: number): boolean;

	/**
	 * Control whether and how texture coordinates are produced. This is useful
	 * for stripping the tube with length textures, etc. If you use scalars to
	 * create the texture, the scalars are assumed to be monotonically
	 * increasing (or decreasing).
	 * @param {GenerateTCoords} generateTCoords 
	 */
	setGenerateTCoords(generateTCoords: GenerateTCoords): boolean;

	/**
	 * Control the conversion of units during texture coordinates calculation.
	 * The texture length indicates what length (whether calculated from scalars
	 * or length) is mapped to [0, 1) texture space.
	 * @param {Number} textureLength 
	 */
	setTextureLength(textureLength: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkTubeFilter characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ITubeFilterInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ITubeFilterInitialValues): void;

/**
 * Method used to create a new instance of vtkTubeFilter
 * @param {ITubeFilterInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ITubeFilterInitialValues): vtkTubeFilter;


/**
 * vtkTubeFilter - A filter that generates tubes around lines
 *
 * vtkTubeFilter is a filter that generates a tube around each input line.  The
 * tubes are made up of triangle strips and rotate around the tube with the
 * rotation of the line normals. (If no normals are present, they are computed
 * automatically.) The radius of the tube can be set to vary with scalar or
 * vector value. If the radius varies with scalar value the radius is linearly
 * adjusted. If the radius varies with vector value, a mass flux preserving
 * variation is used. The number of sides for the tube also can be specified.
 * You can also specify which of the sides are visible. This is useful for
 * generating interesting striping effects. Other options include the ability to
 * cap the tube and generate texture coordinates.  Texture coordinates can be
 * used with an associated texture map to create interesting effects such as
 * marking the tube with stripes corresponding to length or time.
 *
 * This filter is typically used to create thick or dramatic lines. Another
 * common use is to combine this filter with vtkStreamTracer to generate
 * streamtubes.
 *
 * !!! warning
 *     The number of tube sides must be greater than 3.
 *
 * !!! warning
 *     The input line must not have duplicate points, or normals at points that are
 *     parallel to the incoming/outgoing line segments. If a line does not meet this
 *     criteria, then that line is not tubed.
 */
export declare const vtkTubeFilter: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkTubeFilter;
